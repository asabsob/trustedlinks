import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || "";

  console.log(
    "MONGODB URI CHECK:",
    mongoUri.replace(/\/\/(.*?):(.*?)@/, "//***:***@")
  );

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}
