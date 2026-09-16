// Rotte del collegamento Spotify. Se le variabili d ambiente mancano la
// sezione resta spenta: /stato lo dice e le altre rotte rispondono 404, cosi
// la pagina Musica continua a funzionare con i soli link di ricerca.
const express = require('express');
const db = require('../db');
const spotify = require('../lib/spotify');
const { apiUtente, paginaUtente } = require('../middleware/auth');

const router = express.Router();

// Un errore di Spotify non deve mai diventare un 500 anonimo.
function rispondiErrore(err, res, next) {
  if (err instanceof spotify.ErroreSpotify) {
    return res.status(err.stato).json({ errore: err.message, codice: err.codice });
  }
  return next(err);
}

// Lo stato si puo chiedere sempre: e cosi che la pagina sa se mostrare o no
// il pulsante "Collega Spotify".
router.get('/stato', apiUtente, async (req, res, next) => {
  try {
    if (!spotify.configurato()) return res.json({ configurato: false, collegato: false });
    res.json({
      configurato: true,
      collegato: await spotify.collegato(req.session.userId),
      limite_ricerche: spotify.LIMITE_RICERCHE,
    });
  } catch (err) {
    next(err);
  }
});

// Da qui in poi serve la sezione accesa.
router.use(function (req, res, next) {
  if (!spotify.configurato()) {
    return res.status(404).json({ errore: 'Collegamento Spotify non configurato su questo server.' });
  }
  return next();
});

// --- OAuth con PKCE ----------------------------------------------------------

// Il verifier e lo stato restano in sessione: non passano mai dal browser.
router.get('/login', paginaUtente, (req, res) => {
  const stato = spotify.generaStato();
  const verifier = spotify.generaVerifier();
  req.session.spotifyStato = stato;
  req.session.spotifyVerifier = verifier;
  req.session.save(function (err) {
    if (err) return res.redirect('/app#musica?spotify=errore');
    res.redirect(spotify.urlAutorizzazione(stato, verifier));
  });
});

router.get('/callback', paginaUtente, async (req, res, next) => {
  const statoAtteso = req.session.spotifyStato;
  const verifier = req.session.spotifyVerifier;
  delete req.session.spotifyStato;
  delete req.session.spotifyVerifier;

  // L utente ha negato il permesso sulla pagina di Spotify.
  if (req.query.error) {
    return res.redirect('/app#musica?spotify=annullato');
  }
  // Stato mancante o diverso: la richiesta non e partita da qui.
  if (!statoAtteso || !verifier || String(req.query.state || '') !== statoAtteso) {
    return res.status(400).send(
      '<!doctype html><meta charset="utf-8"><title>Collegamento non valido</title>' +
      '<p>Collegamento non valido o scaduto. <a href="/app#musica">Torna alla sezione Musica</a> e riprova.</p>'
    );
  }
  if (!req.query.code) return res.redirect('/app#musica?spotify=annullato');

  try {
    const token = await spotify.scambiaCodice(String(req.query.code), verifier);
    await spotify.salvaToken(req.session.userId, token);
    console.log('[spotify] account collegato (utente ' + req.session.userId + ')');
    res.redirect('/app#musica?spotify=ok');
  } catch (err) {
    if (err instanceof spotify.ErroreSpotify) {
      console.error('[spotify] collegamento fallito: ' + err.codice);
      const motivo = err.codice === 'non_abilitato' ? 'non_abilitato' : 'errore';
      return res.redirect('/app#musica?spotify=' + motivo);
    }
    next(err);
  }
});

router.post('/scollega', apiUtente, async (req, res, next) => {
  try {
    const eliminato = await spotify.eliminaToken(req.session.userId);
    res.json({ ok: true, eliminato });
  } catch (err) {
    next(err);
  }
});

// --- Ricerca playlist --------------------------------------------------------

router.get('/cerca', apiUtente, async (req, res, next) => {
  const query = String(req.query.q || '').trim().slice(0, 120);
  if (!query) return res.status(400).json({ errore: 'Manca la ricerca da fare.' });
  try {
    if (!(await spotify.collegato(req.session.userId))) {
      return res.status(409).json({ errore: 'Spotify non e collegato.', codice: 'non_collegato' });
    }
    const esito = await spotify.cercaPlaylist(req.session.userId, query);
    res.json(Object.assign({ ok: true, query }, esito));
  } catch (err) {
    rispondiErrore(err, res, next);
  }
});

// --- Riproduzione ------------------------------------------------------------

router.post('/riproduci', apiUtente, async (req, res, next) => {
  const uri = String((req.body && req.body.uri) || '').trim();
  if (!/^spotify:playlist:[A-Za-z0-9]+$/.test(uri)) {
    return res.status(400).json({ errore: 'Playlist non valida.' });
  }
  try {
    const esito = await spotify.riproduci(req.session.userId, uri);
    res.json({ ok: true, dispositivo: esito.dispositivo });
  } catch (err) {
    rispondiErrore(err, res, next);
  }
});

// --- In ascolto ora ----------------------------------------------------------

router.get('/in-ascolto', apiUtente, async (req, res, next) => {
  try {
    if (!(await spotify.collegato(req.session.userId))) {
      return res.json({ collegato: false, brano: null });
    }
    const brano = await spotify.inAscolto(req.session.userId);
    if (brano) {
      const allenamento = Number(req.query.allenamento);
      let workoutId = null;
      // L allenamento si accetta solo se e davvero di questo utente.
      if (Number.isInteger(allenamento)) {
        const riga = await db.uno('SELECT id FROM workouts WHERE id = $1 AND user_id = $2', [
          allenamento,
          req.session.userId,
        ]);
        if (riga) workoutId = riga.id;
      }
      await spotify.registraAscolto(req.session.userId, brano, workoutId);
    }
    res.json({ collegato: true, brano });
  } catch (err) {
    // Qui un errore non deve rompere la pagina: si torna semplicemente senza brano.
    if (err instanceof spotify.ErroreSpotify) {
      return res.json({ collegato: true, brano: null, avviso: err.message, codice: err.codice });
    }
    next(err);
  }
});

// Gli ultimi brani ascoltati, per la pagina Musica.
router.get('/ascoltati', apiUtente, async (req, res, next) => {
  try {
    const righe = await db.tutte(
      `SELECT id, track_name, artist, album_image, workout_id, played_at
         FROM listening_logs WHERE user_id = $1 ORDER BY played_at DESC, id DESC LIMIT 10`,
      [req.session.userId]
    );
    res.json({ brani: righe });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
