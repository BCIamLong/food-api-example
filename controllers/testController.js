const Food = require("../models/foodsModel");
const APIFeature = require("../utils/APIFeatures");

//!we can't cretae class in this case because res and req use for middleware function and provide in middleware, so you don't have parameter to pass to constructor
class FoodController {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  async getAllFood() {
    try {
      const count = await Food.countDocuments({});
      const featuresAPI = new APIFeature(Food, this.req.query)
        .filter()
        .sort()
        .select()
        .pagination(count);
      const foods = await featuresAPI.query;
      this.res.status(200).json({
        status: "Success",
        results: foods.length,
        data: {
          foods,
        },
      });
    } catch (err) {
      this.res.status(404).json({
        status: "Fails",
        message: "Data not found",
        error: err,
      });
    }
  }

  async createFood() {
    try {
      const food = await Food.create(this.req.body);
      this.res.status(201).json({
        status: "Success",
        data: {
          food,
        },
      });
    } catch (err) {
      this.res.status(400).json({
        status: "Fails",
        message: "Data invalid",
        error: err.message,
      });
    }
  }

  async getFood() {
    try {
      const food = await Food.findById(this.req.params.id);
      this.res.status(200).json({
        status: "Success",
        data: {
          food,
        },
      });
    } catch (err) {
      this.res.status(404).json({
        status: "Fails",
        message: "Data not found",
        error: err,
      });
    }
  }

  async updateFood() {
    try {
      const food = await Food.findOneAndUpdate(
        { _id: this.req.params.id },
        this.req.body,
        {
          new: true,
          runValidators: true,
        }
      );
      this.res.status(201).json({
        status: "Success",
        data: {
          food,
        },
      });
    } catch (err) {
      this.res.status(404).json({
        status: "Fails",
        message: "Data invalid",
        error: err,
      });
    }
  }

  async deleteFood() {
    try {
      await Food.findOneAndDelete({ _id: this.req.params.id });
      this.res.status(204).json({
        status: "Success",
        data: null,
      });
    } catch (err) {
      this.res.status(400).json({
        status: "Fails",
        message: "Id invalid",
        error: err,
      });
    }
  }
}

module.exports = FoodController;
