import express from "express";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicineController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getMedicines).post(protect, addMedicine);

router
  .route("/:id")
  .put(protect, updateMedicine)
  .delete(protect, deleteMedicine);

export default router;
