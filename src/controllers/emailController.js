import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import dayjs from "dayjs";
import Transaction from "../models/Transaction.js";
import { generateSummaryHTML } from "../utils/generateSummaryHtml.js";

// Test route to send email to one user
export const sendTestEmail = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Email and name required" });
  }

  console.log("reached here");

  try {
    await sendEmail(
      email,
      "📊 WalletWise Test Summary",
      `
    <h3>Hello ${name},</h3>
    <p>This is a test summary from WalletWise:</p>
    <ul>
      <li><strong>Total Income:</strong> ₹5000</li>
      <li><strong>Total Expense:</strong> ₹2500</li>
      <li><strong>Net Savings:</strong> ₹2500</li>
    </ul>
  `
    );

    res.json({ message: "Test email sent successfully" });
  } catch (err) {
    console.log("reached hello");

    res.status(500).json({ message: err.message });
  }
};

// Monthly summary
export const sendMonthlyEmails = async (req, res) => {
  try {
    const users = await User.find({ email: { $ne: null } });

    for (const user of users) {
      await sendEmail(user.email, user.name, {
        name: user.name,
        totalIncome: "₹35000",
        totalExpense: "₹12000",
        netSavings: "₹23000",
      });
    }

    res.json({ message: "Monthly summary emails sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSummaryForUser = async (userId, days = 7) => {
  const startDate = dayjs().subtract(days, "day").toDate();

  const transactions = await Transaction.find({
    user: userId,
    createdAt: { $gte: startDate },
  });

  const income = transactions.filter((t) => t.type === "income");
  const expense = transactions.filter((t) => t.type === "expense");

  const sumByCategory = (txns) => {
    const total = txns.reduce((acc, t) => acc + t.amount, 0);
    const breakdown = {};

    txns.forEach((t) => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });

    const percentageBreakdown = {};
    for (const cat in breakdown) {
      percentageBreakdown[cat] =
        ((breakdown[cat] / total) * 100).toFixed(1) + "%";
    }

    return { total, breakdown: percentageBreakdown };
  };

  return {
    income: sumByCategory(income),
    expense: sumByCategory(expense),
    netSavings:
      income.reduce((a, t) => a + t.amount, 0) -
      expense.reduce((a, t) => a + t.amount, 0),
  };
};

export const sendWeeklyEmails = async (req, res) => {
  try {
    const users = await User.find({ email: { $ne: null } });

    for (const user of users) {
      const summary = await getSummaryForUser(user._id, 7); // past 7 days

      const html = generateSummaryHTML({
        name: user.name,
        ...summary,
      });

      await sendEmail(user.email, "📈 Your Weekly WalletWise Summary", html);
    }

    res.json({ message: "Weekly summaries sent!" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to send emails" });
  }
};
