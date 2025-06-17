import express from "express";
import {
  getTransactions,
  getExpenseTransactions,
  getIncomeTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getTransactionCategories,
  getTransactionById,
  deleteManyTransactions,
  getTransactionCardSummary,
  getTransactionTrends,
  getTransactionCategoryPercentages,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getTransactions);
router.get("/expense", getExpenseTransactions);
router.get("/income", getIncomeTransactions);
router.get("/summary", getTransactionSummary);
router.get("/categories", getTransactionCategories);
router.get("/:id", getTransactionById);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.delete("/", deleteManyTransactions); // bulk delete
router.get("/summary/cards", getTransactionCardSummary);
router.get("/summary/trends", getTransactionTrends);
router.get("/summary/categories", getTransactionCategoryPercentages);

export default router;
