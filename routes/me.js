import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/me/relationships
router.get('/relationships', auth, async (req, res) => {
  const me = await User.findById(req.user.id)
    .select('friends friendRequests.sent friendRequests.received')
    .lean();
  if (!me) return res.status(404).json({ error: 'User not found' });

  res.json({
    meId: String(me._id),
    friends: (me.friends ?? []).map(String),
    sent: (me.friendRequests?.sent ?? []).map(String),
    received: (me.friendRequests?.received ?? []).map(String),
  });
});

export default router;
