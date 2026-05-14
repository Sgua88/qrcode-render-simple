const puppeteer = require("puppeteer");
const { pool } = require("./db");
const { updateSyncState } = require("./scheduler");
function extractCF(html){ const m = html.match(/[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]/); return m ? m[0] : null; }
function extractByLabel(text, labels){
  for (const label of labels){
    const re = new RegExp(`${label}\\s*[:\\-]?\\s*([^\\n\\r]+)`, "i");
    const m = text.match(re); if(m) return m[1].trim();
  }
  return null;
}
async function runSync(options={}){
  const manual = !!options.manual;
  const active = await pool.query("SELECT id FROM sync_log WHERE status='running' LIMIT 1");
  if(active.rows.length){ updateSyncState({message:"Sincronizzazione già in corso"}); return; }
  const log = await pool.query("INSERT INTO sync_log (manual,status,message) VALUES ($1,'running','Sincronizzazione avviata') RETURNING id", [manual]);
  const logId = log.rows[0].id;
  updateSyncState({running:true,startedAt:new Date().toISOString(),finishedAt:null,total:0,processed:0,updated:0,errors:0,message:"Sincronizzazione in corso"});
  let browser;
  try{
    const limit = Number(process.env.SYNC_LIMIT || 0);
    const q = `SELECT id,url FROM results WHERE url IS NOT NULL AND url <> '' ORDER BY id ASC ${limit>0 ? `LIMIT ${limit}` : ""}`;
    const rows = (await pool.query(q)).rows;
    updateSyncState({total:rows.length});
    browser = await puppeteer.launch({headless: process.env.PUPPETEER_HEADLESS !== "false", args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    let processed=0, updated=0, errors=0;
    for(const row of rows){
      try{
        await page.goto(row.url,{waitUntil:"networkidle2",timeout:120000});
        const html = await page.content();
        const text = await page.evaluate(() => document.body.innerText || "");
        const cfTecnico = extractCF(html) || extractCF(text);
        const stato = extractByLabel(text,["Stato"]);
        const ultimaVP = extractByLabel(text,["Ultima VP"]);
        const risultatoVP = extractByLabel(text,["Risultato VP"]);
        const ultimaTrasmissione = extractByLabel(text,["Ultima trasmissione"]);
        const versioneFW = extractByLabel(text,["Versione FW"]);
        await pool.query(`UPDATE results SET cf_tecnico=COALESCE($1,cf_tecnico), stato=COALESCE($2,stato), ultima_vp=COALESCE($3,ultima_vp), risultato_vp=COALESCE($4,risultato_vp), ultima_trasmissione=COALESCE($5,ultima_trasmissione), versione_fw=COALESCE($6,versione_fw), updated_at=NOW() WHERE id=$7`, [cfTecnico,stato,ultimaVP,risultatoVP,ultimaTrasmissione,versioneFW,row.id]);
        updated++;
      } catch(e){ errors++; console.error(`Errore record ${row.id}:`, e.message); }
      processed++;
      updateSyncState({processed,updated,errors,message:`Sincronizzazione in corso: ${processed}/${rows.length}`});
      await pool.query("UPDATE sync_log SET processed=$1,updated=$2,errors=$3,total=$4 WHERE id=$5", [processed,updated,errors,rows.length,logId]);
    }
    await pool.query("UPDATE sync_log SET finished_at=NOW(),status='completed',message='Sincronizzazione completata',processed=$1,updated=$2,errors=$3,total=$4 WHERE id=$5", [processed,updated,errors,rows.length,logId]);
    updateSyncState({running:false,finishedAt:new Date().toISOString(),processed,updated,errors,total:rows.length,message:"Sincronizzazione completata"});
  } catch(e){
    await pool.query("UPDATE sync_log SET finished_at=NOW(),status='failed',message=$1 WHERE id=$2", [e.message,logId]);
    updateSyncState({running:false,finishedAt:new Date().toISOString(),message:`Errore: ${e.message}`}); throw e;
  } finally { if(browser) await browser.close(); }
}
module.exports = { runSync };
