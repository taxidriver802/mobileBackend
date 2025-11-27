import mongoose from 'mongoose';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    frequency: { type: String, required: true },
    startDate: { type: Date, default: null },
    days: {
      type: [String],
      enum: DAY_KEYS,
      default: undefined,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Goal || mongoose.model('Goal', goalSchema);
