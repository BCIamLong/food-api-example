const User = require("../models/userModel");
const APIFeature = require("../utils/APIFeatures");
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

module.exports = { getAllUsers };
