const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      original_id INTEGER UNIQUE,
      url TEXT UNIQUE,
      last_checked TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      original_id INTEGER UNIQUE,
      url_id INTEGER REFERENCES urls(id) ON DELETE SET NULL,
      matricola TEXT,
      stato TEXT,
      ultima_vp TEXT,
      risultato_vp TEXT,
      partita_iva_vp TEXT,
      ultima_trasmissione TEXT,
      versione_fw TEXT,
      partita_iva TEXT,
      cf_tecnico TEXT,
      url TEXT,
      last_checked TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_results_matricola ON results(matricola);
    CREATE INDEX IF NOT EXISTS idx_results_partita_iva ON results(partita_iva);
    CREATE INDEX IF NOT EXISTS idx_results_cf_tecnico ON results(cf_tecnico);
    CREATE TABLE IF NOT EXISTS sync_log (
      id SERIAL PRIMARY KEY,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      manual BOOLEAN DEFAULT FALSE,
      total INTEGER DEFAULT 0,
      processed INTEGER DEFAULT 0,
      updated INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      message TEXT
    );
  `);
}
module.exports = { pool, initDb };
