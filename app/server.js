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
}).catch(error => {
  console.error("Database connection error:", error);
});

app.use(express.static("public"));
app.use(express.json());

// Serve the listing.html page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html')); // listing.html is a placeholder for not
});

// Endpoint to handle form submission and insert listing into database
app.post("/add-listing", (req, res) => {
  const { name, description, price, tags, photo } = req.body;

  // Insert data into the Listings table
  pool.query(
    `INSERT INTO Listings (title, description, price, listing_date, status) 
    VALUES ($1, $2, $3, NOW(), 'available') RETURNING listing_id`,
    [name, description, price]
  )
  .then(result => {
    let listingId = result.rows[0].listing_id;

    // Insert tags if needed (chaining promises)
    let tagPromises = tags.map(tag => {
      return pool.query(
        `INSERT INTO Tags (tag_name) 
        VALUES ($1) 
        ON CONFLICT (tag_name) DO NOTHING`,
        [tag]
      ).then(() => {
        return pool.query(`SELECT tag_id FROM Tags WHERE tag_name = $1`, [tag]);
      }).then(tagResult => {
        const tagId = tagResult.rows[0].tag_id;
        return pool.query(
          `INSERT INTO ListingTags (listing_id, tag_id) VALUES ($1, $2)`,
          [listingId, tagId]
        );
      });
    });

    // Execute all tag insertion promises
    return Promise.all(tagPromises);
  })
  .then(() => {
    res.status(200).json({ message: "Listing added successfully" });
  })
  .catch(error => {
    console.error("Error inserting listing:", error);
    res.status(500).json({ message: "Failed to add listing" });
  });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
