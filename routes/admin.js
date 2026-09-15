// Pannello di amministrazione: accesso separato dagli utenti, con master password.
// Ogni operazione distruttiva crea prima una copia di sicurezza ed e in transazione.
const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');

const db = require('../db');
const C = require('../lib/costanti');
const { requireAdmin, adminAbilitato, adminValido, rinnovaAdmin, scollegaAdmin, DURATA_ADMIN } = require('../middleware/auth');

const router = express.Router();

// Confronto a tempo costante sugli hash: le lunghezze coincidono sempre.
function confrontoSicuro(a, b) {
  const ha = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const hb = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

// 5 tentativi sbagliati ogni 15 minuti. Gli accessi riusciti non consumano il limite.
const limiteAdmin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ errore: 'Troppi tentativi. Riprova tra 15 minuti.' });
  },
});

// Il pannello esiste solo se la master password e configurata.
router.use((req, res, next) => {
  if (!adminAbilitato()) {
    console.log('[admin] disattivato');
    return res.status(404).json({ errore: 'Non trovato' });
  }
  next();
});

async function registraLog(esecutore, azione, target) {
  await esecutore.query('INSERT INTO admin_log (azione, target) VALUES ($1, $2)', [
    String(azione).slice(0, 80),
    target === null || target === undefined ? null : String(target).slice(0, 120),
  ]);
}

function nomeNormalizzato(valore) {
  return String(valore == null ? '' : valore).trim().replace(/\s+/g, ' ');
}

// La tabella delle sessioni la crea connect-pg-simple: se non c e ancora,
// le funzioni che la usano non devono far fallire la richiesta.
async function tabellaSessioniPresente() {
  const riga = await db.uno("SELECT to_regclass('public.session') IS NOT NULL AS c");
  return Boolean(riga && riga.c);
}

async function contaSessioni(userId) {
  if (!(await tabellaSessioniPresente())) return 0;
  const riga = await db.uno(
    "SELECT COUNT(*)::int AS n FROM session WHERE (sess::jsonb ->> 'userId') = $1",
    [String(userId)]
  );
  return riga ? riga.n : 0;
}

// --- Accesso ----------------------------------------------------------------

router.get('/stato', (req, res) => {
  const attivo = adminValido(req);
  if (attivo) rinnovaAdmin(req);
  res.json({
    admin: attivo,
    scadenza_minuti: Math.round(DURATA_ADMIN / 60000),
    max_utenti: C.MAX_UTENTI,
  });
});

router.post('/login', limiteAdmin, (req, res) => {
  const attesa = process.env.ADMIN_PASSWORD;
  const fornita = typeof req.body.password === 'string' ? req.body.password : '';
  if (!confrontoSicuro(fornita, attesa)) {
    console.log('[admin] tentativo di accesso non riuscito');
    return res.status(401).json({ errore: 'Password non corretta.' });
  }
  // Sessione rigenerata dopo il login: protegge dalla fissazione di sessione
  // e stacca la sessione admin da quella eventuale di un utente normale.
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ errore: 'Impossibile aprire la sessione admin.' });
    req.session.isAdmin = true;
    rinnovaAdmin(req);
    req.session.save(async (err2) => {
      if (err2) return res.status(500).json({ errore: 'Impossibile salvare la sessione admin.' });
      await registraLog(db, 'login', null).catch(() => {});
      res.json({ ok: true, scadenza_minuti: Math.round(DURATA_ADMIN / 60000) });
    });
  });
});

router.post('/logout', (req, res) => {
  scollegaAdmin(req);
  req.session.destroy(() => {
    res.clearCookie('allenamento.sid');
    res.json({ ok: true });
  });
});

// Da qui in poi serve la sessione admin valida.
router.use(requireAdmin);

// --- Lettura ----------------------------------------------------------------

