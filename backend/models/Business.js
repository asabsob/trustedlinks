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
    ownerUserId: { type: String, index: true, default: null }, // ✅ link to user

    name: { type: String, required: true },
    name_ar: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: [String], default: [] },

    whatsapp: { type: String, required: true, unique: true }, // digits only
    status: { type: String, default: "Pending" }, // Active/Pending/Blocked/Suspended

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapLink: { type: String, default: "" },
    mediaLink: { type: String, default: "" },

    // ✅ Tracking arrays (used in /reports)
    views: { type: [EventSchema], default: [] },
    clicks: { type: [EventSchema], default: [] },
    mediaViews: { type: [EventSchema], default: [] },
    mapClicks: { type: [EventSchema], default: [] },
    whatsappClicks: { type: [EventSchema], default: [] },
    messages: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
