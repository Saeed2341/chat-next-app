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
    // ===== اضافه کردن فیلد pushSubscription =====
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

// ===== متدهای کمکی برای مدیریت اشتراک Push =====
UserSchema.methods.savePushSubscription = async function(subscription) {
  this.pushSubscription = subscription;
  await this.save();
  return this;
};

UserSchema.methods.removePushSubscription = async function() {
  this.pushSubscription = null;
  await this.save();
  return this;
};

UserSchema.methods.getPushSubscription = function() {
  return this.pushSubscription;
};

// ===== استاتیک متد برای پیدا کردن کاربر با اشتراک =====
UserSchema.statics.findByPushSubscription = function(subscription) {
  return this.findOne({ pushSubscription: subscription });
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);