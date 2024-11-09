const pg = require("pg");
const path = require("path");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../config/env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(() => {
  console.log(`Connected to database ${env.database}`);
});

app.use(express.static("public"));
app.use(express.json());

// Route for the main page showing all listings
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for viewing an individual product page
app.get("/product.html", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Endpoint to fetch all listings
app.get("/api/listings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Listings");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Endpoint to fetch a single listing by ID
app.get("/api/listings/:id", async (req, res) => {
  const listingId = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM Listings WHERE listing_id = $1", [listingId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Listing not found" });
    }
  } catch (err) {
    console.error("Error fetching listing:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
