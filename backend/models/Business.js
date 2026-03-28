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
    ownerUserId: { type: String, index: true, default: null },

    name: { type: String, required: true },
    name_ar: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: [String], default: [] },
    keywords: { type: [String], default: [] },

    whatsapp: { type: String, required: true, unique: true },
    status: { type: String, default: "Active", index: true },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: null,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
    },

    mapLink: { type: String, default: "" },
    mediaLink: { type: String, default: "" },

    // ✅ أضف هذه الحقول
    logo: { type: String, default: "" },
    locationText: { type: String, default: "" },
    countryCode: { type: String, default: "" },
    countryName: { type: String, default: "" },
    customId: { type: String, default: "", index: true },
    
wallet: {
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  status: { type: String, default: "active" }, // active | suspended
  allowNegative: { type: Boolean, default: true },
  negativeLimit: { type: Number, default: -5 },
  lowBalanceThreshold: { type: Number, default: 5 },
},

    billing: {
      clickCost: { type: Number, default: 0.05 },
      whatsappCost: { type: Number, default: 0.1 },
    },

    views: { type: [EventSchema], default: [] },
    clicks: { type: [EventSchema], default: [] },
    messages: { type: [EventSchema], default: [] },
    mediaViews: { type: [EventSchema], default: [] },
    mapClicks: { type: [EventSchema], default: [] },
    whatsappClicks: { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

BusinessSchema.index({ location: "2dsphere" });

BusinessSchema.pre("save", function () {
  if (
    typeof this.latitude === "number" &&
    !Number.isNaN(this.latitude) &&
    typeof this.longitude === "number" &&
    !Number.isNaN(this.longitude)
  ) {
    this.location = {
      type: "Point",
      coordinates: [this.longitude, this.latitude],
    };
  } else {
    this.location = undefined;
  }
});

export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
