// index.js

// --- 1. IMPORTS ---
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// --- 2. INITIALIZE APP & MIDDLEWARE ---
const server = express();
server.use(cors()); // Allows your frontend to communicate with this backend
server.use(express.json()); // Allows the server to understand JSON data

// --- 3. DATABASE CONNECTION (Credentials are hardcoded) ---
/*
  *********************************************************************************
  *  EXTREME WARNING: Storing passwords in plain text is a major security risk.   *
  *  This code is for demonstration ONLY and is NOT safe for production use.      *
  *********************************************************************************
*/
const DB_URI = "mongodb+srv://pineapple:Pineapple123@cluster0.xfqjuue.mongodb.net/bookmark-app?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "bookmark-app";
let db; // This variable will hold our database instance

MongoClient.connect(DB_URI)
  .then((client) => {
    console.log("Successfully connected to MongoDB Atlas!");
    db = client.db(DB_NAME);

    // Start the server only AFTER the database connection is successful
    const PORT = 8000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not connect to the database. Server will not start.", error);
    process.exit(1);
  });

// --- 4. API ROUTES ---

// A simple test route to make sure the server is working
server.get("/", (req, res) => {
  res.json({ message: "Welcome to the Bookmark App API!" });
});

// User Signup Route
server.post("users/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const existingUser = await db.collection("users").findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // INSECURE: Storing the password directly as plain text.
    const result = await db.collection("users").insertOne({
      username,
      email,
      password: password, // The password is not hashed.
    });

    res.status(201).json({ message: "User created successfully!", userId: result.insertedId });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Login Route
server.post("users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await db.collection("users").findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // INSECURE: Comparing the plain text password directly.
    const isPasswordCorrect = (password === user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // If login is successful, just return the user's data.
    // NOTE: Without a token system, the frontend has no way to "prove" it's logged in for future requests.
    res.status(200).json({
      message: "Login successful!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});