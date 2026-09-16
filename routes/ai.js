// Coach AI: analisi dei progressi, generazione scheda e chat.
// Vengono inviati solo i dati dell utente in sessione e mai il suo nome.
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const db = require('../db');
const C = require('../lib/costanti');
const calcoli = require('../lib/calcoli');
const E = require('../lib/esercizi');
const generatore = require('../lib/generatore');
const schede = require('../lib/schede');
const nutrizione = require('../lib/nutrizione');
const diario = require('../lib/diario');
const prompt = require('../lib/prompt');
const { tipoImmagine } = require('../lib/validazione');
const { apiUtente } = require('../middleware/auth');
const { leggiProfilo } = require('./profilo');

const router = express.Router();
router.use(apiUtente);

const LIMITE = C.LIMITE_AI_GIORNALIERO;
const LIMITE_FOTO = C.LIMITE_FOTO_GIORNALIERO;
const MAX_IMMAGINE_BYTE = 2 * 1024 * 1024;
const TIPI_IMMAGINE = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_TOKEN_TESTO = 1500;
const MAX_TOKEN_SCHEDA = 2500;
const MAX_TOKEN_FOTO = 1000;

let clienteAi = null;

function aiConfigurata() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function modelloAttuale() {
  return process.env.CLAUDE_MODEL || 'claude-sonnet-5';
}

function cliente() {
  if (!clienteAi) {
    clienteAi = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return clienteAi;
}

// --- Limite giornaliero -----------------------------------------------------

// Incrementa il contatore solo se c e ancora spazio: il controllo e atomico.
// Le analisi delle foto hanno un tipo a parte, quindi un limite tutto loro.
async function consumaRichiesta(userId, tipo, limite) {
  const riga = await db.uno(
    `INSERT INTO ai_usage (user_id, data, tipo, conteggio) VALUES ($1, CURRENT_DATE, $2, 1)
     ON CONFLICT (user_id, data, tipo) DO UPDATE SET conteggio = ai_usage.conteggio + 1
        WHERE ai_usage.conteggio < $3
     RETURNING conteggio`,
    [userId, tipo || 'generale', limite || LIMITE]
  );
  return riga ? riga.conteggio : null;
}

// Se la chiamata non e mai partita, il tentativo non va contato.
async function rimborsaRichiesta(userId, tipo) {
  await db
    .query(
      `UPDATE ai_usage SET conteggio = GREATEST(0, conteggio - 1)
        WHERE user_id = $1 AND data = CURRENT_DATE AND tipo = $2`,
      [userId, tipo || 'generale']
    )
    .catch(function (err) {
      console.error('[ai] impossibile rimborsare la richiesta:', err.message);
    });
}

async function usoOggi(userId) {
  const righe = await db.tutte(
    'SELECT tipo, conteggio FROM ai_usage WHERE user_id = $1 AND data = CURRENT_DATE',
    [userId]
  );
  const per = {};
  for (const r of righe) per[r.tipo] = Number(r.conteggio);
  const usate = per.generale || 0;
  const foto = per.foto || 0;
  return {
    usate,
    limite: LIMITE,
    restanti: Math.max(0, LIMITE - usate),
    foto_usate: foto,
    foto_limite: LIMITE_FOTO,
    foto_restanti: Math.max(0, LIMITE_FOTO - foto),
  };
}

// --- Chiamata al modello ----------------------------------------------------

async function chiamaClaude(etichetta, sistema, messaggi, maxTokens) {
  const modello = modelloAttuale();
  const parametri = {
    model: modello,
    max_tokens: maxTokens,
    system: sistema,
    messages: messaggi,
  };
  // I modelli Fable e Mythos rifiutano il parametro thinking (ragionano sempre).
  // Sugli altri lo spegniamo per lasciare tutti i token disponibili alla risposta.
  if (!/^claude-(fable|mythos)/.test(modello)) {
    parametri.thinking = { type: 'disabled' };
  }

  const risposta = await cliente().messages.create(parametri);
  const uso = risposta.usage || {};
  // Log dei token: mai la chiave.
  console.log(
    '[ai] ' + etichetta + ' modello=' + modello +
    ' token_in=' + (uso.input_tokens || 0) +
    ' token_out=' + (uso.output_tokens || 0) +
    ' stop=' + risposta.stop_reason
  );

  if (risposta.stop_reason === 'refusal') {
    const errore = new Error('Il modello ha preferito non rispondere a questa richiesta.');
    errore.rifiuto = true;
    throw errore;
  }

  const testo = (risposta.content || [])
    .filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; })
    .join('\n')
    .trim();

  return { testo, uso, modello, troncata: risposta.stop_reason === 'max_tokens' };
}

