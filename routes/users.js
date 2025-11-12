import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

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

    const me = await User.findById(currentUserId)
      .select('friends friendRequests.sent friendRequests.received')
      .lean();

    if (!me) return res.status(404).json({ error: 'User not found' });

    const filter = { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } };
    if (q) {
      filter.$or = [
        { fullName: new RegExp(q, 'i') },
        { username: new RegExp(q, 'i') },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('_id fullName username profilePic createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const payload = users.map((u) => {
      const id = u._id.toString();
      const isFriend = me.friends?.some((x) => x.toString() === id);
      const sent = me.friendRequests?.sent?.some((x) => x.toString() === id);
      const received = me.friendRequests?.received?.some(
        (x) => x.toString() === id
      );

      let relationshipStatus = 'none';
      if (isFriend) relationshipStatus = 'friends';
      else if (sent) relationshipStatus = 'request_sent';
      else if (received) relationshipStatus = 'request_received';

      return { ...u, relationshipStatus };
    });

    res.json({
      data: payload,
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
