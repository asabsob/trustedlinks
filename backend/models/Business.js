import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    meta: { type: Object, default: {} }, // optional metadata later
  },
  { _id: false }
);

const BusinessSchema = new mongoose.Schema(
  {
    // Owner link (IMPORTANT for /api/business/me + dashboard)
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Basic fields
    name: { type: String, required: true },
    name_ar: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: [String], default: [] },

    whatsapp: { type: String, required: true, unique: true }, // digits only

    // Active/Pending/Blocked/Suspended
    status: { type: String, default: "Pending" },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapLink: { type: String, default: "" },
    mediaLink: { type: String, default: "" },

    // Tracking arrays
    views: { type: [EventSchema], default: [] },
    clicks: { type: [EventSchema], default: [] },
    messages: { type: [EventSchema], default: [] },      // WhatsApp intent
    mediaViews: { type: [EventSchema], default: [] },
    mapClicks: { type: [EventSchema], default: [] },
    whatsappClicks: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
