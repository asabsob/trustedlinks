import mongoose from "mongoose";

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    name_ar: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: [String], default: [] },

    whatsapp: { type: String, required: true, unique: true }, // digits only
    status: { type: String, default: "Pending" }, // Active/Pending/Blocked

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapLink: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Business || mongoose.model("Business", BusinessSchema);
