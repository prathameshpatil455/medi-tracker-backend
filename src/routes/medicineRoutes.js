import express from "express";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicinesForToday,
  getMedicinesForMonth,
  getMedicineById,
  getMedicineProgress,
  getUpcomingDoses,
  getRefillWarnings,
} from "../controllers/medicineController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// GET all medicines
router.get("/", getMedicines);

// GET today's medicines
router.get("/today", getMedicinesForToday);

// GET current month's medicines
router.get("/month", getMedicinesForMonth);

// GET low stock warning
router.get("/refill-warning", getRefillWarnings);

// GET one medicine
router.get("/:id", getMedicineById);

// POST new medicine
router.post("/", addMedicine);

// PUT update medicine
router.put("/:id", updateMedicine);

// DELETE medicine
router.delete("/:id", deleteMedicine);

// GET progress summary
router.get("/progress/summary", getMedicineProgress);

// GET upcoming doses in next X hours
router.get("/upcoming", getUpcomingDoses);

export default router;
