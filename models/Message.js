const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      index: true,
    },
    receiver: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    attachment: {
      type: {
        type: String,
        enum: ["image"],
      },
      url: String,
      previewUrl: String,
      fileName: String,
      fileSize: Number,
      previewFileSize: Number,
      mimeType: String,
      width: Number,
      height: Number,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    replyTo: {
      messageId: { type: String },
      text: { type: String },
      sender: { type: String },
    },
  },
  { timestamps: true }
);

// ایندکس‌ها برای جستجوی سریعتر
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ isPinned: -1, createdAt: -1 });
MessageSchema.index({ seen: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", MessageSchema);