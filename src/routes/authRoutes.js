import express from "express";
import {
  login,
  register,
  requestOtp,
  updateExpoPushToken,
  updateUsername,
  verifyOtpAndResetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// router.use(protect);

router.post("/register", register);
router.post("/login", login);
router.put("/update-token", protect, updateExpoPushToken);
router.put("/update-name", protect, updateUsername);
router.post("/request-otp", requestOtp);
router.post("/reset-password", verifyOtpAndResetPassword);

export default router;