router.get('/utenti', async (req, res, next) => {
  try {
    const utenti = await db.tutte(
      `SELECT u.id, u.name, u.created_at, u.last_login,
              (u.pin_hash IS NOT NULL) AS ha_password,
              (SELECT COUNT(*) FROM workouts w WHERE w.user_id = u.id)::int AS allenamenti,
              (SELECT COUNT(*) FROM workouts w WHERE w.user_id = u.id AND w.completato)::int AS completati,
              (SELECT COUNT(*) FROM weight_logs l WHERE l.user_id = u.id)::int AS pesate,
              COALESCE((SELECT a.conteggio FROM ai_usage a
                         WHERE a.user_id = u.id AND a.data = CURRENT_DATE), 0)::int AS ai_oggi,
              EXISTS(SELECT 1 FROM profiles p WHERE p.user_id = u.id) AS profilo
         FROM users u
        ORDER BY u.created_at ASC`
    );

    const sessioni = (await tabellaSessioniPresente())
      ? await db.tutte(
          "SELECT (sess::jsonb ->> 'userId') AS uid, COUNT(*)::int AS n FROM session" +
          " WHERE sess::jsonb ->> 'userId' IS NOT NULL GROUP BY 1"
        )
      : [];
    const perUtente = {};
    for (const s of sessioni) perUtente[s.uid] = s.n;

    res.json({
      utenti: utenti.map((u) => Object.assign({}, u, { sessioni: perUtente[String(u.id)] || 0 })),
      totale: utenti.length,
      massimo: C.MAX_UTENTI,
      limite_ai: C.LIMITE_AI_GIORNALIERO,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/log', async (req, res, next) => {
  try {
    const righe = await db.tutte(
      'SELECT id, azione, target, created_at FROM admin_log ORDER BY created_at DESC, id DESC LIMIT 50'
    );
    res.json({ log: righe });
  } catch (err) {
    next(err);
  }
});

router.get('/backup', async (req, res, next) => {
  try {
    const righe = await db.tutte(
      `SELECT id, user_name, created_at,
              jsonb_array_length(COALESCE(dati -> 'workouts', '[]'::jsonb)) AS allenamenti,
              jsonb_array_length(COALESCE(dati -> 'weight_logs', '[]'::jsonb)) AS pesate,
              (dati -> 'profilo') IS NOT NULL AND (dati -> 'profilo') <> 'null'::jsonb AS profilo
         FROM admin_backups ORDER BY created_at DESC, id DESC LIMIT 20`
    );
    res.json({ backup: righe });
  } catch (err) {
    next(err);
  }
});

// --- Esportazione -----------------------------------------------------------

// Raccoglie tutti i dati di un utente. Funziona sia sul pool sia dentro una transazione.
async function raccogliDati(esecutore, userId) {
  // Le colonne sono elencate una per una: pin_hash non deve finire ne
  // nell esportazione ne nelle copie di sicurezza.
  const utente = (await esecutore.query('SELECT id, name, created_at, last_login FROM users WHERE id = $1', [userId])).rows[0];
  if (!utente) return null;
  const profilo = (await esecutore.query('SELECT * FROM profiles WHERE user_id = $1', [userId])).rows[0] || null;
  const pesi = (await esecutore.query('SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY data ASC, id ASC', [userId])).rows;
  const allenamenti = (await esecutore.query('SELECT * FROM workouts WHERE user_id = $1 ORDER BY data ASC, id ASC', [userId])).rows;
  const report = (await esecutore.query('SELECT * FROM ai_reports WHERE user_id = $1 ORDER BY created_at ASC', [userId])).rows;
  const usoAi = (await esecutore.query('SELECT * FROM ai_usage WHERE user_id = $1 ORDER BY data ASC', [userId])).rows;
  return {
    versione: 1,
    esportato_il: new Date().toISOString(),
    utente: { name: utente.name, created_at: utente.created_at, last_login: utente.last_login },
    profilo,
    weight_logs: pesi,
    workouts: allenamenti,
    ai_reports: report,
    ai_usage: usoAi,
  };
}

router.get('/utenti/:id/export', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });
    const dati = await raccogliDati(db, id);
    if (!dati) return res.status(404).json({ errore: 'Utente non trovato.' });

    await registraLog(db, 'esporta', dati.utente.name);
    const nomeFile = 'allenamento-' + String(dati.utente.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + nomeFile + '"');
    res.send(JSON.stringify(dati, null, 2));
  } catch (err) {
    next(err);
  }
});

// --- Operazioni distruttive -------------------------------------------------

// Chi cancella deve riscrivere il nome dell utente: vale sia in pagina sia qui.
function confermaValida(corpo, nome) {
  const scritto = nomeNormalizzato(corpo && corpo.conferma);
  return scritto.toLowerCase() === String(nome).trim().toLowerCase();
}

async function salvaBackup(client, userId) {
  const dati = await raccogliDati(client, userId);
  if (!dati) return null;
  const riga = await client.query(
    'INSERT INTO admin_backups (user_name, dati) VALUES ($1, $2) RETURNING id, user_name, created_at',
    [dati.utente.name, JSON.stringify(dati)]
  );
  return riga.rows[0];
}

