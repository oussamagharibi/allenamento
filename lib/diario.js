// Diario alimentare: somma di quello che si registra in un giorno, confronto con
// i target e indicazioni pratiche. Logica fissa, nessuna chiamata AI.
const db = require('../db');
const nutrizione = require('./nutrizione');
const A = require('./alimenti');
const C = require('./costanti');

// Nei giorni con allenamento servono piu carboidrati e piu acqua.
const EXTRA_CARBOIDRATI = 0.12;
const ACQUA_EXTRA_ML = C.ACQUA_EXTRA_ALLENAMENTO_ML;

// Si considera "in linea" tutto quello che sta fra il 90 e il 110% del target.
const SOGLIA_BASSA = 0.9;
const SOGLIA_ALTA = 1.1;

// Serve almeno questo numero di pasti per dare un giudizio sulla giornata.
const PASTI_MINIMI = 2;

// Idee semplici da suggerire, filtrate come tutto il resto con preferenze e allergie.
const IDEE = {
  proteine: [
    { nome: 'uno yogurt greco', contiene: ['latticini', 'lattosio'] },
    { nome: 'una porzione di legumi', contiene: ['legumi'] },
    { nome: 'del petto di pollo', contiene: ['carne'] },
    { nome: 'del tonno al naturale', contiene: ['pesce'] },
    { nome: 'due uova', contiene: ['uova'] },
    { nome: 'del tofu o del tempeh', contiene: ['soia'] },
    { nome: 'una manciata di semi di zucca', contiene: ['semi'] },
  ],
  carboidrati: [
    { nome: 'una porzione di riso', contiene: ['cereali'] },
    { nome: 'delle patate', contiene: [] },
    { nome: 'del pane', contiene: ['glutine', 'cereali'] },
    { nome: 'della frutta', contiene: [] },
  ],
  grassi: [
    { nome: 'un cucchiaio di olio extravergine', contiene: [] },
    { nome: 'mezzo avocado', contiene: [] },
    { nome: 'una manciata di frutta secca', contiene: ['frutta a guscio'] },
    { nome: 'dei semi di girasole', contiene: ['semi'] },
  ],
};

function arrotonda(n, passo) {
  const p = passo || 1;
  return Math.round(Number(n) / p) * p;
}

// Prima idea compatibile con preferenze e allergie della persona.
function idea(tipo, esclusi) {
  const compatibili = A.filtra(IDEE[tipo] || [], esclusi || []);
  return compatibili.length ? compatibili[0].nome : null;
}

// Target del giorno: quelli del piano, maggiorati se oggi ci si allena.
function targetDelGiorno(profilo, siAllena) {
  const piano = nutrizione.piano(profilo);
  const target = {
    minorenne: piano.minorenne,
    si_allena: Boolean(siAllena),
    calorie: piano.calorie.valore,
    metabolismo_basale: piano.calorie.metabolismo_basale,
    acqua_ml: arrotonda((piano.acqua.min_ml + piano.acqua.max_ml) / 2, 50),
    proteine_g: piano.proteine ? piano.proteine.medio_g : null,
    carboidrati_g: piano.carboidrati ? piano.carboidrati.medio_g : null,
    grassi_g: piano.grassi ? piano.grassi.medio_g : null,
  };

  if (siAllena) {
    target.acqua_ml += ACQUA_EXTRA_ML;
    if (target.carboidrati_g) {
      const extra = Math.round(target.carboidrati_g * EXTRA_CARBOIDRATI);
      target.carboidrati_g += extra;
      // Le calorie seguono i carboidrati in piu, altrimenti i conti non tornano.
      target.calorie = arrotonda(target.calorie + extra * 4, 10);
      target.carboidrati_extra_g = extra;
    }
  }

  return target;
}

function esitoDa(percentuale) {
  if (percentuale < SOGLIA_BASSA * 100) return 'poco';
  if (percentuale > SOGLIA_ALTA * 100) return 'troppo';
  return 'ok';
}

function messaggioAcqua(esito, mancano, target) {
  if (esito === 'ok') return 'Acqua ok, bravo.';
  if (esito === 'troppo') return 'Hai bevuto piu del previsto: nessun problema, basta che non sia tutto in una volta.';
  const litri = (mancano / 1000).toFixed(1).replace('.', ',');
  return 'Ti mancano circa ' + litri + ' L per arrivare a ' + (target / 1000).toFixed(1).replace('.', ',') +
    ' L: tieni una bottiglia a portata di mano.';
}

