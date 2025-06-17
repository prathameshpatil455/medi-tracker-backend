import { CronJob } from "cron";
import https from "https";

const job = new CronJob(
  "*/14 * * * *",
  () => {
    console.log("Pinging server...");
    https
      .get(process.env.API_URL, (res) => {
        if (res.statusCode === 200) {
          console.log("API is running");
        } else {
          console.error("API response status:", res.statusCode);
        }
      })
      .on("error", (err) => {
        console.error("HTTP request failed:", err.message);
      });
  },
  null,
  false,
  "Asia/Kolkata"
);

export default job;
