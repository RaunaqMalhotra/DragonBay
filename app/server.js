const pg = require("pg");
const path = require("path");
const express = require("express");
const app = express();
const argon2 = require("argon2"); 
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const cors = require("cors"); // Import cors
const http = require('http'); // To create the server

const server = http.createServer(app); // Create HTTP server
const { Server } = require('socket.io');

const port = process.env.PORT || 3000;
const hostname = "localhost";
const ADMIN = "Admin";

const env = require("../config/env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
const multer = require("multer");

// Store connected users
let tokenStorage = {};

pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
}).catch(error => {
  console.error("Database connection error:", error);
});


app.use(express.json());
app.use(cookieParser());
app.use(cors());

const ioServer = new Server(server, {
  cors: {
    origin: '*', // Allow requests from frontend
    methods: ["GET", "POST"],
  },
});

// Socket.IO logic
ioServer.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
  });

  socket.on("new-bid", (bid) => {
      console.log("New bid received:", bid);
      ioServer.emit("bid-update", bid); // Broadcast bid to all connected clients
  });
});

app.use((req, res, next) => {
  const token = req.cookies.token;

  if (token && tokenStorage[token]) {
      req.username = tokenStorage[token];
  }
  next();
});

//state 
const UsersState = {
  users: [],
  setUsers: function(newUsersArray) {
      this.users = newUsersArray;
  }
};

// Serve the login.html page
app.get("/", (req, res) => {
  // Re-direct "/" to login.html
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // login.html is a placeholder
});


/* middleware; check if login token in token storage, if not, redirect to login page */
let authorize = (req, res, next) => {
  let { token } = req.cookies;
  console.log(token, tokenStorage);
  if (token === undefined || !tokenStorage.hasOwnProperty(token)) {
    return res.redirect('/login.html');
  }
  next();
};

app.get('/listing.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'listing.html'));
});

app.get('/bidding.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bidding.html'));
});

app.get('/profile.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/product.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/bid_detail.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bid_detail.html'));
});

app.get('/bid_product.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bid_product.html'));
});

app.get('/bidding.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bidding.html'));
});

