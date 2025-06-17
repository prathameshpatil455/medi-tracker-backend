import mongoose from "mongoose";
import User from "../models/User.js";
import { sendNotification } from "./sendPushNotification.js";
import getRandomMessage from "./messages.js";

export const sendDailyMotivation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ expoPushToken: { $ne: null } });

    for (const user of users) {
      const message = getRandomMessage();
      await sendNotification(user.expoPushToken, "WalletWise 💰", message);
    }

    console.log("✅ Daily motivation push completed.");
  } catch (error) {
    console.error("❌ Error in daily motivation job:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};
