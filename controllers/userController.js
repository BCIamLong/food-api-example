const User = require("../models/userModel");
const APIFeature = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const asyncCatch = require("../utils/asyncCatch");

const getAllUsers = asyncCatch(async (req, res, next) => {
  const count = await User.countDocuments({});
  const apiFeatures = new APIFeature(User.find(), req.query)
    .filter()
    .select()
    .sort()
    .pagination(count);
  const users = await apiFeatures.query;
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

/**
 * Filter all not allow fields in object
 *
 * @param {Object} ob - the object we need filter
 * @param  {Array} fields - the fields array constain all allow fields
 * @returns {Object} filteredOb - the filtered object is object which we filtered
 */
const filterObject = (ob, ...fields) => {
  const filteredOb = {};
  Object.keys(ob).forEach(field => {
    if (fields.includes(field)) filteredOb[field] = ob[field];
  });
  return filteredOb;
};

/**
 * Allow user logged in update user data with (userself not all users)
 *
 * Conditions: User must to login, user only update allow fields (not password, role, ...)
 *
 * @param {function} asyncCatch - the async wrapper function (like try catch block)
 * @returns {function} middleware function - the middleware function(req, res, next) is standard of express can excute in middleware stack
 */
const updateMe = asyncCatch(async (req, res, next) => {
  const filteredBody = filterObject(req.body, "name", "email");

  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    status: "success",
    data: {
      user: updateUser,
    },
  });
});

/**
 * Allow user logged in delete hisself(not other user, all users)
 *
 * Conditions: choose the reason delete, re-enter password
 *
 * We only set user active to false not totally delete user, because maybe in the future use can back and trigged his account again
 * @param {function} asyncCatch - the async wrapper function (like try catch block)
 * @returns {function} middleware function - the middleware function(req, res, next) is standard of express can excute in middleware stack
 */
const deleteMe = asyncCatch(async (req, res, next) => {
  const { reason, password } = req.body;
  if (!reason)
    return next(
      new AppError("Please choose your reason to delete this account", 400),
    );
  if (!password)
    return next(
      new AppError("Please re-enter password to confirm delete", 400),
    );
  const user = await User.findById(req.user.id).select("+password");
  const check = await user.checkPassword(password, user.password);
  if (!check) return next(new AppError("Your password not correct", 401));

  user.active = false;
  user.reasonDeleteAccount = reason;
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
module.exports = { getAllUsers, updateMe, deleteMe };
