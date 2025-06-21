import express from "express";
import {
  getDailyMedicineLog,
  getMedicineLogsByDate,
  getMonthlyMedicineLogs,
  markMedicineAsTaken,
  markMultipleAsTaken,
} from "../controllers/medicineLogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/logs/daily", protect, getDailyMedicineLog);
router.get("/logs/monthly", protect, getMonthlyMedicineLogs);
router.get("/logs", protect, getMedicineLogsByDate); // optional

router.post("/:id/mark-taken", protect, markMedicineAsTaken);
router.post("/mark-bulk", protect, markMultipleAsTaken);

export default router;
