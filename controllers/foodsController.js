const Food = require("../models/foodsModel");
const APIFeature = require("../utils/APIFeatures");

const getAllFoods = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "Fails",
      message: "Data not found",
      error: err,
    });
  }
};

const createFood = async (req, res) => {
  try {
    const food = await Food.create(req.body);
    res.status(201).json({
      status: "Success",
      data: {
        food,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "Fails",
      message: "Data invalid",
      error: err.message,
    });
  }
};

const getFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    res.status(200).json({
      status: "Success",
      data: {
        food,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "Fails",
      message: "Data not found",
      error: err,
    });
  }
};

const updateFood = async (req, res) => {
  try {
    const food = await Food.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(201).json({
      status: "Success",
      data: {
        food,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "Fails",
      message: "Data invalid",
      error: err,
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    await Food.findOneAndDelete({ _id: req.params.id });
    res.status(204).json({
      status: "Success",
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: "Fails",
      message: "Id invalid",
      error: err,
    });
  }
};

const aliasTop6CheapFoods = (req, res, next) => {
  req.query.sort = "price";
  req.query.limit = 6;
  next();
};
const aliasTop6CheapFoods2 = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "Fails",
      message: "Data not found",
      error: err,
    });
  }
};

const getFoodsStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: "Fails",
      message: "Data not found",
      error: err,
    });
  }
};
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
