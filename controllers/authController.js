const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncCatch = require("../utils/asyncCatch");
const { sendEmail } = require("../utils/email");

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendJWT = (res, statusCode, user) => {
  const token = signToken(user);

  res.status(statusCode).json({
    status: "success",
    token,
  });
};
const signup = asyncCatch(async (req, res, next) => {
  const { name, email, password, passwordConfirm, passwordChangedAt } =
    req.body;
  if (!name || !email || !password || !passwordConfirm)
    return next(new AppError("Please fill all required info", 400));

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });
  // const token = signToken(newUser);

  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  sendJWT(res, 200, newUser);
});

const login = asyncCatch(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please fill required field to login"));

  const user = await User.findOne({ email }).select("+password");
  const check = user?.checkPassword(password, user.password);
  if (!user || !check)
    return next(
      new AppError("Email or password invalid, please check and try again", 400)
    );

  // const token = signToken(user);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  sendJWT(res, 200, user);
});

const protect = asyncCatch(async (req, res, next) => {
  //1 check token exits
  if (!req.headers?.authorization?.startsWith("Bearer"))
    return next(
      new AppError("You don't loggin, please login to get access", 401)
    );
  const token = req.headers.authorization.split(" ")[1];
  console.log(token);
  if (!token)
    return next(
      new AppError("You don't loggin, please login to get access", 401)
    );
  //2, verify token:change payload, token expires
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3, user use token still exits
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user used this token has been deleted or not exists, please signup or contact with us to know detail",
        401
      )
    );
  //4, check password has changed after the token issused?
  if (currentUser.checkPasswordChangeAfter(decoded.iat))
    return next(
      new AppError(
        "User recently change password, please login again to get access",
        401
      )
    );

  req.user = currentUser;
  next();
});

const forgotPassword = asyncCatch(async (req, res, next) => {
  //check email
  const { email } = req.body;
  if (!email) return next(new AppError("Please fill your email", 400));
  const user = await User.findOne({ email });
  if (!user)
    return next(
      new AppError("Your email is not correct, please check and try again", 403)
    );
  //create token and save token in DB
  const resetToken = user.createResetTokenPwd();
  await user.save({ validateBeforeSave: false });
  //send email
  const subject = "This is your password reset turn (valid in 10 minutes)";
  const message = `You forgot password, please click to this link to reset password ${req.protocol}://${req.hostname}/api/v1/users/reset-password/${resetToken}, if you didn't forgot your password just ignore this mail`;

  try {
    await sendEmail({ subject, email, message });
    //check if error, we need reset fields of reset password

    res.status(200).json({
      status: "success",
      message: "Sent mail to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenTime = undefined;
    console.log(err);
    await user.save();
  }
});

const resetPassword = asyncCatch(async (req, res, next) => {
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken,
    passwordResetTokenTime: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Your token is invalid or expired", 401));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenTime = undefined;
  await user.save();

  // const token = signToken(user);
  sendJWT(res, 201, user);
});

const updatePassword = asyncCatch(async (req, res, next) => {
  //check user fill current password and check true of false
  const { currentPassword } = req.body;
  if (!currentPassword)
    return next(
      new AppError("Please fill your current password to confirm", 400)
    );
  const user = await User.findById(req.user._id).select("+password");
  const check = await user.checkPassword(currentPassword, user.password);
  if (!check)
    return next(
      new AppError(
        "Your password is not correct, please check and try again",
        403
      )
    );
  //check user password, and password confirm

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //update password if this condition above is true
  await user.save();
  //sen jwt
  sendJWT(res, 200, user);
});
module.exports = {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
};
