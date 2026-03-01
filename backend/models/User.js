// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
