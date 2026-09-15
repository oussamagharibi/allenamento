// Accesso: password del sito (pagina 1) e scelta del nome utente (pagina 2).
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { apiSito } = require('../middleware/auth');

const router = express.Router();

const MAX_UTENTI = 8;

// Confronto a tempo costante: si confrontano gli hash, cosi' le lunghezze
// coincidono sempre e non si deduce nulla dai tempi di risposta.
function confrontoSicuro(a, b) {
  const ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

// 5 tentativi ogni 15 minuti sulla password del sito.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { errore: 'Troppi tentativi. Riprova tra 15 minuti.' },
  handler: (req, res) => {
    res.status(429).json({ errore: 'Troppi tentativi. Riprova tra 15 minuti.' });
  },
});

function nomeNormalizzato(valore) {
  return String(valore == null ? '' : valore).trim().replace(/\s+/g, ' ');
}

router.get('/stato', async (req, res, next) => {
  try {
    const stato = {
      sito: Boolean(req.session.sitoOk),
      utente: null,
      profilo: false,
      ai_configurata: Boolean(process.env.ANTHROPIC_API_KEY),
    };
    if (req.session.sitoOk && req.session.userId) {
      const utente = await db.uno('SELECT id, name FROM users WHERE id = $1', [req.session.userId]);
      if (!utente) {
        // L'utente non esiste piu' (database ripulito): si riparte dalla pagina nome.
        delete req.session.userId;
      } else {
        stato.utente = { id: utente.id, nome: utente.name };
        const profilo = await db.uno('SELECT user_id FROM profiles WHERE user_id = $1', [utente.id]);
        stato.profilo = Boolean(profilo);
      }
    }
    res.json(stato);
  } catch (err) {
    next(err);
  }
});

// Quanti posti restano, senza rivelare i nomi degli altri utenti.
router.get('/posti', apiSito, async (req, res, next) => {
  try {
    const riga = await db.uno('SELECT COUNT(*)::int AS totale FROM users');
    res.json({ totale: riga.totale, massimo: MAX_UTENTI, liberi: Math.max(0, MAX_UTENTI - riga.totale) });
  } catch (err) {
    next(err);
  }
});

// Pagina 1: password del sito.
router.post('/sito', limiteLogin, (req, res) => {
  const attesa = process.env.SITE_PASSWORD;
  if (!attesa) {
    console.error('[auth] SITE_PASSWORD non configurata: accesso bloccato.');
    return res.status(500).json({ errore: 'Password del sito non configurata sul server.' });
  }
  const fornita = typeof req.body.password === 'string' ? req.body.password : '';
  if (!confrontoSicuro(fornita, attesa)) {
    return res.status(401).json({ errore: 'Password non corretta.' });
  }
  req.session.sitoOk = true;
  req.session.save((err) => {
    if (err) return res.status(500).json({ errore: 'Impossibile salvare la sessione.' });
    res.json({ ok: true });
  });
});

// Pagina 2: solo il nome. Esistente -> entra; nuovo -> crea se ci sono posti.
router.post('/utente', apiSito, async (req, res, next) => {
  try {
    const nome = nomeNormalizzato(req.body.nome);
    if (nome.length < 2 || nome.length > 30) {
      return res.status(400).json({ errore: 'Il nome deve avere da 2 a 30 caratteri.' });
    }
    if (!/^[\p{L}\p{N} '._-]+$/u.test(nome)) {
      return res.status(400).json({ errore: 'Il nome contiene caratteri non ammessi.' });
    }

    let utente = await db.uno('SELECT id, name FROM users WHERE lower(name) = lower($1)', [nome]);
    let nuovo = false;

    if (!utente) {
      const conteggio = await db.uno('SELECT COUNT(*)::int AS totale FROM users');
      if (conteggio.totale >= MAX_UTENTI) {
        return res.status(403).json({ errore: 'Posti esauriti' });
      }
      try {
        utente = await db.uno('INSERT INTO users (name) VALUES ($1) RETURNING id, name', [nome]);
        nuovo = true;
      } catch (err) {
        // Due richieste con lo stesso nome nello stesso istante: recuperiamo quello creato.
        if (err && err.code === '23505') {
          utente = await db.uno('SELECT id, name FROM users WHERE lower(name) = lower($1)', [nome]);
        }
        if (!utente) throw err;
      }
    }

    req.session.userId = utente.id;
    const profilo = await db.uno('SELECT user_id FROM profiles WHERE user_id = $1', [utente.id]);
    req.session.save((err) => {
      if (err) return res.status(500).json({ errore: 'Impossibile salvare la sessione.' });
      res.json({ ok: true, nuovo, utente: { id: utente.id, nome: utente.name }, profilo: Boolean(profilo) });
    });
  } catch (err) {
    next(err);
  }
});

// Cambia utente: resta l'accesso al sito, si perde il profilo selezionato.
router.post('/cambia-utente', apiSito, (req, res) => {
  delete req.session.userId;
  req.session.save(() => res.json({ ok: true }));
});

// Logout completo.
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('allenamento.sid');
    res.json({ ok: true });
  });
});

module.exports = router;
module.exports.MAX_UTENTI = MAX_UTENTI;
