require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, initDb } = require("../src/db");
(async()=>{
  await initDb();
const username = "admin";
const password = "Admin2026!";
  const hash=await bcrypt.hash(password,12);
  await pool.query("INSERT INTO admin_users (username,password_hash) VALUES ($1,$2) ON CONFLICT (username) DO NOTHING", [username,hash]);
  console.log("Database inizializzato. Admin:", username);
  await pool.end();
})();