async function cancellaDati(client, userId) {
  await client.query('DELETE FROM ai_usage WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM ai_reports WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM workouts WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM weight_logs WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
}

async function cancellaSessioni(client, userId) {
  const presente = await client.query("SELECT to_regclass('public.session') IS NOT NULL AS c");
  if (!presente.rows[0].c) return 0;
  const res = await client.query("DELETE FROM session WHERE (sess::jsonb ->> 'userId') = $1", [String(userId)]);
  return res.rowCount;
}

// Azzera i dati ma tiene l utente: al rientro rifara il questionario iniziale.
router.post('/utenti/:id/reset', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const utente = (await client.query('SELECT id, name FROM users WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!utente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ errore: 'Utente non trovato.' });
    }
    if (!confermaValida(req.body, utente.name)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ errore: 'Per confermare scrivi esattamente il nome: ' + utente.name });
    }

    const backup = await salvaBackup(client, id);
    await cancellaDati(client, id);
    await cancellaSessioni(client, id);
    await registraLog(client, 'reset dati', utente.name);
    await client.query('COMMIT');
    res.json({ ok: true, backup });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// Elimina utente e dati: libera un posto sugli 8 disponibili.
router.delete('/utenti/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const utente = (await client.query('SELECT id, name FROM users WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!utente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ errore: 'Utente non trovato.' });
    }
    if (!confermaValida(req.body, utente.name)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ errore: 'Per confermare scrivi esattamente il nome: ' + utente.name });
    }

    const backup = await salvaBackup(client, id);
    await cancellaSessioni(client, id);
    // Le tabelle collegate hanno ON DELETE CASCADE.
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await registraLog(client, 'elimina utente', utente.name);
    await client.query('COMMIT');
    res.json({ ok: true, backup });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// --- Altre azioni -----------------------------------------------------------

router.post('/utenti/:id/rinomina', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });

  const nuovo = nomeNormalizzato(req.body && req.body.nome);
  if (nuovo.length < 2 || nuovo.length > 30) {
    return res.status(400).json({ errore: 'Il nome deve avere da 2 a 30 caratteri.' });
  }
  if (!/^[\p{L}\p{N} '._-]+$/u.test(nuovo)) {
    return res.status(400).json({ errore: 'Il nome contiene caratteri non ammessi.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const utente = (await client.query('SELECT id, name FROM users WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!utente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ errore: 'Utente non trovato.' });
    }
    const occupato = (await client.query(
      'SELECT id FROM users WHERE lower(name) = lower($1) AND id <> $2',
      [nuovo, id]
    )).rows[0];
    if (occupato) {
      await client.query('ROLLBACK');
      return res.status(409).json({ errore: 'Esiste gia un utente con questo nome.' });
    }

    const aggiornato = (await client.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name',
      [nuovo, id]
    )).rows[0];
    await registraLog(client, 'rinomina', utente.name + ' -> ' + nuovo);
    await client.query('COMMIT');
    res.json({ ok: true, utente: aggiornato });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err && err.code === '23505') {
      return res.status(409).json({ errore: 'Esiste gia un utente con questo nome.' });
    }
    next(err);
  } finally {
    client.release();
  }
});

router.post('/utenti/:id/azzera-ai', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });
    const utente = await db.uno('SELECT id, name FROM users WHERE id = $1', [id]);
    if (!utente) return res.status(404).json({ errore: 'Utente non trovato.' });

    await db.query('DELETE FROM ai_usage WHERE user_id = $1 AND data = CURRENT_DATE', [id]);
    await registraLog(db, 'azzera contatore AI', utente.name);
    res.json({ ok: true, restanti: C.LIMITE_AI_GIORNALIERO });
  } catch (err) {
    next(err);
  }
});

// Azzera la password del profilo: al prossimo accesso l utente ne imposta una nuova.
router.post('/utenti/:id/reset-password', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const utente = (await client.query('SELECT id, name FROM users WHERE id = $1 FOR UPDATE', [id])).rows[0];
    if (!utente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ errore: 'Utente non trovato.' });
    }
    await client.query('UPDATE users SET pin_hash = NULL WHERE id = $1', [id]);
    const chiuse = await cancellaSessioni(client, id);
    // Nel registro finisce solo il nome: mai la password ne il suo hash.
    await registraLog(client, 'reset password', utente.name);
    await client.query('COMMIT');
    res.json({ ok: true, chiuse });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

