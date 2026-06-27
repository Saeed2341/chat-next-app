const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./lib/db");
const User = require("./models/User");
const Message = require("./models/Message");

const SECRET = "secret123";
const dev = process.env.NODE_ENV !== "production";

// Next.js 16 defaults to Turbopack in dev which panics on non-ASCII paths
if (dev && !process.argv.includes("--webpack")) {
  process.argv.push("--webpack");
}

const app = next({ dev });
const handle = app.getRequestHandler();

const onlineUsers = new Map();
const socketUsers = new Map();

app.prepare().then(async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  const server = createServer((req, res) => {
    // مهم: درخواست‌ها رو به Next.js بفرست
    cookieParser()(req, res, (err) => {
      if (err) {
        console.error("Cookie parser error:", err);
      }
      // این خط حیاتی است - درخواست رو به Next.js می‌فرسته
      handle(req, res);
    });
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // ============= تمام رویدادهای WebSocket شما اینجا =============
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);
    
    // ... تمام کدهای WebSocket شما که قبلاً داشتی ...
    
    socket.on("disconnect", async () => {
      // ... کدهای disconnect شما ...
    });
  });

  // ============= شروع سرور =============
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Ready on http://localhost:${PORT}`);
  });
});