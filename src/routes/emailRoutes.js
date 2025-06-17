import express from "express";
import {
  sendTestEmail,
  sendWeeklyEmails,
  sendMonthlyEmails,
} from "../controllers/emailController.js";
import { generateTransactionPDF } from "../utils/generateSummaryPDF.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/test", protect, sendTestEmail);
router.post("/weekly", protect, sendWeeklyEmails);
router.post("/monthly", protect, sendMonthlyEmails);

export default router;
