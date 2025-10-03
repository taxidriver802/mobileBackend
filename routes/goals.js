import express from "express";
import auth from "../middleware/auth.js";
import Goal from "../models/Goals.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(goals);
  } catch (err) {
    console.error("GET /goals error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const goal = await Goal.create({
      title: title.trim(),
      description: description.trim(),
      user: req.user.id,
    });

    res.status(201).json(goal);
  } catch (err) {
    console.error("POST /goals error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const goal = await Goal.findOne({ _id: id, user: req.user.id }).lean();
    if (!goal) return res.status(404).json({ error: "Goal not found" });

    res.json(goal);
  } catch (err) {
    console.error("GET /goals/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const update = {};
    if (typeof req.body.title === "string") update.title = req.body.title.trim();
    if (typeof req.body.description === "string") update.description = req.body.description.trim();
    if (typeof req.body.completed === "boolean") update.completed = req.body.completed;

    const updated = await Goal.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Goal not found" });

    res.json(updated);
  } catch (err) {
    console.error("PATCH /goals/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const deleted = await Goal.findOneAndDelete({ _id: id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: "Goal not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /goals/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
