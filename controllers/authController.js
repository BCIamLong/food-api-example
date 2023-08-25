const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncCatch = require("../utils/asyncCatch");
const { sendEmail } = require("../utils/email");

const signToken = user =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const optionsCookie = {
  httpOnly: true,
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  ),
};

if (process.env.NODE_ENV === "production") optionsCookie.secure = true;

const sendJWT = (res, statusCode, user) => {
  const token = signToken(user);

  res.cookie("jwt", token, optionsCookie);

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
  //send email here when user first be created and to verify
  const message = `Thank you for singing up ${name}, if you have any question you can contacts with us via foodsweb@gmai.com`;
  const subject = "You are a member of Foods website";

  //problem here: if user singup success but now if we send email fails so how can we handle in this case?
  try {
    await sendEmail({ email, subject, message });
  } catch (err) {
    await sendEmail({ email, subject, message });
  }
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
      new AppError(
        "Email or password invalid, please check and try again",
        400,
      ),
    );

  sendJWT(res, 200, user);
});

const protect = asyncCatch(async (req, res, next) => {
  //1 check token exits
  if (!req.headers?.authorization?.startsWith("Bearer"))
    return next(
      new AppError("You don't loggin, please login to get access", 401),
    );
  const token = req.headers.authorization.split(" ")[1];
  console.log(token);
  if (!token)
    return next(
      new AppError("You don't loggin, please login to get access", 401),
    );
  //2, verify token:change payload, token expires
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3, user use token still exits
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user used this token has been deleted or not exists, please signup or contact with us to know detail",
        401,
      ),
    );
  //4, check password has changed after the token issused?
  if (currentUser.checkPasswordChangeAfter(decoded.iat))
    return next(
      new AppError(
        "User recently change password, please login again to get access",
        401,
      ),
    );

  req.user = currentUser;
  next();
});

/**
 *Restrict user to perform not allow action(the action for admin,...) like delete, update, create data, this is also authorization
 *
 * @param  {Array} roles - The roles array constain allow role
 * @returns {Function} middlewareFunction - The middleware function(req, res, next) is a standard of express to execute middleware stack
 */
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You don't have permission to perform this action", 403),
      );
    next();
  };

const forgotPassword = asyncCatch(async (req, res, next) => {
  //check email
  const { email } = req.body;
  if (!email) return next(new AppError("Please fill your email", 400));
  const user = await User.findOne({ email });
  if (!user)
    return next(
      new AppError(
        "Your email is not correct, please check and try again",
        403,
      ),
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
      new AppError("Please fill your current password to confirm", 400),
    );
  const user = await User.findById(req.user._id).select("+password");
  const check = await user.checkPassword(currentPassword, user.password);
  if (!check)
    return next(
      new AppError(
        "Your password is not correct, please check and try again",
        403,
      ),
    );
  //check user password, and password confirm

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //update password if this condition above is true
  await user.save();
  //sen jwt
  sendJWT(res, 200, user);
});
/**
 * Verify email: when user singup but not confirm email so user will be limited access in our app, if user want to access and use more features user must to verify email
 *
 * User click verify and send otp code mail to user email in certain time (if greater this time this will expires)
 *
 * User can use this OTP to confirm email
 *
 *@param {Function} asyncCatch - The async catch funtion wrapper like try catch block
 *@returns {Function} middlewareFunction - The middleware function
 */
const verifyEmail = asyncCatch(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const otp = await user.createVerifyEmailOTP();
  await user.save({ validateBeforeSave: false });
  const subject = "Your verify email";
  const message = `This is otp ${otp} use for verify your email (valid in 3 mins)`;
  try {
    await sendEmail({ email: user.email, subject, message });
    res.status(200).json({
      status: "success",
      message: "Sent OTP code to your email",
    });
  } catch (err) {
    user.emailVerifyOTP = undefined;
    user.emailVerifyOTPTimeout = undefined;
    user.save({ validateBeforeSave: false });
  }
});

/**
 * When user got OTP code in email user use this to confirm email
 *
 * If the OTP is expired user musth to perform verify email action again
 *@param {Function} asyncCatch - The async catch funtion wrapper like try catch block
 *@returns {Function} middlewareFunction - The middleware function
 */
const confirmEmail = asyncCatch(async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    emailVerifyOTPTimeout: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Your OTP code was expires", 401));
  const { otp } = req.body;
  if (!otp)
    return next(
      new AppError(
        "Please enter OTP(sent to your email) code to confirm your email",
        400,
      ),
    );
  const check = await user.checkPassword(otp, user.emailVerifyOTP);
  if (!check)
    return next(
      new AppError("Your OTP is not correct, please check and try again", 400),
    );
  user.emailVerify = true;
  user.emailVerifyOTP = undefined;
  user.emailVerifyOTPTimeout = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    message: "Your email was verify",
  });
});

module.exports = {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
  verifyEmail,
  confirmEmail,
};
