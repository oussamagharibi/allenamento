// Profilo utente (onboarding al primo accesso, modificabile in seguito).
const express = require('express');
const db = require('../db');
const C = require('../lib/costanti');
const calcoli = require('../lib/calcoli');
const { validaProfilo } = require('../lib/validazione');
const { apiUtente } = require('../middleware/auth');

const router = express.Router();

router.use(apiUtente);

// Opzioni per costruire il form lato client.
const OPZIONI = {
  sessi: C.SESSI,
  luoghi: C.LUOGHI,
  obiettivi: C.OBIETTIVI,
  livelli: C.LIVELLI,
  attrezzatura_casa: C.ATTREZZATURA_CASA,
  zone_infortuni: C.ZONE_INFORTUNI,
  minuti: { min: C.MINUTI_MIN, max: C.MINUTI_MAX },
  giorni: { min: C.GIORNI_MIN, max: C.GIORNI_MAX },
  preferenze_alimentari: C.PREFERENZE_ALIMENTARI,
  pasti: { min: C.PASTI_MIN, max: C.PASTI_MAX },
};

async function leggiProfilo(userId) {
  return db.uno(
    `SELECT user_id, peso::float AS peso, altezza, eta, sesso, luogo, attrezzatura,
            obiettivo, livello, giorni_settimana, minuti_sessione, infortuni,
            preferenze_alimentari, allergie, pasti_giorno, updated_at
       FROM profiles WHERE user_id = $1`,
    [userId]
  );
}

router.get('/', async (req, res, next) => {
  try {
    const profilo = await leggiProfilo(req.session.userId);
    res.json({
      profilo,
      riepilogo: profilo ? calcoli.riepilogo(profilo) : null,
      opzioni: OPZIONI,
    });
  } catch (err) {
    next(err);
  }
});

// Salva (o aggiorna) il profilo e restituisce i calcoli.
router.post('/', async (req, res, next) => {
  try {
    const esito = validaProfilo(req.body);
    if (!esito.ok) {
      return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });
    }
    const v = esito.valori;
    const salvato = await db.uno(
      `INSERT INTO profiles (user_id, peso, altezza, eta, sesso, luogo, attrezzatura,
                             obiettivo, livello, giorni_settimana, minuti_sessione, infortuni,
                             preferenze_alimentari, allergie, pasti_giorno, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now())
       ON CONFLICT (user_id) DO UPDATE SET
            peso = EXCLUDED.peso,
            altezza = EXCLUDED.altezza,
            eta = EXCLUDED.eta,
            sesso = EXCLUDED.sesso,
            luogo = EXCLUDED.luogo,
            attrezzatura = EXCLUDED.attrezzatura,
            obiettivo = EXCLUDED.obiettivo,
            livello = EXCLUDED.livello,
            giorni_settimana = EXCLUDED.giorni_settimana,
            minuti_sessione = EXCLUDED.minuti_sessione,
            infortuni = EXCLUDED.infortuni,
            preferenze_alimentari = EXCLUDED.preferenze_alimentari,
            allergie = EXCLUDED.allergie,
            pasti_giorno = EXCLUDED.pasti_giorno,
            updated_at = now()
       RETURNING user_id, peso::float AS peso, altezza, eta, sesso, luogo, attrezzatura,
                 obiettivo, livello, giorni_settimana, minuti_sessione, infortuni,
                 preferenze_alimentari, allergie, pasti_giorno, updated_at`,
      [
        req.session.userId,
        v.peso,
        v.altezza,
        v.eta,
        v.sesso,
        v.luogo,
        v.attrezzatura,
        v.obiettivo,
        v.livello,
        v.giorni_settimana,
        v.minuti_sessione,
        v.infortuni,
        v.preferenze_alimentari,
        v.allergie,
        v.pasti_giorno,
      ]
    );

    // Primo peso registrato insieme al profilo, se non ce ne sono ancora.
    const esistente = await db.uno('SELECT id FROM weight_logs WHERE user_id = $1 LIMIT 1', [req.session.userId]);
    if (!esistente) {
      await db.query('INSERT INTO weight_logs (user_id, peso, misure) VALUES ($1, $2, $3)', [
        req.session.userId,
        v.peso,
        JSON.stringify({}),
      ]);
    }

    res.json({
      ok: true,
      profilo: salvato,
      riepilogo: calcoli.riepilogo(salvato),
      zone_rilevate: C.zoneInfortunate(salvato.infortuni),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.leggiProfilo = leggiProfilo;
