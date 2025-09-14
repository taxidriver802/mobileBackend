import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, (req, res) => {
  res.json({ goals: ["Finish project", "Go for a run"] });
});

export default router;