function rispondiErroreAi(err, res) {
  if (err && err.rifiuto) {
    return res.status(422).json({ errore: err.message });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    console.error('[ai] chiave non valida o non autorizzata');
    return res.status(502).json({ errore: 'La chiave AI non e valida: controlla la configurazione.' });
  }
  if (err instanceof Anthropic.RateLimitError) {
    return res.status(429).json({ errore: 'Il servizio AI e occupato. Riprova tra un minuto.' });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return res.status(502).json({ errore: 'Non riesco a contattare il servizio AI. Riprova.' });
  }
  if (err instanceof Anthropic.APIError) {
    console.error('[ai] errore API', err.status, err.message);
    return res.status(502).json({ errore: 'Il servizio AI ha risposto con un errore. Riprova piu tardi.' });
  }
  return null;
}

// --- Dati dell utente -------------------------------------------------------

async function contestoUtente(userId) {
  const profilo = await leggiProfilo(userId);
  if (!profilo) return null;

  const pesi = await db.tutte(
    `SELECT to_char(data, 'YYYY-MM-DD') AS data, peso::float AS peso, misure
       FROM weight_logs WHERE user_id = $1 ORDER BY data DESC, id DESC LIMIT 30`,
    [userId]
  );
  const allenamenti = await db.tutte(
    `SELECT to_char(data, 'YYYY-MM-DD') AS data, titolo, completato, esercizi
       FROM workouts WHERE user_id = $1 ORDER BY data DESC, id DESC LIMIT 20`,
    [userId]
  );

  // Solo i totali degli ultimi 7 giorni: nessuna immagine lascia mai il server.
  const giorniDiario = await diario.ultimiGiorni(userId, 7);

  const contestoEsercizi = generatore.contestoDaProfilo(profilo);
  return {
    diario: diario.riepilogoSettimana(giorniDiario),
    profilo,
    riepilogo: calcoli.riepilogo(profilo),
    // Serve sia alla rotta alimentazione sia alla chat, che puo parlare di cibo.
    nutrizione: nutrizione.piano(profilo),
    allergeni: C.allergeniDaTesto(profilo.allergie),
    pesi: pesi.slice().reverse(),
    allenamenti: allenamenti.slice().reverse(),
    attrezzatura: contestoEsercizi.attrezzatura,
    zone: contestoEsercizi.zone,
    esercizi: contestoEsercizi,
  };
}

// --- Scheda generata dall AI ------------------------------------------------

function normalizza(testo) {
  return String(testo == null ? '' : testo)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Esercizi che il modello puo usare: solo quelli compatibili con luogo,
// attrezzatura e infortuni.
function ammessi(contesto) {
  const lista = E.compatibili(contesto.esercizi, null).filter(function (e) {
    return e.tipo !== 'riscaldamento' && e.tipo !== 'stretching';
  });
  const indice = {};
  for (const e of lista) indice[normalizza(e.nome)] = e;
  return { lista, indice };
}

function elencoPerPrompt(lista) {
  const perGruppo = {};
  for (const e of lista) {
    if (!perGruppo[e.gruppo]) perGruppo[e.gruppo] = [];
    perGruppo[e.gruppo].push(e.nome);
  }
  return Object.keys(perGruppo)
    .map(function (g) { return g + ': ' + perGruppo[g].join(' | '); })
    .join('\n');
}

// Rimuove eventuali blocchi di codice e prende il primo oggetto JSON.
function estraiJson(testo) {
  let t = String(testo == null ? '' : testo).trim();
  t = t.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '').trim();
  const inizio = t.indexOf('{');
  const fine = t.lastIndexOf('}');
  if (inizio !== -1 && fine > inizio) t = t.slice(inizio, fine + 1);
  return t;
}

function intero(valore, min, max, predefinito) {
  const n = Math.round(Number(valore));
  if (!isFinite(n)) return predefinito;
  return Math.min(max, Math.max(min, n));
}

