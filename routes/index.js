import express from "express";
import authRoutes from "./auth.js";
import goalsRoutes from "./goals.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/goals", goalsRoutes);

export default router;
