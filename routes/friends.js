import express from 'express';

import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/friends/request/:targetId
router.post('/request/:targetId', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const targetId = req.params.targetId;

    if (meId === targetId) {
      return res.status(400).json({ error: "Can't friend yourself" });
    }

    const [me, target] = await Promise.all([
      User.findById(meId).select('friends friendRequests'),
      User.findById(targetId).select('friends friendRequests'),
    ]);

    if (!me || !target)
      return res.status(404).json({ error: 'User not found' });

    const alreadyFriends = me.friends.some((x) => x.equals(target._id));
    const alreadySent = me.friendRequests.sent.some((x) =>
      x.equals(target._id)
    );
    const alreadyReceived = me.friendRequests.received.some((x) =>
      x.equals(target._id)
    );

    if (alreadyFriends) return res.json({ ok: true, status: 'friends' });
    if (alreadySent) return res.json({ ok: true, status: 'request_sent' });

    // If they already requested me, auto-accept both sides.
    if (alreadyReceived) {
      me.friendRequests.received.pull(target._id);
      target.friendRequests.sent.pull(me._id);
      me.friends.addToSet(target._id);
      target.friends.addToSet(me._id);
      await Promise.all([me.save(), target.save()]);
      return res.json({ ok: true, status: 'friends' });
    }

    me.friendRequests.sent.addToSet(target._id);
    target.friendRequests.received.addToSet(me._id);
    await Promise.all([me.save(), target.save()]);

    res.json({ ok: true, status: 'request_sent' });
  } catch (err) {
    console.error('POST /friends/request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/accept/:requesterId
router.post('/accept/:requesterId', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const requesterId = req.params.requesterId;

    const [me, requester] = await Promise.all([
      User.findById(meId).select('friends friendRequests'),
      User.findById(requesterId).select('friends friendRequests'),
    ]);
    if (!me || !requester)
      return res.status(404).json({ error: 'User not found' });

    if (!me.friendRequests.received.some((x) => x.equals(requester._id))) {
      return res
        .status(400)
        .json({ error: 'No pending request from this user' });
    }

    me.friendRequests.received.pull(requester._id);
    requester.friendRequests.sent.pull(me._id);
    me.friends.addToSet(requester._id);
    requester.friends.addToSet(me._id);

    await Promise.all([me.save(), requester.save()]);
    res.json({ ok: true, status: 'friends' });
  } catch (err) {
    console.error('POST /friends/accept error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/decline/:requesterId
router.post('/decline/:requesterId', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const requesterId = req.params.requesterId;

    const [me, requester] = await Promise.all([
      User.findById(meId).select('friendRequests'),
      User.findById(requesterId).select('friendRequests'),
    ]);
    if (!me || !requester)
      return res.status(404).json({ error: 'User not found' });

    me.friendRequests.received.pull(requester._id);
    requester.friendRequests.sent.pull(me._id);
    await Promise.all([me.save(), requester.save()]);

    res.json({ ok: true, status: 'none' });
  } catch (err) {
    console.error('POST /friends/decline error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/friends - list the current user's friends
router.get('/', auth, async (req, res) => {
  try {
    const meId = req.user.id;

    // Get just the friends ids for the current user
    const me = await User.findById(meId).select('friends').lean();
    if (!me) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If no friends, return empty array
    if (!me.friends || me.friends.length === 0) {
      return res.json({ data: [] });
    }

    // Find all users whose _id is in my friends list
    const friends = await User.find({ _id: { $in: me.friends } })
      .select('username fullName profilePic streak highestStreak')
      .lean();

    return res.json({ data: friends });
  } catch (err) {
    console.error('GET /friends error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/friends/:friendId
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const meId = req.user.id;
    const friendId = req.params.friendId;

    const [me, friend] = await Promise.all([
      User.findById(meId).select('friends'),
      User.findById(friendId).select('friends'),
    ]);
    if (!me || !friend)
      return res.status(404).json({ error: 'User not found' });

    me.friends.pull(friend._id);
    friend.friends.pull(me._id);
    await Promise.all([me.save(), friend.save()]);

    res.json({ ok: true, status: 'none' });
  } catch (err) {
    console.error('DELETE /friends error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
