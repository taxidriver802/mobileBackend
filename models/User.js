import mongoose, { Schema, Types } from 'mongoose';

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
  friends: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  friendRequests: {
    sent: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    received: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  },
});

userSchema.index({ username: 'text', fullName: 'text' }); // for search
export default mongoose.model('User', userSchema);