app.get('/chat.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/index.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/messages.html', authorize, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

app.use(cors());
app.use(express.static("public"));

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "public/uploads/profile_pictures/");
  },
  filename: function (req, file, cb) {
      const uniqueName = `user-${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Endpoint to handle profile picture upload
app.post("/upload-profile-picture", upload.single("profilePicture"), (req, res) => {
  const username = tokenStorage[req.cookies.token];
  const filePath = `uploads/profile_pictures/${req.file.filename}`;
  pool.query(
      "UPDATE Users SET profile_picture_path = $1 WHERE username = $2",
      [filePath, username]
  )
  .then(() => {
      res.status(200).json({ message: "Profile picture uploaded successfully!", filePath });
  })
  .catch(error => {
      console.error("Error updating profile picture path:", error);
      res.status(500).json({ message: "Failed to update profile picture path" });
  });
});
app.get("/api/user/profile-picture", (req, res) => {
const username = tokenStorage[req.cookies.token];
pool.query("SELECT profile_picture_path FROM Users WHERE username = $1", [username])
    .then(result => {
        if (result.rows.length === 0 || !result.rows[0].profile_picture_path) {
            return res.status(404).json({ message: "Profile picture not found" });
        }
        res.json({ profilePicturePath: result.rows[0].profile_picture_path });
    })
    .catch(error => {
        console.error("Error fetching profile picture path:", error);
        res.status(500).json({ message: "Failed to fetch profile picture" });
    });
});

app.get('/profile', authorize, (req, res) => {
  const username = tokenStorage[req.cookies.token]; // Get username from tokenStorage

  pool.query('SELECT username, email FROM users WHERE username = $1', [username])
      .then(result => {
          if (result.rows.length === 0) {
              return res.status(404).json({ error: "User not found" });
          }
          res.json(result.rows[0]); // Send username and email
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({ error: "Database error" });
      });
});

app.post('/profile/update-password', authorize, async (req, res) => {
  const username = tokenStorage[req.cookies.token];
  const { newPassword } = req.body;

  try {
      const hashedPassword = await argon2.hash(newPassword);
      await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashedPassword, username]);
      res.json({ message: "Password updated successfully!" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update password" });
  }
});

// Storage for listing photos
const listingStorage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "public/uploads/listing_photos/"); // Directory for listing photos
  },
  filename: function (req, file, cb) {
      const uniqueName = `listing-${Date.now()}-${file.originalname}`; // Unique naming for listing photos
      cb(null, uniqueName);
  }
});
const listingUpload = multer({ storage: listingStorage });

// Endpoint to handle form submission and insert listing into database
app.post("/add-listing", listingUpload.array("photos", 10), (req, res) => {
  const { name, description, price, tags } = req.body;
  const username = tokenStorage[req.cookies.token];
  const filePaths = req.files.map(file => `uploads/listing_photos/${file.filename}`);

  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
      .then(result => {
          if (result.rows.length === 0) {
              return res.status(403).json({ message: "Unauthorized" });
          }
          const userId = result.rows[0].user_id;

          // Insert data into the Listings table
          return pool.query(
              `INSERT INTO Listings (user_id, title, description, price, listing_date, status) 
              VALUES ($1, $2, $3, $4, NOW(), 'available') RETURNING listing_id`,
              [userId, name, description, price]
          );
      })
      .then(result => {
          const listingId = result.rows[0].listing_id;

          // Insert photos into the Photos table
          const photoPromises = filePaths.map(path => {
              return pool.query(
                  `INSERT INTO Photos (listing_id, photo_url) VALUES ($1, $2)`,
                  [listingId, path]
              );
          });

          // Insert tags into the database
          const parsedTags = JSON.parse(tags);
          const tagPromises = parsedTags.map(tag => {
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

          return Promise.all([...photoPromises, ...tagPromises]);
      })
      .then(() => {
          res.status(200).json({ message: "Listing added successfully" });
      })
      .catch(error => {
          console.error("Error inserting listing:", error);
          res.status(500).json({ message: "Failed to add listing" });
      });
});

app.get("/api/user/listings", (req, res) => {
  const username = tokenStorage[req.cookies.token];
  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
    .then(result => {
        if (result.rows.length === 0) {
          return res.status(403).json({ message: "Unauthorized" });
        } 
        const userId = result.rows[0].user_id;
        console.log("User ID:", userId);
        return pool.query(
          `SELECT l.*,
                  ARRAY_AGG(p.photo_url) AS photos
           FROM Listings l
           LEFT JOIN Photos p ON l.listing_id = p.listing_id
           WHERE l.user_id = $1 AND l.is_auction = FALSE
           GROUP BY l.listing_id
           ORDER BY l.listing_date DESC`,
          [userId]
      );
    })
  .then(result => {
      res.json(result.rows); 
  })
  .catch(error => {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
  });
});

app.get("/api/user/biddings", (req, res) => {
  const username = tokenStorage[req.cookies.token];
  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
    .then(result => {
        if (result.rows.length === 0) {
          return res.status(403).json({ message: "Unauthorized" });
        } 
        const userId = result.rows[0].user_id;
        console.log("User ID:", userId);
        return pool.query(
          `SELECT l.*,
                  ARRAY_AGG(p.photo_url) AS photos
           FROM Listings l
           LEFT JOIN Photos p ON l.listing_id = p.listing_id
           WHERE l.user_id = $1 AND l.is_auction = TRUE
           GROUP BY l.listing_id
           ORDER BY l.listing_date DESC`,
          [userId]
      );
    })
  .then(result => {
      res.json(result.rows); 
  })
  .catch(error => {
      console.error("Error fetching user biddings:", error);
      res.status(500).json({ message: "Failed to fetch user biddings" });
  });
});


/* returns a random 32 byte string */
function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

let cookieOptions = {
  httpOnly: true, // client-side JS can't access this cookie; important to mitigate cross-site scripting attack damage
  secure: true, // cookie will only be sent over HTTPS connections (and localhost); important so that traffic sniffers can't see it even if our user tried to use an HTTP version of our site, if we supported that
  sameSite: "strict", // browser will only include this cookie on requests to this domain, not other domains; important to prevent cross-site request forgery attacks
};

// validate user sign up
async function validateSignUp(body) {
  let { username, email, password } = body;
  console.log(username, email, password);

  const emailDomain = email.split("@")[1];
  if (emailDomain !== "drexel.edu") {
    throw new Error("Must use a Drexel University email address");
  }

  // Check if username or email already exists
  const result = await pool.query(
    "SELECT 1 FROM users WHERE username = $1 OR email = $2 LIMIT 1",
    [username, email]
  );
  if (result.rows.length > 0) {
    throw new Error("Username or email already exists");
  }

  // Email verification request
  const url = `https://client.myemailverifier.com/verifier/validate_single/${email}/${env.EmailVerificationAPIKey}`;

  try {
    const emailResponse = await fetch(url);
    if (emailResponse.ok) {
      const data = await emailResponse.json();
      if (data.Status === "Invalid") {
        throw new Error("Invalid email address");
      }
    } else if (emailResponse.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    } else {
      throw new Error("Failed to verify email address");
    }
  } catch (error) {
    console.error("Email verification error:", error.message);
    throw new Error("Email verification service error");
  }
  return true;
}

