// index.js

// --- 1. IMPORTS ---
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// --- 2. INITIALIZE APP & MIDDLEWARE ---
const app = express();
app.use(cors());
app.use(express.json());

// --- 3. DATABASE CONNECTION ---
const DB_URI =
  "mongodb+srv://pineapple:Pineapple123@cluster0.xfqjuue.mongodb.net/bookmark-app?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "bookmark-app";
let db;

MongoClient.connect(DB_URI)
  .then((client) => {
    console.log("Successfully connected to MongoDB Atlas!");
    db = client.db(DB_NAME);
    const PORT = 8000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "Could not connect to the database. Server will not start.",
      error
    );
    process.exit(1);
  });

// --- 4. API ROUTES ---

// User Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required." });
    }

    const existingUser = await db.collection("users").findOne({ email: email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const result = await db.collection("users").insertOne({
      username,
      email,
      password: password, // Storing password in plain text (insecure)
    });

    res.status(201).json({
      message: "User created successfully!",
      userId: result.insertedId,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await db.collection("users").findOne({ email: email });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.status(200).json({
      message: "Login successful!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
