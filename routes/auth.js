// Accesso: password del sito (pagina 1) e profilo con password personale (pagina 2).
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const db = require('../db');
const pw = require('../lib/password');
const { apiSito, apiUtente } = require('../middleware/auth');

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
// Contano solo i tentativi sbagliati: gli accessi riusciti non consumano il
// limite, altrimenti piu persone dietro la stessa connessione (fino a 8 profili)
// si bloccherebbero a vicenda entrando normalmente.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
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

// Limite sulla password del profilo: la chiave unisce nome e indirizzo IP, cosi
// sbagliare su un profilo non blocca gli altri e viceversa.
// Vengono contate solo le risposte 401, non gli errori di compilazione.
const limiteProfilo = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const nome = nomeNormalizzato(req.body && req.body.nome).toLowerCase();
    return nome + '|' + ipKeyGenerator(req.ip);
  },
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode !== 401,
  handler: (req, res) => {
    res.status(429).json({ errore: 'Troppi tentativi per questo profilo. Riprova tra 15 minuti.' });
  },
});

// La tabella delle sessioni la crea connect-pg-simple al primo avvio.
async function tabellaSessioni() {
  const riga = await db.uno("SELECT to_regclass('public.session') IS NOT NULL AS c");
  return Boolean(riga && riga.c);
}

// Chiude le altre sessioni dell utente, lasciando aperta quella in corso.
async function terminaAltreSessioni(userId, sidCorrente) {
  if (!(await tabellaSessioni())) return 0;
  const esito = await db.query(
    "DELETE FROM session WHERE (sess::jsonb ->> 'userId') = $1 AND sid <> $2",
    [String(userId), String(sidCorrente || '')]
  );
  return esito.rowCount;
}