// Endpoint to handle bid form submission and insert bid listing into database
app.post("/add-bid-listing", listingUpload.array("photos", 10), (req, res) => {
  const { name, description, minimumBid, minimumIncrease, auctionEndDate } = req.body;
  const username = tokenStorage[req.cookies.token];
  const filePaths = req.files.map(file => `uploads/listing_photos/${file.filename}`);

  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
      .then(result => {
          if (result.rows.length === 0) {
              return res.status(403).json({ message: "Unauthorized" });
          }
          const userId = result.rows[0].user_id;

          return pool.query(
              `INSERT INTO Listings (user_id, title, description, minimum_bid, minimum_increase, auction_end_date, listing_date, status, is_auction) 
              VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'open', TRUE) 
              RETURNING listing_id`,
              [userId, name, description, minimumBid, minimumIncrease, auctionEndDate]
          );
      })
      .then(result => {
          const listingId = result.rows[0].listing_id;

          // Insert photos into the Photos table
          const photoPromises = filePaths.map(path => {
              return pool.query(
                  `INSERT INTO Photos (listing_id, photo_url) VALUES ($1, $2)`,
                  [listingId, path]
              );
          });

          return Promise.all(photoPromises);
      })
      .then(() => {
          res.status(200).json({ success: true, message: "Bid listing added successfully!" });
      })
      .catch(error => {
          console.error("Error adding bid listing:", error);
          res.status(500).json({ success: false, message: "Failed to add bid listing" });
      });
});

