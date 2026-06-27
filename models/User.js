const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    avatarColor: {
      type: String,
      default: "#00a884",
    },
  },
  { timestamps: true }
);

// به روز رسانی lastSeen قبل از ذخیره
UserSchema.pre("save", function (next) {
  if (!this.isOnline) {
    this.lastSeen = new Date();
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);