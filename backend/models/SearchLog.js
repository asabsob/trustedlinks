import mongoose from "mongoose";

const SearchLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["search", "nearby_request", "nearby_location_received"],
      required: true,
    },
    userPhone: {
      type: String,
      index: true,
    },
    rawText: String,
    query: String,
    normalizedQuery: String,
    intent: String,
    lang: String,
    location: {
      lat: Number,
      lng: Number,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    usedAI: {
      type: Boolean,
      default: false,
    },
    aiCategory: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      default: "local",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SearchLog", SearchLogSchema);
