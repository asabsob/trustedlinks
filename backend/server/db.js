import mongoose from "mongoose";

export async function connectDB() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) throw new Error("Missing MONGODB_URI");

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: (process.env.MONGODB_DB || "").trim() || undefined,
  });

  console.log("✅ MongoDB connected");
}
