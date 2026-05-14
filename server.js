const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

let syncRunning = false;
let syncSeconds = 0;

app.use(express.static("public"));
app.use(express.json());

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    syncRunning,
    syncSeconds
  });
});

app.post("/api/sync", (req, res) => {

  if(syncRunning){
    return res.json({
      success:false,
      message:"Sync già in corso"
    });
  }

  syncRunning = true;
  syncSeconds = 0;

  const interval = setInterval(() => {

    syncSeconds++;

    if(syncSeconds >= 15){
      clearInterval(interval);
      syncRunning = false;
    }

  }, 1000);

  res.json({
    success:true,
    message:"Sincronizzazione avviata"
  });
});

app.listen(PORT, () => {
  console.log("QRCode Browser Free online");
});