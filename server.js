const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const db = new sqlite3.Database("qrcode.db");

let syncStatus = {
  running: false,
  updated: 0,
  startedAt: null,
  lastRun: null
};

function updateLastCheck() {

  console.log("SYNC 01:00 AVVIATA");

  syncStatus.running = true;
  syncStatus.updated = 0;
  syncStatus.startedAt = new Date();

  const today = new Date().toISOString().split("T")[0];

  db.run(`
    UPDATE urls
    SET last_checked = ?
  `, [today], function(err){

    syncStatus.running = false;
    syncStatus.updated = this.changes || 0;
    syncStatus.lastRun = new Date().toISOString();

    if(err){
      console.log(err.message);
    } else {
      console.log("Aggiornati:", this.changes);
    }

  });

}

cron.schedule("0 1 * * *", () => {
  updateLastCheck();
});

app.get("/api/sync-status", (req,res)=>{
  res.json(syncStatus);
});

app.post("/api/manual-sync", (req,res)=>{

  updateLastCheck();

  res.json({
    success:true
  });

});

app.get("/api/results", (req, res) => {

  const page = parseInt(req.query.page || "1");
  const limit = 100;
  const offset = (page - 1) * limit;

  const search = (req.query.search || "").trim();

  let query = `
    SELECT
      results.*,
      urls.last_checked,
      urls.url
    FROM results
    LEFT JOIN urls
    ON results.url_id = urls.rowid
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM results
    LEFT JOIN urls
    ON results.url_id = urls.rowid
  `;

  let params = [];

  if(search){

    query += `
      WHERE
      matricola LIKE ?
      OR stato LIKE ?
      OR partita_iva LIKE ?
      OR partita_iva_vp LIKE ?
    `;

    countQuery += `
      WHERE
      matricola LIKE ?
      OR stato LIKE ?
      OR partita_iva LIKE ?
      OR partita_iva_vp LIKE ?
    `;

    const term = `%${search}%`;

    params = [term, term, term, term];

  }

  query += `
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  db.get(countQuery, params, (err, countRow)=>{

    if(err){
      return res.status(500).json(err);
    }

    db.all(query, params, (err, rows) => {

      if(err){
        return res.status(500).json(err);
      }

      res.json({
        rows,
        total: countRow.total,
        page,
        totalPages: Math.ceil(countRow.total / limit)
      });

    });

  });

});

app.listen(PORT, () => {
  console.log("QRCode Browser Optimized online");
});