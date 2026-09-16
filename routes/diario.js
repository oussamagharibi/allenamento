// Diario alimentare: acqua bevuta e pasti registrati, con i totali del giorno
// confrontati con i target. Le miniature restano nel database e le vede solo
// il proprietario.
const express = require('express');
const db = require('../db');
const C = require('../lib/costanti');
const diario = require('../lib/diario');
const { validaAcqua, validaPasto, tipoImmagine } = require('../lib/validazione');
const { apiUtente } = require('../middleware/auth');
const { leggiProfilo } = require('./profilo');

const router = express.Router();
router.use(apiUtente);

const CAMPI_PASTO =
  "id, to_char(data, 'YYYY-MM-DD') AS data, tipo_pasto, descrizione, calorie, proteine, " +
  'carboidrati, grassi, fonte, confidenza, (thumbnail IS NOT NULL) AS ha_foto, created_at';

async function oggiIso() {
  const riga = await db.uno("SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS oggi");
  return riga.oggi;
}

// C e un allenamento in programma in questa data?
async function giornoDiAllenamento(userId, data) {
  const riga = await db.uno(
    'SELECT 1 AS c FROM workouts WHERE user_id = $1 AND data = $2::date LIMIT 1',
    [userId, data]
  );
  return Boolean(riga);
}

async function totaliDelGiorno(userId, data) {
  const acqua = await db.uno(
    'SELECT COALESCE(SUM(ml), 0)::int AS ml FROM water_logs WHERE user_id = $1 AND data = $2::date',
    [userId, data]
  );
  const pasti = await db.uno(
    `SELECT COUNT(*)::int AS pasti,
            COALESCE(SUM(calorie), 0)::int AS calorie,
            COALESCE(SUM(proteine), 0)::int AS proteine,
            COALESCE(SUM(carboidrati), 0)::int AS carboidrati,
            COALESCE(SUM(grassi), 0)::int AS grassi
       FROM meal_logs WHERE user_id = $1 AND data = $2::date`,
    [userId, data]
  );
  return {
    acqua_ml: acqua.ml,
    pasti: pasti.pasti,
    calorie: pasti.calorie,
    proteine: pasti.proteine,
    carboidrati: pasti.carboidrati,
    grassi: pasti.grassi,
  };
}

// La lettura degli ultimi giorni sta in lib/diario.js: la usa anche il coach AI.
const ultimiGiorni = diario.ultimiGiorni;

async function profiloObbligatorio(req, res) {
  const profilo = await leggiProfilo(req.session.userId);
  if (!profilo) {
    res.status(400).json({ errore: 'Prima compila il profilo: servono peso, eta e obiettivo.' });
    return null;
  }
  return profilo;
}

// --- Acqua ------------------------------------------------------------------

router.post('/acqua', async (req, res, next) => {
  try {
    const esito = validaAcqua(req.body);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });

    await db.query(
      'INSERT INTO water_logs (user_id, ml, data) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE))',
      [req.session.userId, esito.valori.ml, esito.valori.data || null]
    );

    const data = esito.valori.data || (await oggiIso());
    const totale = await db.uno(
      'SELECT COALESCE(SUM(ml), 0)::int AS ml FROM water_logs WHERE user_id = $1 AND data = $2::date',
      [req.session.userId, data]
    );
    res.json({ ok: true, aggiunti: esito.valori.ml, totale_ml: totale.ml, data });
  } catch (err) {
    next(err);
  }
});

// Annulla l ultima registrazione di oggi.
router.delete('/acqua/ultimo', async (req, res, next) => {
  try {
    const riga = await db.uno(
      `DELETE FROM water_logs WHERE id = (
         SELECT id FROM water_logs WHERE user_id = $1 AND data = CURRENT_DATE
          ORDER BY created_at DESC, id DESC LIMIT 1
       ) RETURNING ml`,
      [req.session.userId]
    );
    if (!riga) return res.status(404).json({ errore: 'Oggi non hai ancora registrato acqua.' });

    const totale = await db.uno(
      'SELECT COALESCE(SUM(ml), 0)::int AS ml FROM water_logs WHERE user_id = $1 AND data = CURRENT_DATE',
      [req.session.userId]
    );
    res.json({ ok: true, rimossi: riga.ml, totale_ml: totale.ml });
  } catch (err) {
    next(err);
  }
});

