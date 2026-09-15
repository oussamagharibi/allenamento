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
app.use('/css', express.static(path.join(PUBLIC_DIR, 'css'), { maxAge: inProduzione ? '1h' : 0 }));
app.use('/js', express.static(path.join(PUBLIC_DIR, 'js'), { maxAge: inProduzione ? '1h' : 0 }));

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

// API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profilo', require('./routes/profilo'));

app.use('/api', (req, res) => res.status(404).json({ errore: 'Endpoint non trovato' }));
app.use((req, res) => res.redirect('/'));

// Gestore errori: niente dettagli interni verso il browser.
app.use((err, req, res, next) => {
  console.error('[errore]', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ errore: 'Errore interno del server' });
});

async function avvia() {
  console.log(`[avvio] ambiente: ${inProduzione ? 'produzione' : 'sviluppo'}`);
  console.log(`[avvio] AI: ${process.env.ANTHROPIC_API_KEY ? 'configurata' : 'non configurata'}`);
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
