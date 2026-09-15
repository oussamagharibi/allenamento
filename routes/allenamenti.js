// Schede e allenamento del giorno.
const express = require('express');
const db = require('../db');
const E = require('../lib/esercizi');
const generatore = require('../lib/generatore');
const schede = require('../lib/schede');
const { validaSerie } = require('../lib/validazione');
const { apiUtente } = require('../middleware/auth');
const { leggiProfilo } = require('./profilo');

const router = express.Router();
router.use(apiUtente);

// Ogni lettura filtra sempre per user_id della sessione.
async function leggiAllenamento(userId, id) {
  return db.uno(
    'SELECT ' + schede.CAMPI_ALLENAMENTO + ' FROM workouts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
}

async function profiloObbligatorio(req, res) {
  const profilo = await leggiProfilo(req.session.userId);
  if (!profilo) {
    res.status(400).json({ errore: 'Prima compila il profilo: serve per creare la scheda.' });
    return null;
  }
  return profilo;
}

// Elenco delle sedute (per dashboard e storico).
router.get('/', async (req, res, next) => {
  try {
    const righe = await db.tutte(
      `SELECT id, to_char(data, 'YYYY-MM-DD') AS data, completato, titolo, origine,
              jsonb_array_length(esercizi) AS numero_esercizi
         FROM workouts WHERE user_id = $1
        ORDER BY data DESC, id DESC LIMIT 60`,
      [req.session.userId]
    );
    res.json({ allenamenti: righe });
  } catch (err) {
    next(err);
  }
});

// Sedute della settimana in corso e successive.
router.get('/settimana', async (req, res, next) => {
  try {
    const righe = await db.tutte(
      `SELECT id, to_char(data, 'YYYY-MM-DD') AS data, completato, titolo, origine,
              jsonb_array_length(esercizi) AS numero_esercizi
         FROM workouts
        WHERE user_id = $1 AND data >= CURRENT_DATE - INTERVAL '1 day'
        ORDER BY data ASC, id ASC LIMIT 14`,
      [req.session.userId]
    );
    res.json({ allenamenti: righe });
  } catch (err) {
    next(err);
  }
});

// Allenamento di oggi; se oggi e riposo restituisce il prossimo in programma.
router.get('/oggi', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    let allenamento = await db.uno(
      'SELECT ' + schede.CAMPI_ALLENAMENTO + ' FROM workouts WHERE user_id = $1 AND data = CURRENT_DATE ORDER BY completato ASC, id DESC LIMIT 1',
      [userId]
    );
    let oggi = Boolean(allenamento);
    if (!allenamento) {
      allenamento = await db.uno(
        'SELECT ' + schede.CAMPI_ALLENAMENTO + ' FROM workouts WHERE user_id = $1 AND data > CURRENT_DATE AND completato = FALSE ORDER BY data ASC, id ASC LIMIT 1',
        [userId]
      );
    }
    if (!allenamento) return res.json({ allenamento: null, oggi: false });
    res.json({ allenamento: await schede.conProgressione(userId, allenamento), oggi });
  } catch (err) {
    next(err);
  }
});

// Genera la scheda settimanale dai dati del profilo.
router.post('/genera', async (req, res, next) => {
  try {
    const profilo = await profiloObbligatorio(req, res);
    if (!profilo) return;
    // Il seme cambia a ogni generazione: la scheda varia senza perdere coerenza.
    const seme = Math.floor(Date.now() / 86400000) + Number(req.session.userId);
    const settimana = generatore.generaSettimana(profilo, { seme });
    const inseriti = await schede.salvaSettimana(req.session.userId, settimana, 'app');
    res.json({ ok: true, allenamenti: inseriti.map((a) => ({ id: a.id, data: a.data, titolo: a.titolo })) });
  } catch (err) {
    next(err);
  }
});

// Dettaglio di una seduta.
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Allenamento non valido.' });
    const allenamento = await leggiAllenamento(req.session.userId, id);
    if (!allenamento) return res.status(404).json({ errore: 'Allenamento non trovato.' });
    res.json({ allenamento: await schede.conProgressione(req.session.userId, allenamento) });
  } catch (err) {
    next(err);
  }
});

