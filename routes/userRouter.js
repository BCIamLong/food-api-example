const express = require("express");
const {
  getAllUsers,
  updateMe,
  deleteMe,
} = require("../controllers/userController");
const {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require("../controllers/authController");

const router = express.Router();

router.patch("/update-me", protect, updateMe);
router.delete("/delete-me", protect, deleteMe);

router.patch("/update-current-password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

router.post("/signup", signup);
router.post("/login", login);

router.route("/").get(getAllUsers);

module.exports = router;
