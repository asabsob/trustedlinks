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
    // ✅ owner link to user
    ownerUserId: { type: String, default: null, index: true },

    name: { type: String, required: true },
    name_ar: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: [String], default: [] },

    whatsapp: { type: String, required: true, unique: true }, // digits only
    status: { type: String, default: "Pending" }, // Active/Pending/Blocked/Suspended

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapLink: { type: String, default: "" },

    // ✅ optional media link for BusinessDetails
    mediaLink: { type: String, default: "" },

    // ✅ tracking arrays
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
