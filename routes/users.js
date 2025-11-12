import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize || '25', 10), 1),
      100
    );
    const q = (req.query.q || '').trim();
    const currentUserId = req.user.id;

    const filter = { _id: { $ne: currentUserId } };
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const [total, data] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select(
          '_id username fullName profilePic createdAt streak highestStreak'
        )
        .lean(),
    ]);

    res.json({
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    });
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
