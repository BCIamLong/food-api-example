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
  verifyEmail,
  confirmEmail,
} = require("../controllers/authController");

const router = express.Router();

router.post("/email-verify", protect, verifyEmail);
router.patch("/confirm-email/:id", confirmEmail);

router.patch("/update-me", protect, updateMe);
router.delete("/delete-me", protect, deleteMe);

router.patch("/update-current-password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

router.post("/signup", signup);
router.post("/login", login);

router.route("/").get(getAllUsers);

module.exports = router;
