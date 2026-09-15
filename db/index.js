// Pool PostgreSQL condiviso. Nessun dato viene scritto su file: tutto sta sul database.
const { Pool } = require('pg');

const inProduzione = process.env.NODE_ENV === 'production';

// Su Railway la connessione passa da SSL: in produzione accettiamo il certificato
// autofirmato del provider. DATABASE_SSL=off permette di disattivarlo se il
// database non parla SSL (es. rete interna di alcuni provider).
function configSsl() {
  if (String(process.env.DATABASE_SSL || '').toLowerCase() === 'off') return false;
  if (String(process.env.DATABASE_SSL || '').toLowerCase() === 'on') return { rejectUnauthorized: false };
  return inProduzione ? { rejectUnauthorized: false } : false;
}

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL non configurata: impossibile connettersi a PostgreSQL.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: configSsl(),
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[db] errore inatteso sul pool:', err.message);
});

function query(text, params) {
  return pool.query(text, params);
}

// Restituisce la prima riga oppure null.
async function uno(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

// Restituisce tutte le righe.
async function tutte(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

module.exports = { pool, query, uno, tutte };
