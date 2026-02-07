import mongoose from "mongoose";

console.log("🧪 MONGODB_URI exists?", !!process.env.MONGODB_URI);
console.log("🧪 MONGODB_URI length:", process.env.MONGODB_URI?.length);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "trustedlinks"
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
