import mongoose from "mongoose";

const SearchSessionSchema = new mongoose.Schema(
  {
    userPhone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastQuery: {
      type: String,
      default: "",
    },
    normalizedQuery: {
      type: String,
      default: "",
    },
    lastIntent: {
      type: String,
      default: "",
    },
    lastResults: {
      type: Array,
      default: [],
    },
    pendingNearby: {
      category: {
        type: String,
        default: "",
      },
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SearchSession", SearchSessionSchema);
