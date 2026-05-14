require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, initDb } = require("../src/db");
(async()=>{
  await initDb();
  const username=process.env.ADMIN_USER||process.argv[2]||"admin";
  const password=process.env.ADMIN_PASSWORD||process.argv[3];
  if(!password){ console.error("Imposta ADMIN_PASSWORD oppure passa la password come argomento."); process.exit(1); }
  const hash=await bcrypt.hash(password,12);
  await pool.query("INSERT INTO admin_users (username,password_hash) VALUES ($1,$2) ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash", [username,hash]);
  console.log("Admin creato/aggiornato:", username);
  await pool.end();
})();
