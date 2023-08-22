const Food = require("../models/foodsModel");
const APIFeature = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const asyncCatch = require("../utils/asyncCatch");

const getAllFoods = asyncCatch(async (req, res, next) => {
  const count = await Food.countDocuments({});
  const featuresAPI = new APIFeature(Food, req.query)
    .filter()
    .sort()
    .select()
    .pagination(count);
  const foods = await featuresAPI.query;
  res.status(200).json({
    status: "Success",
    results: foods.length,
    data: {
      foods,
    },
  });
});

const createFood = asyncCatch(async (req, res, next) => {
  const food = await Food.create(req.body);
  res.status(201).json({
    status: "Success",
    data: {
      food,
    },
  });
});

const getFood = asyncCatch(async (req, res, next) => {
  const food = await Food.findById(req.params.id);
  if (!food) return next(new AppError("Invalid id", 400));
  res.status(200).json({
    status: "Success",
    data: {
      food,
    },
  });
});

const updateFood = asyncCatch(async (req, res, next) => {
  const food = await Food.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!food) return next(new AppError("Invalid id", 400));
  res.status(201).json({
    status: "Success",
    data: {
      food,
    },
  });
});

const deleteFood = asyncCatch(async (req, res, next) => {
  const food = await Food.findOneAndDelete({ _id: req.params.id });
  if (!food) return next(new AppError("Invalid id", 400));
  res.status(204).json({
    status: "Success",
    data: null,
  });
});

const aliasTop6CheapFoods = (req, res, next) => {
  req.query.sort = "price";
  req.query.limit = 6;
  next();
};
const aliasTop6CheapFoods2 = asyncCatch(async (req, res, next) => {
  const foods = await Food.aggregate([
    {
      $sort: { price: 1 },
    },
    {
      $limit: 6,
    },
  ]);
  res.status(200).json({
    status: "Success",
    data: {
      foods,
    },
  });
});

const getFoodsStats = asyncCatch(async (req, res, next) => {
  const stats = await Food.aggregate([
    {
      $group: {
        _id: "$category",
        totalPrice: { $sum: "$price" },
        totalDiscount: { $sum: "$discount" },
        avgPrice: { $avg: "$price" },
        avgDiscount: { $avg: "$discount" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        totalPrice: 1,
        totalDiscount: { $round: ["$totalDiscount", 1] },
        //*https://www.mongodb.com/docs/manual/reference/operator/aggregation/#arithmetic-expression-operators
        avgPrice: { $round: ["$avgPrice", 1] }, // you can also use $ceil, $floor
        avgDiscount: { $round: ["$avgDiscount", 1] },
      },
    },
    {
      $sort: { totalPrice: -1 },
    },
    {
      limit: 10,
    },
  ]);
  res.status(200).json({
    status: "Success",
    data: {
      stats,
    },
  });
});

module.exports = {
  getAllFoods,
  createFood,
  getFood,
  updateFood,
  deleteFood,
  aliasTop6CheapFoods,
  aliasTop6CheapFoods2,
  getFoodsStats,
};