// Endpoint to fetch all non-auction listings with photos
app.get("/api/listings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*,
              ARRAY_AGG(p.photo_url) AS photos
       FROM Listings l
       LEFT JOIN Photos p
       ON l.listing_id = p.listing_id
       WHERE l.is_auction = false
       GROUP BY l.listing_id`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// Endpoint to fetch a single listing by ID
app.get("/api/listings/:id", async (req, res) => {
  const listingId = req.params.id;
  const account_username = req.username;

  try {
      // Fetch listing details
      const listingResult = await pool.query(
        `SELECT l.*, u.username AS seller_username
        FROM Listings l 
        LEFT JOIN Users u 
        ON l.user_id = u.user_id
        WHERE listing_id = $1`,
        [listingId]
      );

      if (listingResult.rows.length === 0) {
          return res.status(404).json({ error: "Listing not found" });
      }

      const listing = listingResult.rows[0];

      // Fetch photos for the listing
      const photosResult = await pool.query(
          `SELECT photo_url 
          FROM Photos 
          WHERE listing_id = $1`,
          [listingId]
      );

      const photos = photosResult.rows.map(photo => photo.photo_url);

      // Combine listing details with photos
      res.json({ ...listing, photos, account_username });
  } catch (err) {
      console.error("Error fetching listing details:", err);
      res.status(500).json({ error: "Database error" });
  }
});

// Endpoint to create a user
app.post("/create", async (req, res) => {
  let { body } = req;
  let { username, email, password } = body;
  // validate body is correct shape and type
  try {
    await validateSignUp(body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  let hash;
  try {
    hash = await argon2.hash(password);
  } catch (error) {
    console.log("HASH FAILED", error);
    return res.sendStatus(500); // TODO
  }

  console.log(hash); // TODO just for debugging
  try {
    await pool.query("INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)", [
      username,
      email,
      hash,
    ]);
  } catch (error) {
    console.log("INSERT FAILED", error);
    return res.sendStatus(500); // TODO
  }

  // automatically log people in when they create account

  return res.status(200).send(); 
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html')); // Adjust the path as needed
});

// End point to log in a user
app.post("/login", async (req, res) => {
  let { body } = req;
  let { username, password } = body;
  let result;
  try {
    result = await pool.query(
      "SELECT password_hash FROM users WHERE username = $1",
      [username],
    );
  } catch (error) {
    console.log("SELECT FAILED", error);
    return res.sendStatus(500); 
  }

  // username doesn't exist
  if (result.rows.length === 0) {
    return res.sendStatus(400); // TODO
  }
  let hash = result.rows[0].password_hash;
  console.log(username, password, hash);

  let verifyResult;
  try {
    verifyResult = await argon2.verify(hash, password);
  } catch (error) {
    console.log("VERIFY FAILED", error);
    return res.sendStatus(500); // TODO
  }

  // password didn't match
  console.log(verifyResult);
  if (!verifyResult) {
    console.log("Credentials didn't match");
    return res.sendStatus(400); // TODO
  }

  // check if client is Safari
  const userAgent = req.headers['user-agent'];
  const isSafari = userAgent?.includes('Safari') && !userAgent?.includes('Chrome');
  console.log("Is Safari", isSafari);
  cookieOptions.sameSite = isSafari ? "lax" : "strict"; // adjusting based on Safari because of stricter cookie policies
  cookieOptions.secure = req.secure || !isSafari; // adjusting based on HTTPS or Safari
  console.log("Cookie options", cookieOptions);


  // generate login token, save in cookie
  let token = makeToken();
  console.log("Generated token", token);
  tokenStorage[token] = username;
  return res.cookie("token", token, cookieOptions).send(); // TODO
});


// End point to log out a user
app.post("/logout", (req, res) => {
  let { token } = req.cookies;

  if (token === undefined) {
    console.log("Already logged out");
    return res.sendStatus(400); // TODO
  }

  if (!tokenStorage.hasOwnProperty(token)) {
    console.log("Token doesn't exist");
    return res.sendStatus(400); // TODO
  }

  console.log("Before", tokenStorage);
  delete tokenStorage[token];
  console.log("Deleted", tokenStorage);

  return res.clearCookie("token", cookieOptions).send();
});

app.get("/public", (req, res) => {
  return res.send("A public message\n");
});

// authorize middleware will be called before request handler
// authorize will only pass control to this request handler if the user passes authorization
app.get("/private", authorize, (req, res) => {
  return res.send("A private message\n");
});

// End point to get auction items from DB
app.get("/auctions", (req, res) => {
  console.log("calling /auctions");

  pool.query(
    `SELECT l.*,
            ARRAY_AGG(p.photo_url) AS photos
     FROM Listings l
     LEFT JOIN Photos p
     ON l.listing_id = p.listing_id
     WHERE l.is_auction = true 
       AND l.status = 'open'
     GROUP BY l.listing_id
     ORDER BY l.auction_end_date ASC`
  )
    .then(result => {
      res.json(result.rows);
    })
    .catch(err => {
      console.error("Error fetching auctions:", err);
      res.status(500).json({ error: "Database error" });
    });
});


// Endpoint to fetch details of a specific auction
app.get("/auction/:id", (req, res) => {
  const listingId = req.params.id;
  const username = tokenStorage[req.cookies.token]; // Get username from token storage

  pool.query(
      `SELECT * FROM Listings WHERE listing_id = $1 AND is_auction = true`,
      [listingId]
  )
      .then(auctionResult => {
          if (auctionResult.rows.length === 0) {
              return res.status(404).json({ error: "Auction not found" });
          }

          const auction = auctionResult.rows[0];

          // Fetch associated bids
          return pool.query(
              `SELECT b.user_id, b.bid_amount, b.bid_time, u.username 
                FROM Bids b 
                JOIN Users u ON b.user_id = u.user_id 
                WHERE b.listing_id = $1 
                ORDER BY b.bid_time DESC`,
                [listingId]
          ).then(bidsResult => {
              auction.bids = bidsResult.rows;

              // Fetch photos for the auction
              return pool.query(
                  `SELECT photo_url FROM Photos WHERE listing_id = $1`,
                  [listingId]
              ).then(photosResult => {
                  auction.photos = photosResult.rows.map(photo => photo.photo_url); // Add photos to auction
                  auction.username = username; // Add username for frontend display
                  res.json(auction); // Send response
              });
          });
      })
      .catch(err => {
          console.error("Error fetching auction details or bids:", err);
          res.status(500).json({ error: "Database error" });
      });
});

// End point to place a bid
app.post("/place-bid", (req, res) => {
  const { listingId, bidAmount } = req.body;
  const username = tokenStorage[req.cookies.token];
  console.log(username);

  // Step 1: Authenticate the user
  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      const userId = result.rows[0].user_id;

      // Step 2: Validate and insert the bid
      return pool.query(
        `SELECT minimum_bid, current_max_bid, minimum_increase FROM Listings WHERE listing_id = $1`,
        [listingId]
      ).then((listingResult) => {
        if (listingResult.rows.length === 0) {
          throw new Error("Listing not found");
        }

        const { 
          minimum_bid: minimumBid, 
          current_max_bid: currentMaxBid, 
          minimum_increase: minimumIncrease 
        } = listingResult.rows[0];

        // Validate against the minimum and maximum bids
        if (bidAmount < minimumBid) {
          throw new Error(`Bid amount must be at least $${minimumBid}`);
        }
        if (bidAmount <= currentMaxBid) {
          throw new Error(`Bid must be higher than the current maximum bid of $${currentMaxBid}`);
        }
        let difference = bidAmount - currentMaxBid;
        console.log(bidAmount);
        console.log(currentMaxBid);
        console.log(minimumIncrease);
        console.log(difference);
        if (difference < minimumIncrease) {
          throw new Error(`Bid must be at least $${minimumIncrease} greater than $${currentMaxBid}`);
        }

        // Step 3: Insert the new bid into the database
        return pool.query(
          `INSERT INTO Bids (listing_id, user_id, bid_amount, bid_time) VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [listingId, userId, bidAmount]
        );
      });
    })
    .then((insertResult) => {
      const newBid = insertResult.rows[0];

      // Step 4: Update the max_bid in the Listings table
      return pool.query(
        `UPDATE Listings SET current_max_bid = $1 WHERE listing_id = $2`,
        [bidAmount, newBid.listing_id]
      ).then(() => newBid); // Pass the newBid along
    })
    .then((newBid) => {
      // Step 5: Notify all connected clients of the new bid
      // Include the username in the bid-update event
      ioServer.emit("bid-update", {
        listing_id: newBid.listing_id,
        bid_amount: newBid.bid_amount,
        user_id: newBid.user_id,
        username: username
      });

      // Respond with success
      res.status(200).json({ success: true, bid: newBid });
    })
    .catch((err) => {
      console.error("Error placing bid:", err);

      // Respond with a user-friendly error message
      res.status(400).json({ success: false, message: err.message });
    });
});

