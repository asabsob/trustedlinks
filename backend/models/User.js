import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, index: true, required: true },
    password: { type: String, required: true }, // MVP plain (لاحقًا bcrypt)
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },

    subscriptionPlan: { type: String, default: null },
    planActivatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
