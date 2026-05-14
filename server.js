require("dotenv").config();
const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const path = require("path");
const { pool, initDb } = require("./src/db");
const { runSync } = require("./src/sync");
const { startScheduler, getSyncState } = require("./src/scheduler");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet({ contentSecurityPolicy:false }));
app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({
  store:new PgSession({pool, tableName:"session", createTableIfMissing:true}),
  secret:process.env.SESSION_SECRET || "dev-secret-change-me",
  resave:false,
  saveUninitialized:false,
  cookie:{httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", maxAge:1000*60*60*12}
}));
app.use(express.static(path.join(__dirname,"public")));
function requireAuth(req,res,next){ if(req.session && req.session.user) return next(); return res.status(401).json({error:"Non autorizzato"}); }
app.get("/api/me", (req,res)=> res.json({user:req.session.user || null}));
app.post("/api/login", async (req,res)=>{
  const {username,password} = req.body;
  const r = await pool.query("SELECT id,username,password_hash FROM admin_users WHERE username=$1 LIMIT 1", [username]);
  if(!r.rows.length) return res.status(401).json({error:"Credenziali non valide"});
  const ok = await bcrypt.compare(password, r.rows[0].password_hash);
  if(!ok) return res.status(401).json({error:"Credenziali non valide"});
  req.session.user = {id:r.rows[0].id, username:r.rows[0].username};
  res.json({success:true});
});
app.post("/api/logout", (req,res)=> req.session.destroy(()=>res.json({success:true})));
app.get("/api/results", requireAuth, async (req,res)=>{
  const search=(req.query.search||"").trim(); const limit=Math.min(parseInt(req.query.limit||"1000",10),5000); const offset=Math.max(parseInt(req.query.offset||"0",10),0);
  const params=[]; let where="";
  if(search){ params.push(`%${search}%`); where="WHERE COALESCE(matricola,'') ILIKE $1 OR COALESCE(stato,'') ILIKE $1 OR COALESCE(partita_iva,'') ILIKE $1 OR COALESCE(partita_iva_vp,'') ILIKE $1 OR COALESCE(cf_tecnico,'') ILIKE $1"; }
  params.push(limit,offset);
  const rows=await pool.query(`SELECT * FROM results ${where} ORDER BY id ASC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
  const count=await pool.query(`SELECT COUNT(*)::int AS total FROM results ${where}`, search?[params[0]]:[]);
  res.json({rows:rows.rows,total:count.rows[0].total,limit,offset});
});
app.post("/api/sync", requireAuth, async (req,res)=>{ runSync({manual:true}).catch(console.error); res.json({success:true,message:"Sincronizzazione avviata"}); });
app.get("/api/sync/status", requireAuth, (req,res)=>res.json(getSyncState()));
app.get("/api/sync/logs", requireAuth, async (req,res)=>{ const logs=await pool.query("SELECT * FROM sync_log ORDER BY id DESC LIMIT 100"); res.json(logs.rows); });
app.get("*", (req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
(async()=>{ await initDb(); startScheduler(); app.listen(PORT,()=>console.log(`Server attivo su porta ${PORT}`)); })();
