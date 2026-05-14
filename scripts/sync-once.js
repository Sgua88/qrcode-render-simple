require("dotenv").config();
const { initDb, pool } = require("../src/db");
const { runSync } = require("../src/sync");
(async()=>{ await initDb(); await runSync({manual:true}); await pool.end(); })();
