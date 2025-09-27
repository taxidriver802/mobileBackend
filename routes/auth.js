import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, fullName } = req.body;
  console.log(fullName);
  
  console.log('[server] POST /api/auth/register', { username, fullName: fullName ? '<provided>' : '<missing>' });

  // Basic validation
  if (!fullName || !username || !password) {
    return res.status(400).json({ error: 'Name, username and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, username, password: hashedPassword });
    const saved = await newUser.save();

    console.log('[server] user created', { id: saved._id, username: saved.username, fullName: saved.fullName });

    // Return created user (minimal) to the client
    res.status(201).json({ user: { id: saved._id, username: saved.username, fullName: saved.fullName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id fullName username profilePic");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic || "",
    });
  } catch (err) {
    console.error("Error in /me:", err);
    res.status(500).json({ error: "Server error" });
  }
});



export default router;
