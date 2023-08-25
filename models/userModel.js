const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please fill your username"],
  },
  email: {
    type: String,
    required: [true, "Please fill your email "],
    unique: true,
    validate: [validator.isEmail, "Please fill the valid email"],
  },
  role: {
    type: String,
    enum: ["user", "admin", "seller"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please fill your password"],
    minLength: [8, "Password must has at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Pasword not in the same, please check and try again",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenTime: Date,
  active: {
    type: Boolean,
    default: true,
  },
  reasonDeleteAccount: String,
  emailVerify: {
    type: Boolean,
    default: false,
  },
  emailVerifyOTP: String,
  emailVerifyOTPTimeout: Date,

  // passwordResetTokenTime: {
  //   type: Date,
  //   validate: {
  //     validator: function (val) {
  //       return val >= Date.now();
  //     },
  //     message: "Password reset token is expired",
  //   },
  // },
});

userSchema.methods.checkPassword = async function (currentPwd, hashPwd) {
  return await bcrypt.compare(currentPwd, hashPwd);
};

userSchema.methods.checkPasswordChangeAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTime = Math.floor(Date.parse(this.passwordChangedAt / 1000));
    return changedTime > JWTTimeStamp;
  }
  return false;
};

userSchema.methods.createResetTokenPwd = function () {
  const resetToken = crypto.randomBytes(48).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetTokenTime = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
userSchema.methods.createVerifyEmailOTP = async function () {
  const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

  this.emailVerifyOTP = await bcrypt.hash(otp, 12);
  this.emailVerifyOTPTimeout = Date.now() + 3 * 60 * 1000;
  return otp;
};

//notice validate in schema and pre hooks save not apply for update,...
//--> so to do that: we  can use save() to update
userSchema.pre("save", async function (next) {
  if (this.emailVerifyOTPTimeout && this.emailVerifyOTPTimeout < Date.now())
    return next(new AppError("Your OTP is expired", 401));
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  if (this.isNew) return next();
  // if(this.passwordResetTokenTime && !this.passwordResetTokenTime >= Date.now()) return next(new AppError('Your token is expired', 401));
  if (this.passwordResetTokenTime && this.passwordResetTokenTime < Date.now())
    return next(new AppError("Your reset password token is expired", 401));

  this.passwordChangedAt = Date.now() - 1000; //1000 seconds is ensure the timestamp always less than the timestamp of sen JWT when we reset password
  next();
});

userSchema.pre(/^find/, function (next) {
  //Use query pre hooks(middleware) to filter all user has false active out of output
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
