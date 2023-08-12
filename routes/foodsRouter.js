const express = require("express");
const {
  getAllFoods,
  createFood,
  getFood,
  updateFood,
  deleteFood,
  aliasTop6CheapFoods,
  aliasTop6CheapFoods2,
  getFoodsStats,
} = require("../controllers/foodsController");

const router = express.Router();

router.route("/foods-stats").get(getFoodsStats);
router.route("/top-6-cheap-foods").get(aliasTop6CheapFoods, getAllFoods);
router.route("/top-6-cheap-foods-2v").get(aliasTop6CheapFoods2);

router.route("/").get(getAllFoods).post(createFood);
router.route("/:id").get(getFood).patch(updateFood).delete(deleteFood);
module.exports = router;
