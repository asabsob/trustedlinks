// backend/db.js
import mongoose from "mongoose";

console.log("DEBUG_MONGO_URI:", process.env.MONGODB_URI);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  if (mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return mongoose.connection;
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "trustedlinks",
  });

  console.log("✅ MongoDB connected");
  return mongoose.connection;
}
