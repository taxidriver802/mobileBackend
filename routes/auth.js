import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, fullName } = req.body;

  if (!fullName || !username || !password) {
    return res
      .status(400)
      .json({ error: 'Name, username and password are required' });
  }

  try {
    const uname = username.trim();
    const existingUser = await User.findOne({ username: uname });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      username: uname,
      password: hashedPassword,
    });
    const saved = await newUser.save();

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      { id: saved._id.toString(), username: saved.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: saved._id.toString(),
        username: saved.username,
        fullName: saved.fullName,
        profilePic: saved.profilePic,
        createdAt: saved.createdAt,
        highestStreak: saved.highestStreak ?? 0,
      },
    });
  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      '_id fullName username profilePic streak highestStreak createdAt updatedAt friends'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic || '',
      streak: user.streak ?? 0,
      highestStreak: user.highestStreak ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      friendsList: user.friends,
    });
  } catch (err) {
    console.error('Error in /me:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/me', auth, async (req, res) => {
  try {
    const { username, fullName, profilePic } = req.body;

    const update = {};
    if (typeof username === 'string') update.username = username.trim();
    if (typeof fullName === 'string') update.fullName = fullName.trim();
    if (typeof profilePic === 'string') update.profilePic = profilePic.trim();

    if (update.username) {
      const taken = await User.findOne({
        username: update.username,
        _id: { $ne: req.user.id },
      }).lean();
      if (taken) {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select(
      '_id fullName username profilePic streak highestStreak createdAt updatedAt'
    );

    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: updated._id,
      fullName: updated.fullName,
      username: updated.username,
      profilePic: updated.profilePic || '',
      streak: updated.streak ?? 0,
      highestStreak: updated.highestStreak ?? 0,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    console.error('Error in PATCH /me:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
