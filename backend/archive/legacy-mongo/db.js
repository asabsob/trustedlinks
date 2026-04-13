import mongoose from "mongoose";
console.log("ENV_HAS_MONGODB_URI:", Object.prototype.hasOwnProperty.call(process.env, "MONGODB_URI"));
console.log("ENV_MONGO_KEYS:", Object.keys(process.env).filter(k => k.toLowerCase().includes("mongo")));
console.log("DEBUG_MONGO_URI:", process.env.MONGODB_URI);
export async function connectDB() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) throw new Error("Missing MONGODB_URI");

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName: (process.env.MONGODB_DB || "").trim() || undefined,
  });

  console.log("✅ MongoDB connected");
}
