import mongoose from "mongoose";

const BusinessEventSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    ownerUserId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ["click", "whatsapp", "media", "view"],
      required: true,
      index: true,
    },
    source: {
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

BusinessEventSchema.index({ businessId: 1, type: 1, createdAt: -1 });

export default mongoose.model("BusinessEvent", BusinessEventSchema);
