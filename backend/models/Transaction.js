import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    reason: {
      type: String,
      default: "",
      index: true,
    },
    eventType: {
      type: String,
      enum: ["topup", "click", "whatsapp", "media", "view", "manual", ""],
      default: "",
    },
    reference: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed", "pending"],
      default: "completed",
      index: true,
    },
    balanceBefore: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ businessId: 1, createdAt: -1 });

export default mongoose.model("Transaction", TransactionSchema);
