const dotenv = require("dotenv");
dotenv.config();
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const webPush = require("web-push");
const fs = require("fs");
const path = require("path");

const { connectDB } = require("./lib/db");
const User = require("./models/User");
const Message = require("./models/Message");

const SECRET = process.env.JWT_SECRET || "secret123";
const dev = process.env.NODE_ENV !== "production";

// تنظیم VAPID
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || "cursorsaeed@gmail.com";

if (publicKey && privateKey) {
  webPush.setVapidDetails("mailto:" + email, publicKey, privateKey);
}

if (dev && !process.argv.includes("--webpack")) {
  process.argv.push("--webpack");
}

const app = next({ dev });
const handler = app.getRequestHandler();

const onlineUsers = new Map();
const socketUsers = new Map();
const pushSubscriptions = new Map();

app.prepare().then(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  const MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  const server = createServer((req, res) => {
    const urlPath = req.url?.split("?")[0] || "";
    if (urlPath.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", urlPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    cookieParser()(req, res, (err) => {
      if (err) {
        console.error("Cookie parser error:", err);
      }
      handler(req, res);
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

  io.on("connection", (socket) => {
    // ================= REGISTER =================
    socket.on("register", async (data, cb) => {
      try {
        const { username, password } = data;

        if (!username || !password) {
          return cb({ error: "لطفاً نام کاربری و رمز عبور را وارد کنید" });
        }

        if (username.length < 3) {
          return cb({ error: "نام کاربری باید حداقل ۳ کاراکتر باشد" });
        }

        if (password.length < 4) {
          return cb({ error: "رمز عبور باید حداقل ۴ کاراکتر باشد" });
        }

        const exists = await User.findOne({ username });
        if (exists) {
          return cb({ error: "این نام کاربری قبلاً ثبت شده است" });
        }

        const hash = await bcrypt.hash(password, 10);
        await User.create({ username, password: hash });

        cb({ ok: true });
      } catch (error) {
        console.error("❌ Register error:", error);
        cb({ error: "خطا در ثبت نام" });
      }
    });

    // ================= LOGIN =================
    socket.on("login", async (data, cb) => {
      try {
        const { username, password } = data;

        if (!username || !password) {
          return cb({ error: "لطفاً نام کاربری و رمز عبور را وارد کنید" });
        }

        const user = await User.findOne({ username });
        if (!user) {
          return cb({ error: "نام کاربری یا رمز عبور اشتباه است" });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          return cb({ error: "نام کاربری یا رمز عبور اشتباه است" });
        }

        const token = jwt.sign({ username, userId: user._id }, SECRET, {
          expiresIn: "7d",
        });

        onlineUsers.set(username, socket.id);
        socketUsers.set(socket.id, username);
        await User.updateOne(
          { username },
          { isOnline: true, lastSeen: new Date() },
        );
        await emitUsersToAll(io);

        cb({ token, username });
      } catch (error) {
        console.error("❌ Login error:", error);
        cb({ error: "خطا در ورود" });
      }
    });

    // ================= SESSION RESTORE =================
    socket.on("session_restore", async ({ token }, cb) => {
      try {
        if (!token) {
          return cb({ error: "توکن یافت نشد" });
        }

        const decoded = jwt.verify(token, SECRET);
        const username = decoded.username;

        if (!username) {
          return cb({ error: "توکن نامعتبر است" });
        }

        const user = await User.findOne({ username });
        if (!user) {
          return cb({ error: "کاربر یافت نشد" });
        }

        onlineUsers.set(username, socket.id);
        socketUsers.set(socket.id, username);

        await User.updateOne(
          { username },
          { isOnline: true, lastSeen: new Date() },
        );

        await emitUsersToAll(io);
        cb({ ok: true, username });
      } catch (error) {
        console.error("❌ Session restore error:", error);
        cb({ error: "بازیابی نشست ناموفق بود" });
      }
    });

    // ================= GET USERS =================
    socket.on("get_users", async () => {
      const currentUsername = socketUsers.get(socket.id);
      if (!currentUsername) {
        socket.emit("users_list", []);
        return;
      }

      const usersList = await buildUsers(currentUsername);
      socket.emit("users_list", usersList);
    });

    // ================= SAVE PUSH SUBSCRIPTION =================
    socket.on("save_push_subscription", async ({ subscription, userId }) => {
      try {
        if (subscription && userId) {
          const user = await User.findOne({ username: userId });
          if (user) {
            await user.savePushSubscription(subscription);
            console.log(`✅ Push subscription saved to DB for ${userId}`);
          } else {
            console.log(`❌ User not found: ${userId}`);
          }
        }
      } catch (error) {
        console.error("❌ Error saving push subscription:", error);
      }
    });

    // ================= REMOVE PUSH SUBSCRIPTION =================
    socket.on("remove_push_subscription", async ({ userId }) => {
      try {
        if (userId) {
          const user = await User.findOne({ username: userId });
          if (user) {
            await user.removePushSubscription();
            console.log(`🗑️ Push subscription removed for ${userId}`);
          }
        }
      } catch (error) {
        console.error("❌ Error removing push subscription:", error);
      }
    });

    // ================= PRIVATE MESSAGE =================
    socket.on(
      "private_message",
      async ({ sender, receiver, text, tempId, replyTo, attachment }, cb) => {
        try {
          const msgData = {
            sender,
            receiver,
            text: text || "",
            seen: false,
            delivered: true,
            deliveredAt: new Date(),
          };

          if (replyTo && replyTo.messageId) {
            msgData.replyTo = {
              messageId: replyTo.messageId,
              text: replyTo.text,
              sender: replyTo.sender,
            };
          }

          if (attachment && attachment.url) {
            msgData.attachment = attachment;
          }

          if (!msgData.text && !msgData.attachment) {
            if (cb) cb({ success: false, error: "Empty message" });
            return;
          }

          const msg = await Message.create(msgData);

          const payload = {
            _id: msg._id.toString(),
            sender,
            receiver,
            text: msg.text,
            time: msg.createdAt,
            createdAt: msg.createdAt,
            status: "delivered",
            replyTo: msg.replyTo || null,
            attachment: msg.attachment || null,
          };

          const rSocket = onlineUsers.get(receiver);
          if (rSocket) {
            io.to(rSocket).emit("receive_private_message", payload);

            const sSocket = onlineUsers.get(sender);
            if (sSocket) {
              io.to(sSocket).emit("message_delivered", {
                messageId: msg._id.toString(),
                sender,
                receiver,
              });
            }
          }

          // ===== ارسال نوتیفیکیشن =====
          // if (!onlineUsers.has(receiver)) {
          try {
            console.log(`🔍 Looking for subscription in DB for: ${receiver}`);

            // دریافت اشتراک از دیتابیس
            const user = await User.findOne({ username: receiver });
            const subscription = user?.pushSubscription;

            console.log(
              `📋 Subscription in DB: ${subscription ? "✅ YES" : "❌ NO"}`,
            );

            if (subscription && publicKey && privateKey) {
              const pushPayload = JSON.stringify({
                title: `📩 پیام از ${sender}`,
                body: text || "یک عکس جدید",
                icon: "/icons/icon-192x192.png",
                url: `/chat/${sender}`,
                messageId: msg._id.toString(),
                sender: sender,
              });

              await webPush.sendNotification(subscription, pushPayload);
              console.log(`✅ Push notification sent to ${receiver}`);
            } else {
              console.log(`ℹ️ No push subscription for ${receiver}`);
            }
          } catch (pushError) {
            console.error(`❌ Push error for ${receiver}:`, pushError);

            if (pushError.statusCode === 410) {
              await User.updateOne(
                { username: receiver },
                { pushSubscription: null },
              );
              console.log(`🗑️ Removed expired subscription for ${receiver}`);
            }
          }
          // }

          if (cb) {
            cb({ success: true, messageId: msg._id.toString() });
          }

          await emitUsersToAll(io);
        } catch (error) {
          console.error("❌ Send message error:", error);
          if (cb) {
            cb({ success: false, error: error.message });
          }
        }
      },
    );

    // ================= MESSAGE SEEN =================
    socket.on("message_seen", async ({ messageIds, sender, receiver }, cb) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, sender, receiver },
          { seen: true, seenAt: new Date() },
        );

        const senderSocket = onlineUsers.get(sender);
        if (senderSocket) {
          io.to(senderSocket).emit("messages_seen", {
            messageIds,
            sender,
            receiver,
            seenBy: receiver,
          });
        }

        await emitUsersToAll(io);

        if (cb) {
          cb({ success: true });
        }
      } catch (error) {
        console.error("❌ Message seen error:", error);
        if (cb) {
          cb({ success: false, error: error.message });
        }
      }
    });

    // ================= CLEAR CHAT HISTORY =================
    socket.on("clear_chat_history", async ({ user1, user2 }, cb) => {
      try {
        await Message.deleteMany({
          $or: [
            { sender: user1, receiver: user2 },
            { sender: user2, receiver: user1 },
          ],
        });

        await emitUsersToAll(io);

        if (cb) cb({ success: true });
      } catch (error) {
        console.error("❌ Clear chat history error:", error);
        if (cb) cb({ success: false, error: error.message });
      }
    });

    // ================= EDIT MESSAGE =================
    socket.on(
      "edit_message",
      async ({ messageId, sender, receiver, newText }, cb) => {
        try {
          await Message.updateOne(
            { _id: messageId, sender },
            { text: newText, editedAt: new Date() },
          );

          const receiverSocket = onlineUsers.get(receiver);
          if (receiverSocket) {
            io.to(receiverSocket).emit("message_edited", {
              messageId,
              newText,
              sender,
              receiver,
            });
          }

          if (cb) cb({ success: true });
        } catch (error) {
          console.error("❌ Edit message error:", error);
          if (cb) cb({ success: false, error: error.message });
        }
      },
    );

    // ================= DELETE MESSAGE =================
    socket.on("delete_message", async ({ messageId, sender, receiver }, cb) => {
      try {
        await Message.deleteOne({ _id: messageId, sender });

        const receiverSocket = onlineUsers.get(receiver);
        if (receiverSocket) {
          io.to(receiverSocket).emit("message_deleted", {
            messageId,
            sender,
            receiver,
          });
        }

        if (cb) cb({ success: true });
      } catch (error) {
        console.error("❌ Delete message error:", error);
        if (cb) cb({ success: false, error: error.message });
      }
    });

    // ================= PIN MESSAGE =================
    socket.on(
      "pin_message",
      async ({ messageId, sender, receiver, isPinned }, cb) => {
        try {
          await Message.updateOne({ _id: messageId }, { isPinned });

          const receiverSocket = onlineUsers.get(receiver);
          if (receiverSocket) {
            io.to(receiverSocket).emit("message_pinned", {
              messageId,
              isPinned,
              sender,
              receiver,
            });
          }

          if (cb) cb({ success: true });
        } catch (error) {
          console.error("❌ Pin message error:", error);
          if (cb) cb({ success: false, error: error.message });
        }
      },
    );

    // ================= TYPING INDICATOR =================
    socket.on("typing_start", ({ sender, receiver }) => {
      const receiverSocket = onlineUsers.get(receiver);
      if (receiverSocket) {
        io.to(receiverSocket).emit("user_typing", {
          sender,
          receiver,
          isTyping: true,
        });
      }
    });

    socket.on("typing_stop", ({ sender, receiver }) => {
      const receiverSocket = onlineUsers.get(receiver);
      if (receiverSocket) {
        io.to(receiverSocket).emit("user_typing", {
          sender,
          receiver,
          isTyping: false,
        });
      }
    });

    // ================= LOAD MESSAGES =================
    socket.on(
      "load_messages",
      async ({ user1, user2, page = 0, limit = 20 }, cb) => {
        try {
          const skip = page * limit;

          const messages = await Message.find({
            $or: [
              { sender: user1, receiver: user2 },
              { sender: user2, receiver: user1 },
            ],
          })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

          const reversedMessages = [...messages].reverse();

          const formattedMessages = reversedMessages.map((msg) => ({
            _id: msg._id.toString(),
            sender: msg.sender,
            receiver: msg.receiver,
            text: msg.text,
            time: msg.createdAt,
            createdAt: msg.createdAt,
            seen: msg.seen || false,
            status:
              msg.sender === user1
                ? msg.seen
                  ? "seen"
                  : onlineUsers.has(msg.receiver)
                    ? "delivered"
                    : "sent"
                : undefined,
            isPinned: msg.isPinned || false,
            editedAt: msg.editedAt || null,
            replyTo: msg.replyTo || null,
            attachment: msg.attachment || null,
          }));

          cb(formattedMessages);
        } catch (error) {
          console.error("❌ Load messages error:", error);
          cb([]);
        }
      },
    );

    // ================= DISCONNECT =================
    socket.on("disconnect", async () => {
      let disconnectedUser = socketUsers.get(socket.id) || null;

      if (disconnectedUser) {
        onlineUsers.delete(disconnectedUser);
        socketUsers.delete(socket.id);
      } else {
        for (const [u, id] of onlineUsers.entries()) {
          if (id === socket.id) {
            disconnectedUser = u;
            onlineUsers.delete(u);
            break;
          }
        }
        socketUsers.delete(socket.id);
      }

      if (disconnectedUser) {
        await User.updateOne(
          { username: disconnectedUser },
          { isOnline: false, lastSeen: new Date() },
        );
        await emitUsersToAll(io);
      }
    });
  });

  // ================= HELPERS =================
  async function buildUsers(currentUsername) {
    try {
      const users = await User.find()
        .select("username isOnline lastSeen")
        .lean();

      const usersWithDetails = await Promise.all(
        users.map(async (u) => {
          if (u.username === currentUsername) {
            return null;
          }

          const lastMessage = await Message.findOne({
            $or: [
              { sender: currentUsername, receiver: u.username },
              { sender: u.username, receiver: currentUsername },
            ],
          })
            .sort({ createdAt: -1 })
            .lean();

          let lastMessageStatus = null;
          let lastMessageSender = null;

          if (lastMessage) {
            lastMessageSender = lastMessage.sender;
            if (lastMessage.sender === currentUsername) {
              lastMessageStatus = lastMessage.seen
                ? "seen"
                : onlineUsers.has(u.username)
                  ? "delivered"
                  : "sent";
            }
          }

          const unreadCount = await Message.countDocuments({
            sender: u.username,
            receiver: currentUsername,
            seen: false,
          });

          return {
            username: u.username,
            online: onlineUsers.has(u.username),
            lastSeen: u.lastSeen,
            lastMessage: lastMessage?.attachment
              ? "📷 عکس"
              : lastMessage?.text || "",
            lastMessageStatus: lastMessageStatus,
            lastMessageSender: lastMessageSender,
            lastMessageId: lastMessage?._id?.toString(),
            unread: unreadCount,
          };
        }),
      );

      return usersWithDetails.filter(Boolean);
    } catch (error) {
      console.error("❌ Build users error:", error);
      return [];
    }
  }

  async function emitUsersToAll(io) {
    try {
      for (const [username, socketId] of onlineUsers.entries()) {
        const data = await buildUsers(username);
        io.to(socketId).emit("users_list", data);
      }
    } catch (error) {
      console.error("❌ Emit users error:", error);
    }
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
