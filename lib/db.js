const mongoose = require("mongoose");

let connected = false;

async function connectDB() {
  if (connected) {
    console.log("⚠️ Already connected to database");
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat-app";
    
    await mongoose.connect(MONGODB_URI);
    
    connected = true;
    console.log("✅ DB connected successfully");
  } catch (error) {
    console.error("❌ DB connection error:", error);
    throw error;
  }
}

module.exports = { connectDB };