import mongoose from "mongoose";

const LeadTokenSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      default: "",
      index: true,
    },
    businessPhone: {
      type: String,
      default: "",
    },
    userPhone: {
      type: String,
      default: "",
      index: true,
    },
    query: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

LeadTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("LeadToken", LeadTokenSchema);