// --- Pasti ------------------------------------------------------------------

router.post('/pasto', async (req, res, next) => {
  try {
    const esito = validaPasto(req.body, C.TIPI_PASTO);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });
    const v = esito.valori;

    const riga = await db.uno(
      `INSERT INTO meal_logs (user_id, data, tipo_pasto, descrizione, calorie, proteine,
                              carboidrati, grassi, fonte, confidenza, thumbnail)
            VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING ` + CAMPI_PASTO,
      [
        req.session.userId, v.data || null, v.tipo_pasto, v.descrizione,
        v.calorie, v.proteine, v.carboidrati, v.grassi, v.fonte, v.confidenza, v.thumbnail,
      ]
    );
    res.json({ ok: true, pasto: riga });
  } catch (err) {
    next(err);
  }
});

router.delete('/pasto/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Pasto non valido.' });
    const riga = await db.uno('DELETE FROM meal_logs WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.session.userId,
    ]);
    if (!riga) return res.status(404).json({ errore: 'Pasto non trovato.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// La miniatura esce solo per il suo proprietario: il filtro su user_id e la garanzia.
router.get('/pasto/:id/foto', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Pasto non valido.' });
    const riga = await db.uno('SELECT thumbnail FROM meal_logs WHERE id = $1 AND user_id = $2', [
      id,
      req.session.userId,
    ]);
    if (!riga || !riga.thumbnail) return res.status(404).json({ errore: 'Nessuna foto per questo pasto.' });

    const tipo = tipoImmagine(riga.thumbnail) || 'image/jpeg';
    res.setHeader('Content-Type', tipo);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(riga.thumbnail);
  } catch (err) {
    next(err);
  }
});

// --- Riepiloghi -------------------------------------------------------------

router.get('/oggi', async (req, res, next) => {
  try {
    const profilo = await profiloObbligatorio(req, res);
    if (!profilo) return;

    const data = await oggiIso();
    const siAllena = await giornoDiAllenamento(req.session.userId, data);
    const totali = await totaliDelGiorno(req.session.userId, data);
    const storico = (await ultimiGiorni(req.session.userId, 7)).filter((g) => g.data !== data);

    const pasti = await db.tutte(
      'SELECT ' + CAMPI_PASTO + ' FROM meal_logs WHERE user_id = $1 AND data = $2::date ORDER BY created_at ASC',
      [req.session.userId, data]
    );

    res.json({
      data,
      si_allena: siAllena,
      totali,
      pasti,
      valutazione: diario.valutaGiornata(profilo, totali, siAllena, storico),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/settimana', async (req, res, next) => {
  try {
    const profilo = await profiloObbligatorio(req, res);
    if (!profilo) return;

    const giorni = await ultimiGiorni(req.session.userId, 7);
    const riposo = diario.targetDelGiorno(profilo, false);
    const allenamento = diario.targetDelGiorno(profilo, true);

    res.json({
      giorni: giorni.map(function (g) {
        const t = g.allenamento ? allenamento : riposo;
        return Object.assign({}, g, {
          target_acqua_ml: t.acqua_ml,
          target_calorie: t.calorie,
          target_proteine: t.proteine_g,
          target_carboidrati: t.carboidrati_g,
          target_grassi: t.grassi_g,
        });
      }),
      target: { riposo, allenamento },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.ultimiGiorni = ultimiGiorni;
module.exports.totaliDelGiorno = totaliDelGiorno;
module.exports.giornoDiAllenamento = giornoDiAllenamento;
