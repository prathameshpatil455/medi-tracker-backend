import { CronJob } from "cron";
import { sendWeeklyEmails } from "../controllers/emailController.js";

const weeklyJob = new CronJob(
  "0 9 * * 1", // every Monday 9:00 AM
  async () => {
    await sendWeeklyEmails({ query: {}, body: {} }, { json: console.log });
  },
  null,
  false,
  "Asia/Kolkata"
);

export default weeklyJob;
