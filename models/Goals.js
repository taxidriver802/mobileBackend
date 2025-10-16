import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    frequency: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Goal || mongoose.model('Goal', goalSchema);
