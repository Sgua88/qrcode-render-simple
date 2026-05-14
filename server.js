const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    status: "QRCode Browser Online"
  });
});

app.listen(PORT, () => {
  console.log("Server avviato");
});