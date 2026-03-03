// backend/db.js
import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) throw new Error("Missing MONGODB_URI");

  if (isConnected) return mongoose.connection;

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
  return mongoose.connection;
}
