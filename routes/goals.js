import express from 'express';
import mongoose from 'mongoose';
import Goal from '../models/Goals.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(goals);
  } catch (err) {
    console.error('[goals.list] unexpected:', err);
    return res.status(500).json({ error: 'Failed to list goals' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description = '', frequency } = req.body || {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const goal = await Goal.create({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      user: req.user.id,
      frequency: frequency,
      // completed defaults to false via schema
    });

    return res.status(201).json(goal);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[goals.create] unexpected:', err);
    return res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid goal id' });
    }

    // Whitelist & normalize
    const allowed = {};
    if (typeof req.body.title === 'string') {
      const v = req.body.title.trim();
      if (!v) return res.status(400).json({ error: 'Title cannot be empty' });
      allowed.title = v;
    }
    if (typeof req.body.description === 'string') {
      allowed.description = req.body.description.trim();
    }
    if (typeof req.body.completed === 'boolean') {
      allowed.completed = req.body.completed;
    }

    // Business rule: any content edit resets completion
    if ('title' in allowed || 'description' in allowed) {
      allowed.completed = false;
    }

    const updated = await Goal.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: allowed },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    return res.json(updated);
  } catch (err) {
    if (err?.name === 'ValidationError' || err?.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[goals.update] unexpected:', err);
    return res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid goal id' });
    }

    if (typeof req.body.completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be boolean' });
    }

    const updated = await Goal.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: { completed: req.body.completed } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Goal not found' });

    return res.json(updated);
  } catch (err) {
    if (err?.name === 'ValidationError' || err?.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[goals.complete] unexpected:', err);
    return res.status(500).json({ error: 'Failed to toggle completion' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid goal id' });
    }

    const deleted = await Goal.findOneAndDelete({ _id: id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Goal not found' });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[goals.delete] unexpected:', err);
    return res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;
