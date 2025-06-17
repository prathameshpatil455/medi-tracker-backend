import fs from "fs";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const generateTransactionPDF = async (userId, days = 7) => {
  const startDate = dayjs().subtract(days, "day").startOf("day").toDate();

  const transactions = await Transaction.find({
    user: userId,
    createdAt: { $gte: startDate },
  }).sort({ createdAt: 1 });

  const user = await User.findById(userId);
  const fileName = `walletwise-transactions-${userId}-${Date.now()}.pdf`;
  const filePath = `./reports/${fileName}`;

  const doc = new PDFDocument({ margin: 30, size: "A4" });
  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(20).text("WALLETWISE - TRANSACTION REPORT", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`User: ${user.name || "User"} | Email: ${user.email}`);
  doc.text(`Range: Last ${days} days`);
  doc.text(`Generated: ${dayjs().format("DD MMM YYYY")}`);
  doc.moveDown();

  // Table Header
  doc.fontSize(12).text("Date", 30, doc.y, { continued: true, width: 80 });
  doc.text("Type", 110, doc.y, { continued: true, width: 60 });
  doc.text("Category", 170, doc.y, { continued: true, width: 100 });
  doc.text("Amount", 270, doc.y, { continued: true, width: 80 });
  doc.text("Note", 350, doc.y);
  doc.moveDown(0.5);

  // Horizontal line
  doc.moveTo(30, doc.y).lineTo(550, doc.y).stroke();

  // Table Body
  transactions.forEach((t) => {
    const date = dayjs(t.createdAt).format("DD MMM YY");
    doc.text(date, 30, doc.y, { continued: true, width: 80 });
    doc.text(t.type, 110, doc.y, { continued: true, width: 60 });
    doc.text(t.category || "-", 170, doc.y, { continued: true, width: 100 });
    doc.text(`₹${t.amount.toFixed(2)}`, 270, doc.y, {
      continued: true,
      width: 80,
    });
    doc.text(t.note || "-", 350, doc.y);
    doc.moveDown(0.5);
  });

  doc.end();
  return filePath;
};
