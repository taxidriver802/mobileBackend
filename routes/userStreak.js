import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
router.use(auth);

// GET current user's streak info
router.get('/me/streak', async (req, res) => {
  try {
    const u = await User.findById(req.user.id, {
      streak: 1,
      lastDailyCheckDate: 1,
      streakIncreasedForDate: 1,
      completionHistory: 1,
      _id: 0,
    });
    return res.json(u || {});
  } catch (err) {
    console.error('[streak.get] unexpected:', err);
    return res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// POST increment once per day when all goals are completed
router.post('/me/streak/increment', async (req, res) => {
  try {
    const { onDate } = req.body || {}; // "YYYY-MM-DD"
    if (!onDate) return res.status(400).json({ error: 'onDate required' });

    const u = await User.findById(req.user.id);
    if (!u) return res.sendStatus(404);

    if (u.streakIncreasedForDate === onDate) {
      // already incremented today (idempotent)
      return res.json({
        streak: u.streak,
        streakIncreasedForDate: u.streakIncreasedForDate,
      });
    }

    u.streak += 1;
    u.streakIncreasedForDate = onDate;
    await u.save();

    return res.json({
      streak: u.streak,
      streakIncreasedForDate: u.streakIncreasedForDate,
    });
  } catch (err) {
    console.error('[streak.increment] unexpected:', err);
    return res.status(500).json({ error: 'Failed to increment streak' });
  }
});

// POST daily rollover: record yesterday result and handle reset if needed
router.post('/me/streak/rollover', async (req, res) => {
  try {
    const { lastDay, completedAll, today } = req.body || {};
    // lastDay: "YYYY-MM-DD" (yesterday), completedAll: boolean, today: "YYYY-MM-DD"
    if (!lastDay || typeof completedAll !== 'boolean' || !today) {
      return res
        .status(400)
        .json({ error: 'lastDay, completedAll, today are required' });
    }

    const u = await User.findById(req.user.id);
    if (!u) return res.sendStatus(404);

    // store yesterday’s completion
    u.completionHistory.set(String(lastDay), !!completedAll);

    // reset if yesterday failed
    if (!completedAll) u.streak = 0;

    // mark that we’ve done the daily check for today
    u.lastDailyCheckDate = today;

    await u.save();

    return res.json({
      streak: u.streak,
      lastDailyCheckDate: u.lastDailyCheckDate,
      completionHistory: Object.fromEntries(u.completionHistory),
    });
  } catch (err) {
    console.error('[streak.rollover] unexpected:', err);
    return res.status(500).json({ error: 'Failed to process rollover' });
  }
});

// POST: mark daily check (first open of the day)
router.post('/me/streak/mark-check', async (req, res) => {
  try {
    const { today } = req.body || {};
    if (!today) return res.status(400).json({ error: 'today required' });

    const u = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { lastDailyCheckDate: today } },
      { new: true, projection: { lastDailyCheckDate: 1, _id: 0 } }
    );
    if (!u) return res.sendStatus(404);

    return res.json(u);
  } catch (err) {
    console.error('[streak.mark-check] unexpected:', err);
    return res.status(500).json({ error: 'Failed to mark daily check' });
  }
});

export default router;
