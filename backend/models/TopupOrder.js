import mongoose from "mongoose";

const TopupOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "manual_demo",
    },
    reference: {
      type: String,
      default: "",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
    meta: {
      type: Object,
      default: {},
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

TopupOrderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("TopupOrder", TopupOrderSchema);
