// Progressi: registro di peso e misure, storico allenamenti e streak.
const express = require('express');
const db = require('../db');
const { validaPeso } = require('../lib/validazione');
const { apiUtente } = require('../middleware/auth');

const router = express.Router();
router.use(apiUtente);

function giorniDiDifferenza(a, b) {
  const primo = new Date(a + 'T12:00:00');
  const secondo = new Date(b + 'T12:00:00');
  return Math.round((primo - secondo) / 86400000);
}

// Streak: giorni consecutivi con almeno una seduta completata.
// Vale anche se oggi non ti sei ancora allenato ma ieri si.
function calcolaStreak(dateCompletate, oggi) {
  const uniche = Array.from(new Set(dateCompletate)).sort();
  if (!uniche.length) return { attuale: 0, migliore: 0, ultima: null };

  let migliore = 1;
  let corsa = 1;
  for (let i = 1; i < uniche.length; i++) {
    if (giorniDiDifferenza(uniche[i], uniche[i - 1]) === 1) corsa++;
    else corsa = 1;
    if (corsa > migliore) migliore = corsa;
  }

  const decrescenti = uniche.slice().reverse();
  const distanzaDaOggi = giorniDiDifferenza(oggi, decrescenti[0]);
  let attuale = 0;
  if (distanzaDaOggi <= 1) {
    attuale = 1;
    for (let i = 1; i < decrescenti.length; i++) {
      if (giorniDiDifferenza(decrescenti[i - 1], decrescenti[i]) === 1) attuale++;
      else break;
    }
  }
  return { attuale, migliore, ultima: decrescenti[0] };
}

router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;

    const pesi = await db.tutte(
      `SELECT id, to_char(data, 'YYYY-MM-DD') AS data, peso::float AS peso, misure
         FROM weight_logs WHERE user_id = $1
        ORDER BY data ASC, id ASC LIMIT 400`,
      [userId]
    );

    const allenamenti = await db.tutte(
      `SELECT id, to_char(data, 'YYYY-MM-DD') AS data, completato, titolo, origine,
              jsonb_array_length(esercizi) AS numero_esercizi
         FROM workouts WHERE user_id = $1
        ORDER BY data DESC, id DESC LIMIT 60`,
      [userId]
    );

    const completate = await db.tutte(
      `SELECT DISTINCT to_char(data, 'YYYY-MM-DD') AS data
         FROM workouts WHERE user_id = $1 AND completato = TRUE
        ORDER BY data DESC LIMIT 400`,
      [userId]
    );

    const oggiRiga = await db.uno("SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS oggi");
    const streak = calcolaStreak(completate.map((r) => r.data), oggiRiga.oggi);

    const settimana = await db.uno(
      `SELECT COUNT(*)::int AS fatte FROM workouts
        WHERE user_id = $1 AND completato = TRUE AND data >= CURRENT_DATE - INTERVAL '6 days'`,
      [userId]
    );

    const variazione = pesi.length > 1 ? Math.round((pesi[pesi.length - 1].peso - pesi[0].peso) * 10) / 10 : 0;

    res.json({
      pesi,
      allenamenti,
      streak,
      riassunto: {
        totale_completati: completate.length,
        questa_settimana: settimana.fatte,
        peso_iniziale: pesi.length ? pesi[0].peso : null,
        peso_attuale: pesi.length ? pesi[pesi.length - 1].peso : null,
        variazione,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Nuova misurazione di peso (e misure facoltative).
router.post('/peso', async (req, res, next) => {
  try {
    const esito = validaPeso(req.body);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });
    const v = esito.valori;

    const riga = await db.uno(
      `INSERT INTO weight_logs (user_id, peso, misure, data)
            VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE))
       RETURNING id, to_char(data, 'YYYY-MM-DD') AS data, peso::float AS peso, misure`,
      [req.session.userId, v.peso, JSON.stringify(v.misure), v.data || null]
    );

    // Il profilo segue l ultima misurazione, cosi BMI e calorie restano aggiornati.
    await db.query(
      `UPDATE profiles SET peso = $1, updated_at = now()
        WHERE user_id = $2
          AND NOT EXISTS (
            SELECT 1 FROM weight_logs w
             WHERE w.user_id = $2 AND (w.data > $3::date OR (w.data = $3::date AND w.id > $4))
          )`,
      [v.peso, req.session.userId, riga.data, riga.id]
    );

    res.json({ ok: true, misurazione: riga });
  } catch (err) {
    next(err);
  }
});

router.delete('/peso/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Misurazione non valida.' });
    const riga = await db.uno('DELETE FROM weight_logs WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      req.session.userId,
    ]);
    if (!riga) return res.status(404).json({ errore: 'Misurazione non trovata.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.calcolaStreak = calcolaStreak;
