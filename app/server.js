const pg = require("pg");
const path = require("path");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

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

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
