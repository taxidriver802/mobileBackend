import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: false },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profilePic: { type: String, default: "default.jpg" },
});

export default mongoose.model("User", userSchema);
