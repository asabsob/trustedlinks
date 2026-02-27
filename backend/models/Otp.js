import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    whatsapp: { type: String, required: true, index: true }, // digits only
    code: { type: String, required: true },
    purpose: { type: String, default: "business_signup", index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// ⏳ TTL index — يحذف تلقائيًا بعد انتهاء الوقت
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", OtpSchema);