// Function to check closed auctions
const checkForEndedAuctions = () => {
  pool.query(
      `SELECT listing_id, auction_end_date FROM Listings WHERE is_auction = true AND status = 'open'`
  )
      .then(result => {
          const now = new Date();

          const endedAuctions = result.rows.filter(
              auction => new Date(auction.auction_end_date) <= now
          );

          endedAuctions.forEach(auction => {
              // Get the highest bid for the ended auction
              pool.query(
                  `SELECT user_id, bid_amount FROM Bids WHERE listing_id = $1 ORDER BY bid_amount DESC LIMIT 1`,
                  [auction.listing_id]
              )
                  .then(bidResult => {
                      if (bidResult.rows.length > 0) {
                          const winnerId = bidResult.rows[0].user_id;

                          // Update the auction to mark it as closed and set the winner
                          return pool.query(
                              `UPDATE Listings 
                              SET status = 'closed', winner_id = $1 
                              WHERE listing_id = $2`,
                              [winnerId, auction.listing_id]
                          );
                      } else {
                          // No bids, just close the auction
                          return pool.query(
                              `UPDATE Listings 
                              SET status = 'closed' 
                              WHERE listing_id = $1`,
                              [auction.listing_id]
                          );
                      }
                  })
                  .then(() => {
                      console.log(`Auction ${auction.listing_id} processed.`);
                  })
                  .catch(err => {
                      console.error(`Error processing auction ${auction.listing_id}:`, err);
                  });
          });
      })
      .catch(err => {
          console.error("Error fetching auctions:", err);
      });
};

