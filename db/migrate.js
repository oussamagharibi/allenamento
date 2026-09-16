// Migrazione automatica: viene eseguita a ogni avvio, e' idempotente.
const { pool } = require('./index');

const SQL = [
  `CREATE TABLE IF NOT EXISTS users (
     id         SERIAL PRIMARY KEY,
     name       TEXT NOT NULL UNIQUE,
     pin_hash   TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // Il confronto dei nomi e' case-insensitive: l'indice garantisce l'unicita' reale.
  `CREATE UNIQUE INDEX IF NOT EXISTS users_name_lower_idx ON users (lower(name))`,

  `CREATE TABLE IF NOT EXISTS profiles (
     user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     peso             NUMERIC(5,2) NOT NULL,
     altezza          INTEGER NOT NULL,
     eta              INTEGER NOT NULL,
     sesso            TEXT NOT NULL,
     luogo            TEXT NOT NULL,
     attrezzatura     TEXT[] NOT NULL DEFAULT '{}',
     obiettivo        TEXT NOT NULL,
     livello          TEXT NOT NULL,
     giorni_settimana INTEGER NOT NULL,
     minuti_sessione  INTEGER NOT NULL,
     infortuni        TEXT NOT NULL DEFAULT '',
     updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS weight_logs (
     id      SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     peso    NUMERIC(5,2) NOT NULL,
     misure  JSONB NOT NULL DEFAULT '{}'::jsonb,
     data    DATE NOT NULL DEFAULT CURRENT_DATE
   )`,

  `CREATE INDEX IF NOT EXISTS weight_logs_user_idx ON weight_logs (user_id, data DESC)`,

  `CREATE TABLE IF NOT EXISTS workouts (
     id         SERIAL PRIMARY KEY,
     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     data       DATE NOT NULL,
     completato BOOLEAN NOT NULL DEFAULT FALSE,
     esercizi   JSONB NOT NULL DEFAULT '[]'::jsonb,
     titolo     TEXT,
     origine    TEXT NOT NULL DEFAULT 'app',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS workouts_user_idx ON workouts (user_id, data DESC)`,

  `CREATE TABLE IF NOT EXISTS ai_usage (
     user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     data      DATE NOT NULL DEFAULT CURRENT_DATE,
     conteggio INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (user_id, data)
   )`,

  `CREATE TABLE IF NOT EXISTS ai_reports (
     id         SERIAL PRIMARY KEY,
     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     tipo       TEXT NOT NULL,
     contenuto  TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS ai_reports_user_idx ON ai_reports (user_id, created_at DESC)`,

  // Ultimo accesso: aggiunto dopo, quindi va creato anche sui database gia esistenti.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`,

  // Sezione alimentazione: campi facoltativi aggiunti dopo il primo rilascio.
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferenze_alimentari TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergie TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pasti_giorno INTEGER NOT NULL DEFAULT 4`,

  // Diario dell acqua: piu registrazioni nello stesso giorno si sommano.
  `CREATE TABLE IF NOT EXISTS water_logs (
     id         SERIAL PRIMARY KEY,
     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     data       DATE NOT NULL DEFAULT CURRENT_DATE,
     ml         INTEGER NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS water_logs_user_idx ON water_logs (user_id, data DESC)`,

  // Diario dei pasti. La miniatura e piccola e sta nel database: su Railway il
  // filesystem viene ricreato a ogni rilascio, quindi non si salva nulla su disco.
  `CREATE TABLE IF NOT EXISTS meal_logs (
     id          SERIAL PRIMARY KEY,
     user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     data        DATE NOT NULL DEFAULT CURRENT_DATE,
     tipo_pasto  TEXT NOT NULL,
     descrizione TEXT NOT NULL DEFAULT '',
     calorie     INTEGER NOT NULL DEFAULT 0,
     proteine    INTEGER NOT NULL DEFAULT 0,
     carboidrati INTEGER NOT NULL DEFAULT 0,
     grassi      INTEGER NOT NULL DEFAULT 0,
     fonte       TEXT NOT NULL DEFAULT 'manuale',
     confidenza  TEXT,
     thumbnail   BYTEA,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS meal_logs_user_idx ON meal_logs (user_id, data DESC)`,

  // Il contatore AI ora distingue i tipi di richiesta: le analisi foto hanno un
  // limite separato. La vecchia chiave primaria viene sostituita da un indice
  // unico sui tre campi, cosi la migrazione resta ripetibile senza errori.
  `ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'generale'`,
  `ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_pkey`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_chiave_idx ON ai_usage (user_id, data, tipo)`,

  // Copia di sicurezza creata prima di ogni azzeramento o eliminazione dal pannello admin.
  `CREATE TABLE IF NOT EXISTS admin_backups (
     id         SERIAL PRIMARY KEY,
     user_name  TEXT NOT NULL,
     dati       JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS admin_backups_data_idx ON admin_backups (created_at DESC)`,

  // Storico delle operazioni admin. Non contiene mai password.
  `CREATE TABLE IF NOT EXISTS admin_log (
     id         SERIAL PRIMARY KEY,
     azione     TEXT NOT NULL,
     target     TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS admin_log_data_idx ON admin_log (created_at DESC)`,

  // --- Musica: scelte di ascolto e clic sui link ------------------------------

  `CREATE TABLE IF NOT EXISTS music_prefs (
     id         SERIAL PRIMARY KEY,
     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     mood       TEXT NOT NULL,
     stile      TEXT NOT NULL,
     paese      TEXT NOT NULL,
     preferita  BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS music_prefs_utente_idx ON music_prefs (user_id, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS music_events (
     id          SERIAL PRIMARY KEY,
     user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     mood        TEXT,
     stile       TEXT,
     paese       TEXT,
     query       TEXT NOT NULL,
     piattaforma TEXT NOT NULL,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS music_events_utente_idx ON music_events (user_id, created_at DESC)`,

  // --- Spotify: token cifrati e brani ascoltati -------------------------------

  `CREATE TABLE IF NOT EXISTS spotify_tokens (
     user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     access_token  TEXT NOT NULL,
     refresh_token TEXT NOT NULL,
     expires_at    TIMESTAMPTZ NOT NULL,
     scope         TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS listening_logs (
     id          SERIAL PRIMARY KEY,
     user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     track_id    TEXT,
     track_name  TEXT,
     artist      TEXT,
     album_image TEXT,
     workout_id  INTEGER REFERENCES workouts(id) ON DELETE SET NULL,
     played_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE INDEX IF NOT EXISTS listening_logs_utente_idx ON listening_logs (user_id, played_at DESC)`,
];

async function migra() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sql of SQL) {
      await client.query(sql);
    }
    await client.query('COMMIT');
    const { rows } = await pool.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log('[db] migrazione completata. Tabelle:', rows.map((r) => r.table_name).join(', '));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { migra };