router.post('/utenti/:id/sessioni/termina', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Utente non valido.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const utente = (await client.query('SELECT id, name FROM users WHERE id = $1', [id])).rows[0];
    if (!utente) {
      await client.query('ROLLBACK');
      return res.status(404).json({ errore: 'Utente non trovato.' });
    }
    const chiuse = await cancellaSessioni(client, id);
    await registraLog(client, 'termina sessioni', utente.name);
    await client.query('COMMIT');
    res.json({ ok: true, chiuse });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// --- Ripristino -------------------------------------------------------------

function valoreGiorno(riga) {
  // Le date arrivano dal JSON come stringa ISO: teniamo solo la parte del giorno.
  return riga && riga.data ? String(riga.data).slice(0, 10) : null;
}

router.post('/backup/:id/ripristina', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ errore: 'Backup non valido.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const backup = (await client.query('SELECT id, user_name, dati FROM admin_backups WHERE id = $1', [id])).rows[0];
    if (!backup) {
      await client.query('ROLLBACK');
      return res.status(404).json({ errore: 'Backup non trovato.' });
    }
    const dati = backup.dati || {};
    const nome = nomeNormalizzato(backup.user_name);

    let utente = (await client.query('SELECT id, name FROM users WHERE lower(name) = lower($1)', [nome])).rows[0];
    let ricreato = false;
    if (!utente) {
      const totale = (await client.query('SELECT COUNT(*)::int AS n FROM users')).rows[0].n;
      if (totale >= C.MAX_UTENTI) {
        await client.query('ROLLBACK');
        return res.status(409).json({ errore: 'Posti esauriti: elimina un utente prima di ripristinare questo backup.' });
      }
      utente = (await client.query('INSERT INTO users (name) VALUES ($1) RETURNING id, name', [nome])).rows[0];
      ricreato = true;
    }

    // Si riparte da zero: i dati attuali dell utente vengono sostituiti da quelli del backup.
    await cancellaDati(client, utente.id);

    const p = dati.profilo;
    if (p) {
      await client.query(
        `INSERT INTO profiles (user_id, peso, altezza, eta, sesso, luogo, attrezzatura, obiettivo,
                               livello, giorni_settimana, minuti_sessione, infortuni, updated_at)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, COALESCE($13::timestamptz, now()))`,
        [
          utente.id, p.peso, p.altezza, p.eta, p.sesso, p.luogo,
          Array.isArray(p.attrezzatura) ? p.attrezzatura : [],
          p.obiettivo, p.livello, p.giorni_settimana, p.minuti_sessione,
          p.infortuni || '', p.updated_at || null,
        ]
      );
    }

    for (const riga of Array.isArray(dati.weight_logs) ? dati.weight_logs : []) {
      await client.query(
        'INSERT INTO weight_logs (user_id, peso, misure, data) VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE))',
        [utente.id, riga.peso, JSON.stringify(riga.misure || {}), valoreGiorno(riga)]
      );
    }

    for (const riga of Array.isArray(dati.workouts) ? dati.workouts : []) {
      await client.query(
        `INSERT INTO workouts (user_id, data, completato, esercizi, titolo, origine, created_at)
              VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, COALESCE($7::timestamptz, now()))`,
        [
          utente.id, valoreGiorno(riga), Boolean(riga.completato),
          JSON.stringify(riga.esercizi || []), riga.titolo || null,
          riga.origine || 'app', riga.created_at || null,
        ]
      );
    }

    for (const riga of Array.isArray(dati.ai_reports) ? dati.ai_reports : []) {
      await client.query(
        'INSERT INTO ai_reports (user_id, tipo, contenuto, created_at) VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()))',
        [utente.id, riga.tipo || 'analisi', riga.contenuto || '', riga.created_at || null]
      );
    }

    for (const riga of Array.isArray(dati.ai_usage) ? dati.ai_usage : []) {
      await client.query(
        `INSERT INTO ai_usage (user_id, data, conteggio) VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3)
         ON CONFLICT (user_id, data) DO UPDATE SET conteggio = EXCLUDED.conteggio`,
        [utente.id, valoreGiorno(riga), Number(riga.conteggio) || 0]
      );
    }

    await registraLog(client, 'ripristina backup', nome + ' (backup ' + backup.id + ')');
    await client.query('COMMIT');
    res.json({
      ok: true,
      utente: { id: utente.id, nome: utente.name },
      ricreato,
      ripristinati: {
        profilo: Boolean(p),
        pesate: (dati.weight_logs || []).length,
        allenamenti: (dati.workouts || []).length,
        report: (dati.ai_reports || []).length,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