// Run the check periodically (e.g., every minute)
setInterval(checkForEndedAuctions, 60 * 1000);

// Endpoint for winning auctions
app.get("/api/user/auctions-won", (req, res) => {
  const username = tokenStorage[req.cookies.token];

  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
      .then(result => {
          if (result.rows.length === 0) {
              return res.status(403).json({ message: "Unauthorized" });
          }
          const userId = result.rows[0].user_id;

          return pool.query(
              `SELECT listing_id, title, description, auction_end_date 
              FROM Listings 
              WHERE winner_id = $1 
              ORDER BY auction_end_date DESC`,
              [userId]
          );
      })
      .then(result => {
          res.json(result.rows);
      })
      .catch(err => {
          console.error("Error fetching auctions won:", err);
          res.status(500).json({ message: "Failed to fetch auctions won" });
      });
});

app.delete("/api/listings/:id", authorize, (req, res) => {
  const listingId = req.params.id;
  const username = tokenStorage[req.cookies.token];

  pool.query("SELECT user_id FROM Users WHERE username = $1", [username])
      .then(result => {
          if (result.rows.length === 0) {
              return res.status(403).json({ message: "Unauthorized" });
          }
          const userId = result.rows[0].user_id;
          return pool.query("DELETE FROM ListingTags WHERE listing_id = $1", [listingId])
              .then(() => {
                  return pool.query("DELETE FROM Photos WHERE listing_id = $1", [listingId]);
              })
              .then(() => {
                  return pool.query(
                      `DELETE FROM Listings WHERE listing_id = $1 AND user_id = $2`,
                      [listingId, userId]
                  );
              });
      })
      .then(() => {
          res.status(200).json({ message: "Listing deleted successfully!" });
      })
      .catch(error => {
          console.error("Error deleting listing:", error);
          res.status(500).json({ message: "Failed to delete listing." });
      });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// Endpoint to fetch recent messages for a specific user
app.get("/messages/recent", async (req, res) => {
  const username = req.username;
  console.log(`Fetching previous messages for user: ${username}`);
  try {
    const activeRooms = await getRoomsWithUser(username);
    console.log(activeRooms.rows);
    if (activeRooms.rows.length > 0) {
      const allMessages = [];
      for (const activeRoom of activeRooms.rows) {
        const recentMessages = await pool.query(
          `SELECT * 
          FROM Messages 
          WHERE room = $1 
          ORDER BY message_timestamp DESC
          LIMIT 1`,
          [activeRoom.room]);
        console.log(recentMessages.rows);
        allMessages.push(...recentMessages.rows);
      }
      return res.json(allMessages);
    } else {
      console.log('No messages found');
      res.json({ message: "No messages found" });
    }
  } catch (error) {
    console.error("Error fetching messages for preview:", error);
    res.status(500).json({message: "Failed to fetch messages"});
  }
});

app.get('/messages/chat_history/:room', async (req, res) => {
  console.log('Fetching chat history');
  const username = req.username;
  const room = req.params.room;
  try {
      const result = await pool.query(
          `SELECT * FROM Messages WHERE room = $1 ORDER BY message_timestamp ASC`,
          [room]
      );

      // Mark messages as read
      await pool.query(
          `UPDATE Messages SET is_read = TRUE WHERE receiver = $1 AND is_read = FALSE`,
          [username]
      );

      return res.json(result.rows);
  } catch (error) {
      console.error("Error fetching previous messages:", error);
      return res.status(500).json({ message: "Failed to fetch previous messages" });
  }
});


app.get('/api/username', authorize, (req, res) => {
  if (req.username) {
    console.log(`User ${req.username} is authenticated`);
    return res.json({ username: req.username });
  } else {
    console.log('User is not authenticated');
    res.status(401).json({ error: 'Not authenticated' });
  }
});

//Websockets endpoint for when user connects to server for messsaging
ioServer.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on('enterRoom', ({ name, room }) => {
      console.log(`User ${socket.id} is entering room ${room} with name ${name}`);
      
      //leave previous room
      const prevRoom = getUser(socket.id)?.room;

      if (prevRoom) {
          socket.leave(prevRoom);
      }

      const user = activateUser(socket.id, name, room);

      //updates previous room's user list
      if (prevRoom) {
          ioServer.to(prevRoom).emit('userList', {
              users: getUsersInRoom(prevRoom)
          });
      }

      //join room
      socket.join(user.room);
      console.log(`User ${socket.id} joined room ${user.room}`);
      
      //update user list for new room
      ioServer.to(user.room).emit('userList', {
          users: getUsersInRoom(user.room)
      });
  });

  //Websockets endpoint for when user disconnects from server
  socket.on('disconnect', () => {
      const user = getUser(socket.id);
      userExitsChat(socket.id);
  
      if (user) {
          ioServer.to(user.room).emit('userList', {
              users: getUsersInRoom(user.room)
          });
      }
  });

  //Websockets endpoint for when user sends a message
  socket.on('message', async ({ name, text }) => {
    console.log(`Message received from ${name}: ${text}`);
    if (name !== ADMIN) {
        const room = getUser(socket.id)?.room;
        if (room) {
          const msg = buildMsg(name, text);
          const room_members = getUsersInRoom(room);
          const sender = name;
          const receiver = room.split('_').find(part => part !== sender);
          // Check if the receiver is online
          const isReceiverOnline = room_members.some(user => user.name === receiver);

          try {
              await pool.query(
                  `INSERT INTO Messages (room, sender, receiver, message_text, message_timestamp, is_read) 
                  VALUES ($1, $2, $3, $4, $5, $6);`,
                  [room, sender, receiver, msg.text, msg.time, isReceiverOnline]
              );              
              ioServer.to(room).emit('message', msg);
              console.log('Message broadcasted:', msg);
          } catch (error) {
              console.error("Error inserting message:", error);
          }
      }
    } else {
        const room = getUser(socket.id)?.room;
        if (room) {
            const msg = buildMsg(name, text);
            ioServer.to(room).emit('message', msg);
        }
    }
  });

  //Websockets endpoint for detecting user typing activity
  socket.on('activity', (name) => {
      const room = getUser(socket.id)?.room;
      if (room) {
          socket.broadcast.to(room).emit('activity', name);
      }
  });
});

function getRoomsWithUser(username) {
  return pool.query(
    `SELECT DISTINCT room FROM Messages WHERE sender = $1 OR receiver = $1`,
    [username]
  );
}

//function to build message object for transmission
function buildMsg(name, text) {
  return {
      name,
      text,
      time: new Date().toISOString()
  };
}

//functions to manage users (and user state)

//create user object and amend user state
function activateUser(id, name, room) {
  const user = { id, name, room };
  UsersState.setUsers([
      ...UsersState.users.filter(user => user.id !== id), 
      user
  ]);
  console.log(`User activated: ${JSON.stringify(user)}`);
  return user;
}

//amend user state by removing user
function userExitsChat(id) {
  UsersState.setUsers(
      UsersState.users.filter(user => user.id !== id)
  );
}

//get user object by id
function getUser(id) {
  return UsersState.users.find(user => user.id === id);
}

//get all users in a room
function getUsersInRoom(room) {
  return UsersState.users.filter(user => user.room === room);
}