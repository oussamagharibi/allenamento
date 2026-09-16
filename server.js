// Web app di allenamento: accesso, profili, schede, progressi e coach AI.
require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const { pool } = require('./db');
const { migra } = require('./db/migrate');
const { paginaSito, paginaUtente } = require('./middleware/auth');

const app = express();
const inProduzione = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.set('trust proxy', 1);
app.disable('x-powered-by');
// L analisi della foto riceve un immagine in base64: solo per quella rotta il
// corpo puo essere piu grande. Il parser generale resta piccolo.
app.use('/api/ai/pasto', express.json({ limit: '4mb' }));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

// Il segreto deve arrivare dall'ambiente. Senza, generiamo uno casuale: l'app
// funziona ma le sessioni si invalidano a ogni riavvio.
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[avvio] SESSION_SECRET non configurata: uso un segreto casuale temporaneo.');
}

app.use(
  session({
    store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    name: 'allenamento.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: inProduzione,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

// Solo CSS e JS sono statici: le pagine HTML passano dai controlli di accesso.
// I file vengono sempre rivalidati ("no-cache" non vuol dire "non salvare": il
// browser chiede al server se sono cambiati e di solito riceve un 304 leggero).
// Serve perche le pagine HTML cambiano insieme ai loro script: se il browser
// tenesse un JS vecchio accanto a un HTML nuovo, lo script cercherebbe elementi
// che non esistono piu e la pagina resterebbe a meta.
const staticiSempreFreschi = {
  etag: true,
  maxAge: 0,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
};
app.use('/css', express.static(path.join(PUBLIC_DIR, 'css'), staticiSempreFreschi));
app.use('/js', express.static(path.join(PUBLIC_DIR, 'js'), staticiSempreFreschi));

// File della PWA: manifest, service worker e icone.
app.use('/icone', express.static(path.join(PUBLIC_DIR, 'icone'), { maxAge: inProduzione ? '7d' : 0 }));
app.get('/manifest.json', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'manifest.json')));
app.get('/sw.js', (req, res) => {
  // Il service worker non va mai messo in cache: altrimenti gli aggiornamenti non arrivano.
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(PUBLIC_DIR, 'sw.js'));
});

app.get('/salute', (req, res) => res.json({ ok: true }));

// Pagina 1: password del sito.
app.get('/', (req, res) => {
  if (req.session.sitoOk && req.session.userId) return res.redirect('/app');
  if (req.session.sitoOk) return res.redirect('/utente');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Pagina 2: scelta del nome.
app.get('/utente', paginaSito, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'utente.html'));
});

// App vera e propria.
app.get('/app', paginaUtente, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'app.html'));
});

// Pannello di amministrazione: senza ADMIN_PASSWORD non esiste.
app.get('/admin', (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    console.log('[admin] disattivato');
    return res.status(404).type('text/plain; charset=utf-8').send('Non trovato');
  }
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

// API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profilo', require('./routes/profilo'));
app.use('/api/allenamenti', require('./routes/allenamenti'));
app.use('/api/esercizi', require('./routes/esercizi'));
app.use('/api/alimentazione', require('./routes/alimentazione'));
app.use('/api/diario', require('./routes/diario'));
app.use('/api/progressi', require('./routes/progressi'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api', (req, res) => res.status(404).json({ errore: 'Endpoint non trovato' }));
app.use((req, res) => res.redirect('/'));

// Gestore errori: niente dettagli interni verso il browser.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Corpo troppo grande (per esempio una foto non ridotta): si dice chiaramente.
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ errore: 'Dati troppo grandi: riduci la foto e riprova.' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ errore: 'Richiesta non leggibile.' });
  }

  console.error('[errore]', err && err.stack ? err.stack : err);
  res.status(500).json({ errore: 'Errore interno del server' });
});

async function avvia() {
  console.log(`[avvio] ambiente: ${inProduzione ? 'produzione' : 'sviluppo'}`);
  console.log(`[avvio] AI: ${process.env.ANTHROPIC_API_KEY ? 'configurata' : 'non configurata'}`);
  if (process.env.ADMIN_PASSWORD) console.log('[avvio] pannello admin attivo su /admin');
  else console.log('[admin] disattivato');
  try {
    await migra();
  } catch (err) {
    console.error('[avvio] migrazione fallita:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`[avvio] server in ascolto sulla porta ${PORT}`);
  });
}

if (require.main === module) {
  avvia();
}

module.exports = app;