// Controlla la struttura della scheda e la traduce nel formato di workouts.esercizi.
function validaSchedaAi(oggetto, profilo, indice) {
  const errori = [];
  const avvisi = [];

  const grezza = oggetto && Array.isArray(oggetto.scheda)
    ? oggetto.scheda
    : (Array.isArray(oggetto) ? oggetto : null);

  if (!grezza || !grezza.length) {
    return { ok: false, errori: ['La risposta non contiene una scheda leggibile.'], avvisi };
  }
  if (grezza.length > 7) {
    avvisi.push('La scheda proposta aveva piu di 7 sedute: ho tenuto le prime 7.');
  }

  const giorni = [];
  grezza.slice(0, 7).forEach(function (giorno, i) {
    const esercizi = giorno && Array.isArray(giorno.esercizi) ? giorno.esercizi : null;
    if (!esercizi || !esercizi.length) {
      avvisi.push('Seduta ' + (i + 1) + ' senza esercizi: scartata.');
      return;
    }
    const voci = [];
    for (const grezzo of esercizi.slice(0, 15)) {
      const nome = grezzo && grezzo.nome;
      const trovato = indice[normalizza(nome)];
      if (!trovato) {
        avvisi.push('Esercizio non compatibile o sconosciuto, scartato: ' + String(nome).slice(0, 40));
        continue;
      }
      const misura = trovato.misura;
      voci.push({
        id: trovato.id,
        nome: trovato.nome,
        gruppo: trovato.gruppo,
        fase: 'principale',
        misura: misura,
        serie: intero(grezzo.serie, 1, 6, 3),
        ripetizioni: intero(grezzo.ripetizioni, 1, misura === 'secondi' ? 600 : 100, misura === 'secondi' ? 30 : 12),
        carico: Math.min(500, Math.max(0, Number(grezzo.carico) || 0)),
        recupero: intero(grezzo.recupero, 0, 240, 60),
        note: '',
        log: [],
      });
    }
    if (!voci.length) {
      avvisi.push('Seduta ' + (i + 1) + ': nessun esercizio utilizzabile, scartata.');
      return;
    }
    giorni.push({
      giorno: giorni.length + 1,
      titolo: String((giorno && giorno.titolo) || 'Seduta ' + (giorni.length + 1)).slice(0, 60),
      esercizi: voci,
    });
  });

  if (!giorni.length) errori.push('Nessuna seduta valida nella scheda proposta.');
  return { ok: errori.length === 0, errori, avvisi, giorni };
}

// --- Rotte ------------------------------------------------------------------

