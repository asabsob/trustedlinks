import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

const BusinessSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    name: { type: String, required: true },
    name_ar: { type: String, default: "" },
    description: { type: String, default: "" },

    // ✅ keep as array of strings for search/filter
    category: { type: [String], default: [] },

    whatsapp: { type: String, required: true, unique: true }, // digits only

    // Active/Pending/Blocked/Suspended
    status: { type: String, default: "Pending" },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapLink: { type: String, default: "" },
    mediaLink: { type: String, default: "" },

    // ✅ Tracking
    views: { type: [EventSchema], default: [] },
    clicks: { type: [EventSchema], default: [] },
    messages: { type: [EventSchema], default: [] },
    mediaViews: { type: [EventSchema], default: [] },
    mapClicks: { type: [EventSchema], default: [] },
    whatsappClicks: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
