// db.js
import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) throw new Error("Missing MONGODB_URI");

  if (isConnected) return mongoose.connection;

  // لمنع تحذيرات strictQuery
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    // خيارات آمنة (mongoose 7+ ما بتحتاج كثير options)
    serverSelectionTimeoutMS: 15000,
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
  return mongoose.connection;
}
