import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profilePic: { type: String, default: 'default.jpg' },
  streak: { type: Number, default: 0 },
  highestStreak: { type: Number, default: 0 },
  lastDailyCheckDate: { type: String, default: null },
  streakIncreasedForDate: { type: String, default: null },
  completionHistory: { type: Map, of: Boolean, default: {} },

});

export default mongoose.model('User', userSchema);
