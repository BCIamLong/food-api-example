const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a user name"],
  },
  email: {
    type: String,
    required: [true, "User must have an email "],
    unique: true,
    validate: [validator.isEmail, "Please fill the valid email"],
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

//notice validate in schema and pre hooks save not apply for update,...
//--> so to do that: we  can use save() to update
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  if (this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //1000 seconds is ensure the timestamp always less than the timestamp of sen JWT when we reset password
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
