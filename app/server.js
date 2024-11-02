const pg = require("pg");
const path = require("path");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../config/env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  // Re-direct "/" to listing.html
  res.sendFile(path.join(__dirname, 'public', 'listing.html')); // listing.html is a placeholder for not
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