function controllaNome(nome) {
  if (nome.length < 2 || nome.length > 30) return 'Il nome deve avere da 2 a 30 caratteri.';
  if (!/^[\p{L}\p{N} '._-]+$/u.test(nome)) return 'Il nome contiene caratteri non ammessi.';
  return null;
}

router.get('/stato', async (req, res, next) => {
  try {
    const stato = {
      sito: Boolean(req.session.sitoOk),
      utente: null,
      profilo: false,
      ha_password: false,
      ai_configurata: Boolean(process.env.ANTHROPIC_API_KEY),
    };
    if (req.session.sitoOk && req.session.userId) {
      const utente = await db.uno(
        'SELECT id, name, (pin_hash IS NOT NULL) AS ha_password FROM users WHERE id = $1',
        [req.session.userId]
      );
      if (!utente) {
        // L'utente non esiste piu' (database ripulito): si riparte dalla pagina nome.
        delete req.session.userId;
      } else {
        stato.utente = { id: utente.id, nome: utente.name };
        stato.ha_password = utente.ha_password;
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

// Profili gia esistenti, mostrati come avatar nella pagina di scelta.
// Visibili solo a chi ha gia superato la password del sito. L hash non esce mai.
router.get('/utenti', apiSito, async (req, res, next) => {
  try {
    const righe = await db.tutte(
      `SELECT id, name, last_login, (pin_hash IS NOT NULL) AS ha_password FROM users
        ORDER BY last_login DESC NULLS LAST, created_at ASC`
    );
    res.json({
      utenti: righe.map((u) => ({
        id: u.id,
        nome: u.name,
        ultimo_accesso: u.last_login,
        ha_password: u.ha_password,
      })),
      totale: righe.length,
      massimo: MAX_UTENTI,
      liberi: Math.max(0, MAX_UTENTI - righe.length),
    });
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

// Passo intermedio: dice al client quale schermata mostrare.
// Non tocca la sessione e non rivela nulla oltre a quello che si vede
// gia nell elenco dei profili.
router.post('/controlla', apiSito, async (req, res, next) => {
  try {
    const nome = nomeNormalizzato(req.body && req.body.nome);
    const errore = controllaNome(nome);
    if (errore) return res.status(400).json({ errore });

    const utente = await db.uno(
      'SELECT id, name, (pin_hash IS NOT NULL) AS ha_password FROM users WHERE lower(name) = lower($1)',
      [nome]
    );
    if (utente) {
      return res.json({
        nome: utente.name,
        esiste: true,
        ha_password: utente.ha_password,
        // Senza password impostata il profilo la crea adesso (vale per i profili
        // nati prima di questa funzione).
        azione: utente.ha_password ? 'chiedi' : 'imposta',
      });
    }

    const conteggio = await db.uno('SELECT COUNT(*)::int AS totale FROM users');
    if (conteggio.totale >= MAX_UTENTI) {
      return res.status(403).json({ errore: 'Posti esauriti' });
    }
    res.json({ nome, esiste: false, ha_password: false, azione: 'crea' });
  } catch (err) {
    next(err);
  }
});

// Pagina 2: nome piu password personale.
// - profilo con password  -> la verifica
// - profilo senza password -> la imposta adesso (serve anche la conferma)
// - profilo nuovo          -> lo crea con la password (se ci sono posti)
router.post('/utente', apiSito, limiteProfilo, async (req, res, next) => {
  try {
    const nome = nomeNormalizzato(req.body.nome);
    const erroreNome = controllaNome(nome);
    if (erroreNome) return res.status(400).json({ errore: erroreNome });

    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const conferma = typeof req.body.conferma === 'string' ? req.body.conferma : '';

    let utente = await db.uno('SELECT id, name, pin_hash FROM users WHERE lower(name) = lower($1)', [nome]);
    let nuovo = false;
    let passwordImpostata = false;

    if (utente && utente.pin_hash) {
      const corretta = await pw.verifica(password, utente.pin_hash);
      if (!corretta) return res.status(401).json({ errore: pw.ERRORE_GENERICO });
    } else {
      const errorePassword = pw.validaNuovaPassword(password, conferma);
      if (errorePassword) {
        return res.status(400).json({ errore: errorePassword, azione: utente ? 'imposta' : 'crea' });
      }
      const hash = await pw.creaHash(password);

      if (!utente) {
        const conteggio = await db.uno('SELECT COUNT(*)::int AS totale FROM users');
        if (conteggio.totale >= MAX_UTENTI) {
          return res.status(403).json({ errore: 'Posti esauriti' });
        }
        try {
          utente = await db.uno(
            'INSERT INTO users (name, pin_hash) VALUES ($1, $2) RETURNING id, name, pin_hash',
            [nome, hash]
          );
          nuovo = true;
        } catch (err) {
          // Stesso nome creato nello stesso istante da un altro dispositivo:
          // il profilo esiste gia, quindi la password va verificata.
          if (!err || err.code !== '23505') throw err;
          utente = await db.uno('SELECT id, name, pin_hash FROM users WHERE lower(name) = lower($1)', [nome]);
          if (!utente) throw err;
          const corretta = await pw.verifica(password, utente.pin_hash);
          if (!corretta) return res.status(401).json({ errore: pw.ERRORE_GENERICO });
        }
      } else {
        utente = await db.uno(
          'UPDATE users SET pin_hash = $1 WHERE id = $2 RETURNING id, name, pin_hash',
          [hash, utente.id]
        );
        passwordImpostata = true;
      }
    }

    const profilo = await db.uno('SELECT user_id FROM profiles WHERE user_id = $1', [utente.id]);
    await db.query('UPDATE users SET last_login = now() WHERE id = $1', [utente.id]);

    // Sessione rigenerata dopo un accesso riuscito: protegge dalla fissazione
    // di sessione. L accesso al sito va rimesso, perche la sessione riparte vuota.
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ errore: 'Impossibile aprire la sessione.' });
      req.session.sitoOk = true;
      req.session.userId = utente.id;
      req.session.save((err2) => {
        if (err2) return res.status(500).json({ errore: 'Impossibile salvare la sessione.' });
        res.json({
          ok: true,
          nuovo,
          password_impostata: passwordImpostata,
          utente: { id: utente.id, nome: utente.name },
          profilo: Boolean(profilo),
        });
      });
    });
  } catch (err) {
    next(err);
  }
});

// Cambio password dall area profilo: chiude le altre sessioni dell utente.
router.post('/password', apiUtente, async (req, res, next) => {
  try {
    const attuale = typeof req.body.attuale === 'string' ? req.body.attuale : '';
    const nuova = typeof req.body.nuova === 'string' ? req.body.nuova : '';
    const conferma = typeof req.body.conferma === 'string' ? req.body.conferma : '';

    const utente = await db.uno('SELECT id, pin_hash FROM users WHERE id = $1', [req.session.userId]);
    if (!utente) return res.status(404).json({ errore: 'Utente non trovato.' });

    if (utente.pin_hash) {
      const corretta = await pw.verifica(attuale, utente.pin_hash);
      if (!corretta) return res.status(401).json({ errore: pw.ERRORE_GENERICO });
    }

    const errore = pw.validaNuovaPassword(nuova, conferma);
    if (errore) return res.status(400).json({ errore });

    const hash = await pw.creaHash(nuova);
    await db.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [hash, utente.id]);
    const chiuse = await terminaAltreSessioni(utente.id, req.sessionID);

    res.json({ ok: true, sessioni_chiuse: chiuse });
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
module.exports.terminaAltreSessioni = terminaAltreSessioni;
