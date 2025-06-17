import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { applySecurityMiddlewares } from "./middleware/security.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import job from "./config/cron.js";
import motivationJob from "./cron/motivationJob.js";
import emailRoutes from "./routes/emailRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import weeklyJob from "./cron/weeklyJob.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import medicineLogRoutes from "./routes/medicineLogRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __dirname = path.resolve();

job.start();
motivationJob.start();
weeklyJob.start();
// middleware
app.use(cors());
app.use(express.json()); // this middleware will parse JSON bodies: req.body
app.use(rateLimiter);
// applySecurityMiddlewares(app);

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/medicineLogs", medicineLogRoutes);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

connectDB().then(() => {
  app.listen(port, () => {
    console.log("Server started on PORT:", port);
  });
});
