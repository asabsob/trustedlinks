import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || "";

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  if (isConnected || mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    return;
  }

  console.log(
    "MONGODB URI CHECK:",
    mongoUri.replace(/\/\/(.*?):(.*?)@/, "//***:***@")
  );

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}
