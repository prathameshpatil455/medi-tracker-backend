import { CronJob } from "cron";
import { sendDailyMotivation } from "../utils/sendDailyMotivation.js";

const motivationJob = new CronJob(
  "0 8,11,14,17,20 * * *",
  async () => {
    console.log("🚀 Running daily motivation job...");
    await sendDailyMotivation();
  },
  null,
  false, // start the job automatically
  "Asia/Kolkata"
);

export default motivationJob;
