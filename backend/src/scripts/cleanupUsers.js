import mongoose from "mongoose";
import { User } from "../models/User.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/snapdeal";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Delete all users (CAREFUL: this wipes the collection!)
    const result = await User.deleteMany({});
    console.log(`🗑 Deleted ${result.deletedCount} users`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error cleaning up:", err);
    process.exit(1);
  }
}

cleanup();
