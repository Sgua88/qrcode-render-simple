require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const { pool, initDb } = require("../src/db");
const SQLITE_FILE = process.env.SQLITE_FILE || "qrcode.db";
function all(db,sql,params=[]){ return new Promise((resolve,reject)=>db.all(sql,params,(err,rows)=>err?reject(err):resolve(rows))); }
(async()=>{
  await initDb(); const db = new sqlite3.Database(SQLITE_FILE);
  const urls = await all(db,"SELECT rowid AS original_id, url, last_checked FROM urls");
  for(const u of urls){ await pool.query("INSERT INTO urls (original_id,url,last_checked) VALUES ($1,$2,$3) ON CONFLICT (original_id) DO UPDATE SET url=EXCLUDED.url,last_checked=EXCLUDED.last_checked,updated_at=NOW()", [u.original_id,u.url,u.last_checked]); }
  const results = await all(db,"SELECT rowid AS original_id, url_id, matricola, stato, ultima_vp, risultato_vp, partita_iva_vp, ultima_trasmissione, versione_fw, partita_iva FROM results");
  for(const r of results){
    const mu=await pool.query("SELECT id,url,last_checked FROM urls WHERE original_id=$1 LIMIT 1", [r.url_id]);
    const urlId=mu.rows[0]?.id||null, url=mu.rows[0]?.url||null, lastChecked=mu.rows[0]?.last_checked||null;
    await pool.query(`INSERT INTO results (original_id,url_id,matricola,stato,ultima_vp,risultato_vp,partita_iva_vp,ultima_trasmissione,versione_fw,partita_iva,url,last_checked) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (original_id) DO UPDATE SET url_id=EXCLUDED.url_id,matricola=EXCLUDED.matricola,stato=EXCLUDED.stato,ultima_vp=EXCLUDED.ultima_vp,risultato_vp=EXCLUDED.risultato_vp,partita_iva_vp=EXCLUDED.partita_iva_vp,ultima_trasmissione=EXCLUDED.ultima_trasmissione,versione_fw=EXCLUDED.versione_fw,partita_iva=EXCLUDED.partita_iva,url=EXCLUDED.url,last_checked=EXCLUDED.last_checked,updated_at=NOW()`, [r.original_id,urlId,r.matricola,r.stato,r.ultima_vp,r.risultato_vp,r.partita_iva_vp,r.ultima_trasmissione,r.versione_fw,r.partita_iva,url,lastChecked]);
  }
  console.log(`Import completato: ${urls.length} URL, ${results.length} risultati.`);
  db.close(); await pool.end();
})();
