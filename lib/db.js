const mongoose = require("mongoose");

let connected = false;

async function connectDB() {
  if (connected) {
    console.log("⚠️ Already connected to database");
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat-app";
    
    // لاگ برای دیباگ - این رو بعداً پاک کن
    console.log("🔍 MONGODB_URI:", MONGODB_URI ? "✅ Defined" : "❌ UNDEFINED");
    console.log("🔍 First 20 chars:", MONGODB_URI.substring(0, 20) + "...");
    
    await mongoose.connect(MONGODB_URI);
    
    connected = true;
    console.log("✅ DB connected successfully");
  } catch (error) {
    console.error("❌ DB connection error:", error);
    throw error;
  }
}

module.exports = { connectDB };