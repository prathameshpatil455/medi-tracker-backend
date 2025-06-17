import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { downloadTransactionReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/download", protect, downloadTransactionReport);

export default router;