function messaggioMacro(chiave, esito, differenza, esclusi) {
  const nomi = { proteine: 'proteine', carboidrati: 'carboidrati', grassi: 'grassi' };
  const nome = nomi[chiave];

  if (esito === 'ok') return nome.charAt(0).toUpperCase() + nome.slice(1) + ' in linea con l obiettivo.';

  if (esito === 'poco') {
    const suggerimento = idea(chiave, esclusi);
    const quanto = 'Ti mancano circa ' + Math.round(differenza) + ' g di ' + nome;
    return suggerimento ? quanto + ': puoi aggiungere ' + suggerimento + '.' : quanto + '.';
  }

  return 'Sei sopra di circa ' + Math.round(Math.abs(differenza)) + ' g di ' + nome +
    ': niente di grave, domani puoi alleggerire un po le porzioni.';
}

function messaggioCalorie(esito, differenza, target) {
  if (esito === 'ok') return 'Calorie in linea con la giornata.';
  if (esito === 'poco') {
    return 'Hai mangiato circa ' + Math.round(differenza) + ' kcal meno del previsto: ' +
      'se hai ancora fame aggiungi qualcosa, il corpo lavora meglio con il pieno.';
  }
  return 'Sei sopra di circa ' + Math.round(Math.abs(differenza)) + ' kcal: capita, ' +
    'guarda l andamento della settimana piu che il singolo giorno.';
}

// Confronto di una voce con il suo target.
function voce(chiave, etichetta, valore, target, unita) {
  if (!target) return null;
  const percentuale = Math.round((valore / target) * 100);
  return {
    chiave,
    etichetta,
    valore: Math.round(valore),
    target: Math.round(target),
    unita,
    percentuale,
    differenza: target - valore,
    esito: esitoDa(percentuale),
  };
}

// Giornate molto sotto il metabolismo basale: piu di due sono un segnale da non
// trattare a colpi di numeri.
function segnaleSottoBasale(giorni, basale) {
  if (!basale) return false;
  const valutabili = (giorni || []).filter((g) => g.pasti >= PASTI_MINIMI);
  const moltoSotto = valutabili.filter((g) => g.calorie > 0 && g.calorie < basale * 0.8);
  return valutabili.length >= 3 && moltoSotto.length >= 3;
}

const MESSAGGIO_PRUDENTE =
  'Negli ultimi giorni i pasti registrati sono parecchio sotto il minimo di cui il tuo corpo ha bisogno. ' +
  'Qui preferisco non darti numeri: se ti va, parlane con un medico o con un nutrizionista, ' +
  'che possono aiutarti molto meglio di un app.';

// Valutazione della giornata.
// totali: { calorie, proteine, carboidrati, grassi, acqua_ml, pasti }
// storico: giorni precedenti, per riconoscere una tendenza
function valutaGiornata(profilo, totali, siAllena, storico) {
  const target = targetDelGiorno(profilo, siAllena);
  const esclusi = nutrizione.esclusioni(profilo);
  const base = {
    target,
    totali: {
      calorie: Math.round(totali.calorie || 0),
      proteine: Math.round(totali.proteine || 0),
      carboidrati: Math.round(totali.carboidrati || 0),
      grassi: Math.round(totali.grassi || 0),
      acqua_ml: Math.round(totali.acqua_ml || 0),
      pasti: Number(totali.pasti || 0),
    },
    voci: [],
  };

  // L acqua si puo giudicare sempre: non serve aver registrato i pasti.
  const acqua = voce('acqua', 'Acqua', base.totali.acqua_ml, target.acqua_ml, 'ml');
  if (acqua) {
    acqua.messaggio = messaggioAcqua(acqua.esito, acqua.differenza, target.acqua_ml);
    base.voci.push(acqua);
  }

  if (segnaleSottoBasale((storico || []).concat([{ calorie: base.totali.calorie, pasti: base.totali.pasti }]),
    target.metabolismo_basale)) {
    base.modalita = 'prudente';
    base.sufficiente = false;
    base.messaggio = MESSAGGIO_PRUDENTE;
    base.voci = base.voci.filter((v) => v.chiave === 'acqua');
    return base;
  }

  if (base.totali.pasti < PASTI_MINIMI) {
    base.modalita = 'insufficiente';
    base.sufficiente = false;
    base.messaggio = 'Dati insufficienti: registra almeno ' + PASTI_MINIMI +
      ' pasti per avere un quadro della giornata.';
    return base;
  }

  if (target.minorenne) {
    base.modalita = 'minorenne';
    base.sufficiente = true;
    base.messaggio = 'Hai meno di 18 anni: niente grammi da rincorrere. ' +
      'Guarda che nei pasti ci siano una fonte proteica, un cereale e della verdura.';
    return base;
  }

  base.modalita = 'completa';
  base.sufficiente = true;

  const calorie = voce('calorie', 'Calorie', base.totali.calorie, target.calorie, 'kcal');
  calorie.messaggio = messaggioCalorie(calorie.esito, calorie.differenza, target.calorie);
  // Non si invita mai a scendere sotto il metabolismo basale.
  if (calorie.esito === 'troppo' && base.totali.calorie <= target.metabolismo_basale) {
    calorie.esito = 'ok';
    calorie.messaggio = 'Calorie in linea: sotto il tuo metabolismo basale non bisogna scendere.';
  }
  base.voci.push(calorie);

  for (const chiave of ['proteine', 'carboidrati', 'grassi']) {
    const v = voce(chiave, chiave.charAt(0).toUpperCase() + chiave.slice(1),
      base.totali[chiave], target[chiave + '_g'], 'g');
    if (!v) continue;
    v.messaggio = messaggioMacro(chiave, v.esito, v.differenza, esclusi);
    base.voci.push(v);
  }

  const aPosto = base.voci.filter((v) => v.esito === 'ok').length;
  base.messaggio = aPosto === base.voci.length
    ? 'Giornata completa: tutto in linea.'
    : aPosto + ' voci su ' + base.voci.length + ' sono in linea. Le altre sono indicazioni, non voti.';

  return base;
}

