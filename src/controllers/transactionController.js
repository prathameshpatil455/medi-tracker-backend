import Transaction from "../models/Transaction.js";
import dayjs from "dayjs";

export const getTransactions = async (req, res) => {
  const { page = 1, limit = 10, type, category, search, from, to } = req.query;
  const query = { user: req.user._id };

  if (type) query.type = type;
  if (category) query.category = category;
  if (search) query.description = { $regex: search, $options: "i" };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const transactions = await Transaction.find(query)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const count = await Transaction.countDocuments(query);

  res.json({
    transactions,
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
  });
};

export const createTransaction = async (req, res) => {
  const { type, amount, category, description, date } = req.body;
  const transaction = new Transaction({
    user: req.user._id,
    type,
    amount,
    category,
    description,
    date,
  });
  await transaction.save();
  res.status(201).json(transaction);
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, amount, category, description, date } = req.body;

  const updated = await Transaction.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { type, amount, category, description, date },
    { new: true }
  );

  if (!updated) {
    return res
      .status(404)
      .json({ message: "Transaction not found or not yours" });
  }

  res.json(updated);
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const deleted = await Transaction.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!deleted)
    return res.status(404).json({ message: "Transaction not found" });
  res.json({ message: "Transaction deleted" });
};

export const getExpenseTransactions = async (req, res) => {
  req.query.type = "expense";
  return getTransactions(req, res);
};

export const getIncomeTransactions = async (req, res) => {
  req.query.type = "income";
  return getTransactions(req, res);
};

export const getTransactionSummary = async (req, res) => {
  const userId = req.user._id;

  const [incomeAgg, expenseAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  const balance = totalIncome - totalExpense;

  res.json({ totalIncome, totalExpense, balance });
};

export const getTransactionCategories = async (req, res) => {
  const userId = req.user._id;

  const categories = await Transaction.distinct("category", { user: userId });

  res.json({ categories });
};

export const getTransactionById = async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  res.json(transaction);
};

export const deleteManyTransactions = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Invalid or empty ID list" });
  }

  const result = await Transaction.deleteMany({
    _id: { $in: ids },
    user: req.user._id,
  });

  res.json({ deletedCount: result.deletedCount });
};

export const getTransactionCardSummary = async (req, res) => {
  const userId = req.user._id;

  const [incomeAgg, expenseAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, type: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: "expense" } },
      { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.totalIncome || 0;
  const totalExpense = expenseAgg[0]?.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  res.json({ totalIncome, totalExpense, balance });
};

const generateEmptyTrendMap = (range) => {
  const now = dayjs();
  const map = {};

  if (range === "weekly") {
    for (let i = 0; i < 7; i++) {
      const date = now.startOf("week").add(i, "day").format("YYYY-MM-DD");
      map[date] = { income: 0, expense: 0 };
    }
  } else if (range === "monthly") {
    for (let i = 0; i <= now.month(); i++) {
      const date = now.startOf("year").add(i, "month").format("YYYY-MM");
      map[date] = { income: 0, expense: 0 };
    }
  } else if (range === "yearly") {
    for (let i = 2; i >= 0; i--) {
      const year = now.subtract(i, "year").format("YYYY");
      map[year] = { income: 0, expense: 0 };
    }
  }

  return map;
};

export const getTransactionTrends = async (req, res) => {
  const { range = "weekly" } = req.query;
  const userId = req.user._id;
  const now = dayjs();

  let startDate = new Date();
  let groupBy;

  if (range === "weekly") {
    startDate = now.startOf("week").toDate();
    groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
  } else if (range === "monthly") {
    startDate = now.startOf("year").toDate();
    groupBy = { $dateToString: { format: "%Y-%m", date: "$date" } };
  } else if (range === "yearly") {
    startDate = now.subtract(1, "year").startOf("year").toDate(); // Past 3 years (including current)
    groupBy = { $dateToString: { format: "%Y", date: "$date" } }; // ✅ Group by year
  }

  const match = {
    user: userId,
    date: { $gte: startDate },
  };

  const rawData = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: groupBy,
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        income: {
          $sum: {
            $cond: [{ $eq: ["$_id.type", "income"] }, "$total", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$_id.type", "expense"] }, "$total", 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing days/months with 0s
  const trendMap = generateEmptyTrendMap(range);

  for (const entry of rawData) {
    const date = entry._id;
    trendMap[date] = {
      income: entry.income || 0,
      expense: entry.expense || 0,
    };
  }

  const result = Object.entries(trendMap).map(([date, values]) => ({
    date,
    ...values,
  }));

  res.json(result);
};

export const getTransactionCategoryPercentages = async (req, res) => {
  const userId = req.user._id;

  const categoryAgg = await Transaction.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  let incomeTotal = 0;
  let expenseTotal = 0;
  const incomeCategories = {};
  const expenseCategories = {};

  for (const entry of categoryAgg) {
    const { category, type } = entry._id;
    const total = entry.total;

    if (type === "income") {
      incomeTotal += total;
      incomeCategories[category] = (incomeCategories[category] || 0) + total;
    } else if (type === "expense") {
      expenseTotal += total;
      expenseCategories[category] = (expenseCategories[category] || 0) + total;
    }
  }

  const income = Object.entries(incomeCategories).map(([category, amount]) => ({
    category,
    percentage: ((amount / incomeTotal) * 100).toFixed(2),
  }));

  const expense = Object.entries(expenseCategories).map(
    ([category, amount]) => ({
      category,
      percentage: ((amount / expenseTotal) * 100).toFixed(2),
    })
  );

  res.json({ income, expense });
};
