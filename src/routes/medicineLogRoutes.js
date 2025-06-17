import express from "express";
import { markMedicineAsTaken } from "../controllers/medicineLogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/medicines/:id/mark-taken", protect, markMedicineAsTaken);

export default router;
