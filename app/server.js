const pg = require("pg");
const path = require("path");
const express = require("express");
const app = express();
const argon2 = require("argon2"); 
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const port = process.env.PORT || 3000;
const hostname = "localhost";
const ADMIN = "Admin";

const env = require("../config/env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

let tokenStorage = {};

pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
}).catch(error => {
  console.error("Database connection error:", error);
});

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

//state 
const UsersState = {
  users: [],
  setUsers: function(newUsersArray) {
      this.users = newUsersArray;
  }
};

const ioServer = new Server(expressServer, {
  cors: {
      origin: '*'
  }
});

// Serve the login.html page
app.get("/", (req, res) => {
  // Re-direct "/" to login.html
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // login.html is a placeholder
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

// Endpoint to handle bid form submission and insert bid listing into database
app.post("/add-bid-listing", (req, res) => {
  let { name, description, minimumBid, auctionEndDate, photo } = req.body;

  pool.query(
      `INSERT INTO Listings (title, description, minimum_bid, listing_date, auction_end_date, status, is_auction) 
      VALUES ($1, $2, $3, NOW(), $4, 'open', TRUE) RETURNING listing_id`,
      [name, description, minimumBid, auctionEndDate]
  )
  .then(result => {
      let listingId = result.rows[0].listing_id;
      if (photo) {
          return pool.query(`INSERT INTO Photos (listing_id, photo_url) VALUES ($1, $2)`, [listingId, photo]);
      }
  })
  .then(() => {
      res.status(200).json({ success: true, message: "Listing added successfully for bidding" });
  })
  .catch(error => {
      console.error("Error adding bidding listing:", error);
      res.status(500).json({ success: false, message: "Failed to add listing for bidding" });
  });
});

// Endpoint to fetch all non-auction listings
app.get("/api/listings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Listings WHERE is_auction = false");
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

  // generate login token, save in cookie
  let token = makeToken();
  console.log("Generated token", token);
  tokenStorage[token] = username;
  return res.cookie("token", token, cookieOptions).send(); // TODO
});

/* middleware; check if login token in token storage, if not, 403 response */
let authorize = (req, res, next) => {
  let { token } = req.cookies;
  console.log(token, tokenStorage);
  if (token === undefined || !tokenStorage.hasOwnProperty(token)) {
    return res.sendStatus(403); // TODO
  }
  next();
};

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

      //send to user that joins
      socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`));
      
      //to everyone else
      socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`));

      //update user list for new room
      ioServer.to(user.room).emit('userList', {
          users: getUsersInRoom(user.room)
      });

      //update active rooms list for everyone
      ioServer.emit('roomlist', {
          rooms: getAllActiveRooms()
      });
  });

  //Websockets endpoint for when user disconnects from server
  socket.on('disconnect', () => {
      const user = getUser(socket.id);
      userExitsChat(socket.id);
  
      if (user) {
          ioServer.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`));

          ioServer.to(user.room).emit('userList', {
              users: getUsersInRoom(user.room)
          });

          ioServer.emit('roomList', {
              rooms: getAllActiveRooms()
          });
      }
  });

  //Websockets endpoint for when user sends a message
  socket.on('message', ({ name, text }) => {
      if (name !== ADMIN) {
        const room = getUser(socket.id)?.room;
        if (room) {
          const msg = buildMsg(name, text);
          const room_members = getUsersInRoom(room);
          const sender = room_members.find(user => user.name === name);
          const receiver = room_members.find(user => user.name !== name);
          pool.query(
            `SELECT user_id 
            FROM Users 
            WHERE username IN ($1, $2);`,
            [sender, receiver]
          ).then(result => {
            if (result.rows.length != 2) {
              throw new Error("Issue retrieving user IDs");
            }
            const sender_id = result.rows.find(row => row.username === sender).user_id;
            const receiver_id = result.rows.find(row => row.username === receiver).user_id;
            return pool.query(
              `INSERT INTO Messages (room, sender_id, receiver_id, message_text, message_timestamp) 
              VALUES ($1, $2, $3, $4, $5);`, 
              [room, sender_id, receiver_id, msg.text, msg.time]
            );
          }).then(() => {
            ioServer.to(room).emit('message', msg);
          }).catch(error => {
            console.error("Error inserting message:", error);
            res.status(500).json({ message: "Failed to save message" });
          });
        }
      } else {
        const msg = buildMsg(name, text);
        const room = getUser(socket.id)?.room;
        if (room) {
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

//function to build message object for transmission
function buildMsg(name, text) {
  return {
      name,
      text,
      time: new Intl.DateTimeFormat('default', {
          hour: 'numeric',
          minute: 'numeric', 
          second: 'numeric'
      }).format(new Date())
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

//get all active rooms
function getAllActiveRooms() {
  return Array.from(new Set(UsersState.users.map(user => user.room)));
}

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});