// Ultimi giorni di diario: acqua, macro e se era un giorno di allenamento.
async function ultimiGiorni(userId, quanti) {
  const giorni = Number(quanti) || 7;
  return db.tutte(
    `SELECT to_char(g.giorno, 'YYYY-MM-DD') AS data,
            COALESCE(a.ml, 0)::int AS acqua_ml,
            COALESCE(p.pasti, 0)::int AS pasti,
            COALESCE(p.calorie, 0)::int AS calorie,
            COALESCE(p.proteine, 0)::int AS proteine,
            COALESCE(p.carboidrati, 0)::int AS carboidrati,
            COALESCE(p.grassi, 0)::int AS grassi,
            EXISTS(SELECT 1 FROM workouts w WHERE w.user_id = $1 AND w.data = g.giorno) AS allenamento,
            EXISTS(SELECT 1 FROM workouts w WHERE w.user_id = $1 AND w.data = g.giorno AND w.completato) AS completato
       FROM generate_series(CURRENT_DATE - ($2::int - 1), CURRENT_DATE, INTERVAL '1 day') AS g(giorno)
       LEFT JOIN (
         SELECT data, SUM(ml) AS ml FROM water_logs WHERE user_id = $1 GROUP BY data
       ) a ON a.data = g.giorno
       LEFT JOIN (
         SELECT data, COUNT(*) AS pasti, SUM(calorie) AS calorie, SUM(proteine) AS proteine,
                SUM(carboidrati) AS carboidrati, SUM(grassi) AS grassi
           FROM meal_logs WHERE user_id = $1 GROUP BY data
       ) p ON p.data = g.giorno
      ORDER BY g.giorno ASC`,
    [userId, giorni]
  );
}

// Riassunto della settimana per il coach AI: solo totali, nessuna immagine.
function riepilogoSettimana(giorni) {
  const valutabili = (giorni || []).filter((g) => g.pasti > 0 || g.acqua_ml > 0);
  if (!valutabili.length) return null;
  const somma = valutabili.reduce(function (acc, g) {
    acc.calorie += g.calorie || 0;
    acc.proteine += g.proteine || 0;
    acc.carboidrati += g.carboidrati || 0;
    acc.grassi += g.grassi || 0;
    acc.acqua_ml += g.acqua_ml || 0;
    return acc;
  }, { calorie: 0, proteine: 0, carboidrati: 0, grassi: 0, acqua_ml: 0 });

  const n = valutabili.length;
  return {
    giorni_registrati: n,
    media_calorie: Math.round(somma.calorie / n),
    media_proteine: Math.round(somma.proteine / n),
    media_carboidrati: Math.round(somma.carboidrati / n),
    media_grassi: Math.round(somma.grassi / n),
    media_acqua_ml: Math.round(somma.acqua_ml / n),
  };
}

module.exports = {
  EXTRA_CARBOIDRATI,
  ACQUA_EXTRA_ML,
  PASTI_MINIMI,
  SOGLIA_BASSA,
  SOGLIA_ALTA,
  IDEE,
  idea,
  targetDelGiorno,
  ultimiGiorni,
  valutaGiornata,
  riepilogoSettimana,
  segnaleSottoBasale,
};
