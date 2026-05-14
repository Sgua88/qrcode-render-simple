const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const db = new sqlite3.Database("qrcode.db");

app.get("/api/results", (req, res) => {

  const search = (req.query.search || "").toLowerCase();

  db.all(`
    SELECT
      results.*,
      urls.last_checked,
      urls.url
    FROM results
    LEFT JOIN urls
    ON results.url_id = urls.rowid
    LIMIT 1000
  `, [], (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    let filtered = rows;

    if(search){

      filtered = rows.filter(r => {

        return Object.values(r)
        .join(" ")
        .toLowerCase()
        .includes(search);

      });

    }

    res.json(filtered);
  });

});

app.listen(PORT, () => {
  console.log("QRCode Browser SQLite online");
});