// Registra le serie svolte per un esercizio.
router.post('/:id/serie', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Allenamento non valido.' });
    const esito = validaSerie(req.body);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });

    const allenamento = await leggiAllenamento(req.session.userId, id);
    if (!allenamento) return res.status(404).json({ errore: 'Allenamento non trovato.' });

    const esercizi = Array.isArray(allenamento.esercizi) ? allenamento.esercizi.slice() : [];
    const indice = esito.valori.indice;
    if (!esercizi[indice]) return res.status(400).json({ errore: 'Esercizio non trovato.' });

    const aggiornato = Object.assign({}, esercizi[indice], { log: esito.valori.serie });
    // Il carico mostrato la volta successiva e il massimo effettivamente usato.
    const caricoMax = esito.valori.serie.reduce((max, s) => Math.max(max, Number(s.carico) || 0), 0);
    if (caricoMax > 0) aggiornato.carico = caricoMax;
    esercizi[indice] = aggiornato;

    await db.query('UPDATE workouts SET esercizi = $1 WHERE id = $2 AND user_id = $3', [
      JSON.stringify(esercizi),
      id,
      req.session.userId,
    ]);
    res.json({ ok: true, esercizio: aggiornato });
  } catch (err) {
    next(err);
  }
});

// Sostituisce un esercizio con l alternativa compatibile.
router.post('/:id/sostituisci', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const indice = Number(req.body && req.body.indice);
    if (!Number.isInteger(id) || !Number.isInteger(indice) || indice < 0) {
      return res.status(400).json({ errore: 'Richiesta non valida.' });
    }
    const profilo = await profiloObbligatorio(req, res);
    if (!profilo) return;

    const allenamento = await leggiAllenamento(req.session.userId, id);
    if (!allenamento) return res.status(404).json({ errore: 'Allenamento non trovato.' });

    const esercizi = Array.isArray(allenamento.esercizi) ? allenamento.esercizi.slice() : [];
    const attuale = esercizi[indice];
    if (!attuale) return res.status(400).json({ errore: 'Esercizio non trovato.' });

    const contesto = generatore.contestoDaProfilo(profilo);
    const giaPresenti = esercizi.map((e) => e && e.id).filter(Boolean);
    const nuovo = E.alternativa(attuale.id, contesto, giaPresenti);
    if (!nuovo) {
      return res.status(409).json({ errore: 'Nessuna alternativa disponibile con la tua attrezzatura.' });
    }

    esercizi[indice] = {
      id: nuovo.id,
      nome: nuovo.nome,
      gruppo: nuovo.gruppo,
      fase: attuale.fase,
      misura: nuovo.misura,
      serie: attuale.serie,
      ripetizioni: nuovo.misura === attuale.misura ? attuale.ripetizioni : (nuovo.misura === 'secondi' ? 30 : 12),
      carico: 0,
      recupero: attuale.recupero,
      note: 'Sostituisce ' + attuale.nome + '.',
      log: [],
    };

    await db.query('UPDATE workouts SET esercizi = $1 WHERE id = $2 AND user_id = $3', [
      JSON.stringify(esercizi),
      id,
      req.session.userId,
    ]);
    res.json({ ok: true, esercizio: esercizi[indice], indice });
  } catch (err) {
    next(err);
  }
});

// Segna la seduta come completata (o la riapre).
router.post('/:id/completa', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Allenamento non valido.' });
    const completato = req.body && req.body.completato === false ? false : true;
    const riga = await db.uno(
      'UPDATE workouts SET completato = $1 WHERE id = $2 AND user_id = $3 RETURNING ' + schede.CAMPI_ALLENAMENTO,
      [completato, id, req.session.userId]
    );
    if (!riga) return res.status(404).json({ errore: 'Allenamento non trovato.' });
    res.json({ ok: true, allenamento: riga });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
