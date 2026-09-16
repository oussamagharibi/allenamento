// Sezione Musica: consigli di ascolto ricavati da umore, stile e paese.
// I consigli sono statici (lib/musica.js): qui si salvano le scelte, le
// preferite e i clic sui link, sempre legati all utente in sessione.
const express = require('express');
const db = require('../db');
const musica = require('../lib/musica');
const { apiUtente } = require('../middleware/auth');

const router = express.Router();
router.use(apiUtente);

const MAX_ULTIME = 8;
const MAX_PREFERITE = 12;

// Le ultime combinazioni scelte, senza ripetere la stessa due volte.
async function ultimeScelte(userId, quante) {
  const righe = await db.tutte(
    `SELECT DISTINCT ON (mood, stile, paese) id, mood, stile, paese, preferita, created_at
       FROM music_prefs WHERE user_id = $1
      ORDER BY mood, stile, paese, created_at DESC`,
    [userId]
  );
  return righe
    .sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); })
    .slice(0, quante || MAX_ULTIME)
    .map(descrivi);
}

async function preferite(userId) {
  const righe = await db.tutte(
    `SELECT DISTINCT ON (mood, stile, paese) id, mood, stile, paese, preferita, created_at
       FROM music_prefs WHERE user_id = $1 AND preferita = true
      ORDER BY mood, stile, paese, created_at DESC`,
    [userId]
  );
  return righe.slice(0, MAX_PREFERITE).map(descrivi);
}

// Aggiunge etichette e ricerca pronta a una riga di music_prefs.
function descrivi(riga) {
  const query = musica.costruisciQuery(riga);
  return {
    id: riga.id,
    mood: riga.mood,
    stile: riga.stile,
    paese: riga.paese,
    preferita: riga.preferita,
    etichette: {
      mood: musica.etichetta('mood', riga.mood),
      stile: musica.etichetta('stile', riga.stile),
      paese: musica.etichetta('paese', riga.paese),
    },
    query,
    link: { spotify: musica.linkSpotify(query), youtube: musica.linkYouTube(query) },
  };
}

// Opzioni da mostrare piu quello che l utente ha gia scelto in passato.
router.get('/', async (req, res, next) => {
  try {
    const [ultime, amate] = await Promise.all([
      ultimeScelte(req.session.userId, MAX_ULTIME),
      preferite(req.session.userId),
    ]);
    res.json({ opzioni: musica.opzioni(), ultime, preferite: amate });
  } catch (err) {
    next(err);
  }
});

// Salva la scelta e restituisce il consiglio.
router.post('/consiglio', async (req, res, next) => {
  try {
    const esito = musica.valida(req.body);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });
    const v = esito.valori;

    // Se la combinazione era gia fra le preferite, resta preferita.
    const gia = await db.uno(
      `SELECT bool_or(preferita) AS preferita FROM music_prefs
        WHERE user_id = $1 AND mood = $2 AND stile = $3 AND paese = $4`,
      [req.session.userId, v.mood, v.stile, v.paese]
    );

    const riga = await db.uno(
      `INSERT INTO music_prefs (user_id, mood, stile, paese, preferita)
            VALUES ($1, $2, $3, $4, $5)
       RETURNING id, mood, stile, paese, preferita, created_at`,
      [req.session.userId, v.mood, v.stile, v.paese, Boolean(gia && gia.preferita)]
    );

    res.json({
      ok: true,
      scelta: descrivi(riga),
      consiglio: musica.consiglio(v),
    });
  } catch (err) {
    next(err);
  }
});

// Mette o toglie una combinazione dalle preferite.
router.post('/preferita', async (req, res, next) => {
  try {
    const esito = musica.valida(req.body);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });
    const v = esito.valori;
    const attiva = req.body && req.body.preferita !== false;

    const aggiornate = await db.query(
      `UPDATE music_prefs SET preferita = $5
        WHERE user_id = $1 AND mood = $2 AND stile = $3 AND paese = $4`,
      [req.session.userId, v.mood, v.stile, v.paese, attiva]
    );

    // Se non era mai stata scelta la si registra ora, gia preferita.
    if (!aggiornate.rowCount && attiva) {
      await db.query(
        'INSERT INTO music_prefs (user_id, mood, stile, paese, preferita) VALUES ($1, $2, $3, $4, true)',
        [req.session.userId, v.mood, v.stile, v.paese]
      );
    }

    res.json({ ok: true, preferita: attiva, preferite: await preferite(req.session.userId) });
  } catch (err) {
    next(err);
  }
});

// Un clic su "Apri su Spotify" o "Apri su YouTube".
router.post('/evento', async (req, res, next) => {
  try {
    const c = req.body || {};
    const piattaforma = String(c.piattaforma || '').trim().toLowerCase();
    if (musica.PIATTAFORME.indexOf(piattaforma) === -1) {
      return res.status(400).json({ errore: 'Piattaforma non valida.' });
    }
    const esito = musica.valida(c);
    if (!esito.ok) return res.status(400).json({ errore: esito.errori[0], errori: esito.errori });
    const v = esito.valori;

    // La ricerca viene ricostruita qui: il browser non decide cosa finisce nel registro.
    const query = musica.costruisciQuery(Object.assign({}, v, { tipo: v.tipo }));
    await db.query(
      `INSERT INTO music_events (user_id, mood, stile, paese, query, piattaforma)
            VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.session.userId, v.mood, v.stile, v.paese, query, piattaforma]
    );
    res.json({ ok: true, query });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.ultimeScelte = ultimeScelte;
module.exports.preferite = preferite;
