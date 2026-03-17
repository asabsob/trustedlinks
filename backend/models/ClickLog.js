import mongoose from "mongoose";

const ClickLogSchema = new mongoose.Schema(
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ClickLog", ClickLogSchema);
