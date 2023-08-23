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
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

router
  .route("/foods-stats")
  .get(protect, restrictTo("admin", "seller"), getFoodsStats);
router.route("/top-6-cheap-foods").get(aliasTop6CheapFoods, getAllFoods);
router.route("/top-6-cheap-foods-2v").get(aliasTop6CheapFoods2);

router
  .route("/")
  .get(getAllFoods)
  .post(protect, restrictTo("admin", "seller"), createFood);
router
  .route("/:id")
  .get(getFood)
  .patch(protect, restrictTo("admin", "seller"), updateFood)
  .delete(protect, restrictTo("admin", "seller"), deleteFood);
module.exports = router;
