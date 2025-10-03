import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, fullName } = req.body;

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

router.patch("/me", auth, async (req, res) => {
  try {
    const { username, fullName, profilePic } = req.body;

    
    const update = {};
    if (typeof username === "string") update.username = username.trim();
    if (typeof fullName === "string") update.fullName = fullName.trim();
    if (typeof profilePic === "string") update.profilePic = profilePic.trim();

    // If attempting to change username, ensure it's not taken by someone else
    if (update.username) {
      const taken = await User.findOne({
        username: update.username,
        _id: { $ne: req.user.id },
      }).lean();
      if (taken) {
        return res.status(409).json({ error: "Username already exists" });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("_id fullName username profilePic");

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: updated._id,
      fullName: updated.fullName,
      username: updated.username,
      profilePic: updated.profilePic || "",
    });
  } catch (err) {
    console.error("Error in PATCH /me:", err);
    res.status(500).json({ error: "Server error" });
  }
});





export default router;
