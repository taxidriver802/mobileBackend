import express from 'express';
import authRoutes from './auth.js';
import goalsRoutes from './goals.js';
import streakRoutes from './userStreak.js';
import usersRoutes from './users.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/goals', goalsRoutes);
router.use('/user', streakRoutes);
router.use('/users', usersRoutes);

export default router;