router.get('/stato', async (req, res, next) => {
  try {
    const uso = await usoOggi(req.session.userId);
    res.json({
      configurata: aiConfigurata(),
      modello: aiConfigurata() ? modelloAttuale() : null,
      usate: uso.usate,
      restanti: uso.restanti,
      limite: uso.limite,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/storico', async (req, res, next) => {
  try {
    const righe = await db.tutte(
      `SELECT id, tipo, contenuto, created_at FROM ai_reports
        WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.session.userId]
    );
    res.json({ report: righe });
  } catch (err) {
    next(err);
  }
});

// Controlli comuni a tutte le rotte che chiamano il modello.
async function preparaChiamata(req, res, opzioni) {
  if (!aiConfigurata()) {
    res.status(503).json({ errore: 'AI non configurata', configurata: false });
    return null;
  }
  const contesto = await contestoUtente(req.session.userId);
  if (!contesto) {
    res.status(400).json({ errore: 'Prima compila il profilo: al coach servono i tuoi dati.' });
    return null;
  }
  const tipo = opzioni && opzioni.tipo === 'foto' ? 'foto' : 'generale';
  const limite = tipo === 'foto' ? LIMITE_FOTO : LIMITE;
  const conteggio = await consumaRichiesta(req.session.userId, tipo, limite);
  if (conteggio === null) {
    res.status(429).json({
      errore: tipo === 'foto'
        ? 'Hai esaurito le ' + LIMITE_FOTO + ' analisi foto di oggi. Riprova domani.'
        : 'Hai esaurito le ' + LIMITE + ' richieste AI di oggi. Riprova domani.',
      restanti: 0,
      limite,
    });
    return null;
  }
  return { contesto, tipo, restanti: Math.max(0, limite - conteggio) };
}

// Analisi dei progressi.
router.post('/analisi', async (req, res, next) => {
  const preparata = await preparaChiamata(req, res).catch(function (err) { next(err); return null; });
  if (!preparata) return;

  try {
    const dati = prompt.datiUtente(preparata.contesto);
    const risposta = await chiamaClaude(
      'analisi',
      prompt.sistemaAnalisi(),
      [{ role: 'user', content: 'Questi sono i miei dati in JSON:\n' + dati + '\n\nAnalizza i miei progressi.' }],
      MAX_TOKEN_TESTO
    );
    if (!risposta.testo) {
      await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
      return res.status(502).json({ errore: 'Il coach non ha prodotto testo. Riprova.' });
    }

    const salvato = await db.uno(
      `INSERT INTO ai_reports (user_id, tipo, contenuto) VALUES ($1, 'analisi', $2)
       RETURNING id, tipo, contenuto, created_at`,
      [req.session.userId, risposta.testo]
    );

    res.json({
      ok: true,
      report: salvato,
      troncata: risposta.troncata,
      restanti: preparata.restanti,
      token: { ingresso: risposta.uso.input_tokens || 0, uscita: risposta.uso.output_tokens || 0 },
    });
  } catch (err) {
    await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
    if (rispondiErroreAi(err, res)) return;
    next(err);
  }
});

// Scheda settimanale generata dall AI: restituisce solo l anteprima.
router.post('/scheda', async (req, res, next) => {
  const preparata = await preparaChiamata(req, res).catch(function (err) { next(err); return null; });
  if (!preparata) return;

  try {
    const contesto = preparata.contesto;
    const consentiti = ammessi(contesto);
    if (!consentiti.lista.length) {
      await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
      return res.status(400).json({ errore: 'Con questa attrezzatura e questi infortuni non trovo esercizi utilizzabili.' });
    }

    const risposta = await chiamaClaude(
      'scheda',
      prompt.sistemaScheda(contesto.profilo, elencoPerPrompt(consentiti.lista)),
      [{ role: 'user', content: 'Questi sono i miei dati in JSON:\n' + prompt.datiUtente(contesto) + '\n\nCreami la scheda settimanale.' }],
      MAX_TOKEN_SCHEDA
    );

    let oggetto = null;
    try {
      oggetto = JSON.parse(estraiJson(risposta.testo));
    } catch (err) {
      console.error('[ai] scheda: JSON non valido (' + err.message + ')');
      return res.status(422).json({
        errore: 'Il coach ha risposto in un formato non valido. Riprova, oppure usa la scheda automatica.',
        restanti: preparata.restanti,
      });
    }

    const esito = validaSchedaAi(oggetto, contesto.profilo, consentiti.indice);
    if (!esito.ok) {
      return res.status(422).json({
        errore: esito.errori[0] || 'Scheda non valida.',
        avvisi: esito.avvisi,
        restanti: preparata.restanti,
      });
    }

    await db.query(
      `INSERT INTO ai_reports (user_id, tipo, contenuto) VALUES ($1, 'scheda', $2)`,
      [req.session.userId, JSON.stringify({ giorni: esito.giorni, avvisi: esito.avvisi })]
    );

    res.json({
      ok: true,
      scheda: esito.giorni,
      avvisi: esito.avvisi,
      troncata: risposta.troncata,
      restanti: preparata.restanti,
      token: { ingresso: risposta.uso.input_tokens || 0, uscita: risposta.uso.output_tokens || 0 },
    });
  } catch (err) {
    await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
    if (rispondiErroreAi(err, res)) return;
    next(err);
  }
});

// Accetta l anteprima: nessuna chiamata al modello, quindi nessun consumo.
router.post('/scheda/accetta', async (req, res, next) => {
  try {
    const contesto = await contestoUtente(req.session.userId);
    if (!contesto) return res.status(400).json({ errore: 'Prima compila il profilo.' });

    const consentiti = ammessi(contesto);
    const esito = validaSchedaAi({ scheda: req.body && req.body.scheda }, contesto.profilo, consentiti.indice);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0] || 'Scheda non valida.' });

    const date = generatore.datePerSettimana(esito.giorni.length, generatore.oggiIso());
    const settimana = esito.giorni.map(function (giorno, i) {
      return {
        data: date[i] || generatore.dataPiuGiorni(generatore.oggiIso(), i),
        titolo: giorno.titolo,
        // Riscaldamento e stretching li aggiunge sempre l applicazione.
        esercizi: generatore.componiSeduta(contesto.esercizi, contesto.profilo, giorno.esercizi, 11 + i * 5),
      };
    });

    const inseriti = await schede.salvaSettimana(req.session.userId, settimana, 'ai');
    res.json({ ok: true, allenamenti: inseriti.map((a) => ({ id: a.id, data: a.data, titolo: a.titolo })) });
  } catch (err) {
    next(err);
  }
});

// Piano pasti di una giornata, costruito sul profilo e sulle sue preferenze.
router.post('/alimentazione', async (req, res, next) => {
  const preparata = await preparaChiamata(req, res).catch(function (err) { next(err); return null; });
  if (!preparata) return;

  try {
    const contesto = preparata.contesto;
    const risposta = await chiamaClaude(
      'alimentazione',
      prompt.sistemaAlimentazione(contesto.profilo, contesto.nutrizione),
      [{ role: 'user', content: 'Questi sono i miei dati in JSON:\n' + prompt.datiUtente(contesto) +
        '\n\nProponimi i pasti di una giornata.' }],
      MAX_TOKEN_TESTO
    );
    if (!risposta.testo) {
      await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
      return res.status(502).json({ errore: 'Il coach non ha prodotto testo. Riprova.' });
    }

    const salvato = await db.uno(
      `INSERT INTO ai_reports (user_id, tipo, contenuto) VALUES ($1, 'alimentazione', $2)
       RETURNING id, tipo, contenuto, created_at`,
      [req.session.userId, risposta.testo]
    );

    res.json({
      ok: true,
      report: salvato,
      troncata: risposta.troncata,
      restanti: preparata.restanti,
      token: { ingresso: risposta.uso.input_tokens || 0, uscita: risposta.uso.output_tokens || 0 },
    });
  } catch (err) {
    await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
    if (rispondiErroreAi(err, res)) return;
    next(err);
  }
});

// --- Analisi di una foto del pasto ------------------------------------------

// Limiti realistici per un singolo pasto: quello che esce fuori scala viene riportato dentro.
const LIMITI_PASTO = { calorie: 3000, proteine: 300, carboidrati: 600, grassi: 300 };

function numeroInScala(valore, massimo) {
  const n = Math.round(Number(valore));
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(massimo, n);
}

// Controlla la risposta del modello e la riporta in un formato sicuro.
function validaPastoAi(oggetto) {
  if (!oggetto || typeof oggetto !== 'object') {
    return { ok: false, errore: 'La risposta non contiene i dati del pasto.' };
  }

  const descrizione = String(oggetto.descrizione || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!descrizione) return { ok: false, errore: 'Il coach non ha riconosciuto il piatto.' };

  const alimenti = (Array.isArray(oggetto.alimenti) ? oggetto.alimenti : [])
    .slice(0, 15)
    .map(function (a) {
      const nome = String((a && a.nome) || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      if (!nome) return null;
      return { nome, porzione_g: numeroInScala(a && a.porzione_g, 2000) };
    })
    .filter(Boolean);

  const confidenza = String(oggetto.confidenza || '').toLowerCase().trim();

  return {
    ok: true,
    bozza: {
      descrizione,
      alimenti,
      calorie: numeroInScala(oggetto.calorie, LIMITI_PASTO.calorie),
      proteine: numeroInScala(oggetto.proteine, LIMITI_PASTO.proteine),
      carboidrati: numeroInScala(oggetto.carboidrati, LIMITI_PASTO.carboidrati),
      grassi: numeroInScala(oggetto.grassi, LIMITI_PASTO.grassi),
      confidenza: ['bassa', 'media', 'alta'].indexOf(confidenza) !== -1 ? confidenza : 'bassa',
      fonte: 'foto_ai',
    },
  };
}

// La foto viene guardata e basta: non viene salvata da nessuna parte.
// A salvare la miniatura da 200px ci pensa il diario, se l utente conferma.
router.post('/pasto', async (req, res, next) => {
  const grezza = String((req.body && req.body.immagine) || '').replace(/^data:image\/[a-z+]+;base64,/, '');
  if (!grezza) return res.status(400).json({ errore: 'Manca l immagine da analizzare.' });

  let immagine = null;
  try {
    immagine = Buffer.from(grezza, 'base64');
  } catch (err) {
    immagine = null;
  }
  if (!immagine || !immagine.length) {
    return res.status(400).json({ errore: 'Immagine non leggibile.' });
  }
  if (immagine.length > MAX_IMMAGINE_BYTE) {
    return res.status(413).json({ errore: 'La foto supera i 2 MB: riprova, verra ridotta automaticamente.' });
  }
  const tipo = tipoImmagine(immagine);
  if (!tipo || TIPI_IMMAGINE.indexOf(tipo) === -1) {
    return res.status(415).json({ errore: 'Formato non supportato: servono JPEG, PNG o WebP.' });
  }

  const preparata = await preparaChiamata(req, res, { tipo: 'foto' }).catch(function (err) { next(err); return null; });
  if (!preparata) return;

  try {
    const contesto = preparata.contesto;
    const risposta = await chiamaClaude(
      'foto pasto',
      prompt.sistemaFoto(contesto.nutrizione),
      [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: tipo, data: immagine.toString('base64') } },
          { type: 'text', text: 'Stima il contenuto di questo pasto e rispondi solo con il JSON richiesto.' },
        ],
      }],
      MAX_TOKEN_FOTO
    );

    let oggetto = null;
    try {
      oggetto = JSON.parse(estraiJson(risposta.testo));
    } catch (err) {
      console.error('[ai] foto pasto: JSON non valido (' + err.message + ')');
      return res.status(422).json({
        errore: 'Il coach ha risposto in un formato non valido. Riprova o inserisci il pasto a mano.',
        restanti: preparata.restanti,
      });
    }

    const esito = validaPastoAi(oggetto);
    if (!esito.ok) {
      return res.status(422).json({ errore: esito.errore, restanti: preparata.restanti });
    }

    res.json({
      ok: true,
      bozza: esito.bozza,
      restanti: preparata.restanti,
      limite: LIMITE_FOTO,
      token: { ingresso: risposta.uso.input_tokens || 0, uscita: risposta.uso.output_tokens || 0 },
    });
  } catch (err) {
    await rimborsaRichiesta(req.session.userId, 'foto');
    if (rispondiErroreAi(err, res)) return;
    next(err);
  }
});

// Chat libera con i dati dell utente come contesto.
router.post('/chat', async (req, res, next) => {
  const domanda = String((req.body && req.body.domanda) || '').trim().slice(0, 600);
  if (domanda.length < 3) {
    return res.status(400).json({ errore: 'Scrivi una domanda un po piu lunga.' });
  }

  const preparata = await preparaChiamata(req, res).catch(function (err) { next(err); return null; });
  if (!preparata) return;

  try {
    // Le ultime battute della conversazione, se il client le manda.
    const precedenti = Array.isArray(req.body.storico) ? req.body.storico.slice(-6) : [];
    const messaggi = [
      {
        role: 'user',
        content: 'Questi sono i miei dati in JSON, usali se servono:\n' + prompt.datiUtente(preparata.contesto),
      },
      { role: 'assistant', content: 'Dati ricevuti. Dimmi pure.' },
    ];
    for (const m of precedenti) {
      const ruolo = m && m.ruolo === 'assistant' ? 'assistant' : 'user';
      const testo = String((m && m.testo) || '').trim().slice(0, 1200);
      if (testo) messaggi.push({ role: ruolo, content: testo });
    }
    messaggi.push({ role: 'user', content: domanda });

    const risposta = await chiamaClaude('chat', prompt.sistemaChat(), messaggi, MAX_TOKEN_TESTO);
    if (!risposta.testo) {
      await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
      return res.status(502).json({ errore: 'Il coach non ha risposto. Riprova.' });
    }

    res.json({
      ok: true,
      risposta: risposta.testo,
      troncata: risposta.troncata,
      restanti: preparata.restanti,
      token: { ingresso: risposta.uso.input_tokens || 0, uscita: risposta.uso.output_tokens || 0 },
    });
  } catch (err) {
    await rimborsaRichiesta(req.session.userId, preparata ? preparata.tipo : 'generale');
    if (rispondiErroreAi(err, res)) return;
    next(err);
  }
});

module.exports = router;
module.exports.validaSchedaAi = validaSchedaAi;
module.exports.validaPastoAi = validaPastoAi;
module.exports.estraiJson = estraiJson;
module.exports.normalizza = normalizza;
