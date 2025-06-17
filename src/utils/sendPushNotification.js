// utils/sendPushNotification.js
import axios from "axios";

export async function sendNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: {},
  };

  try {
    const res = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      message,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    console.log("✅ Push sent to:", expoPushToken, res.data);
  } catch (err) {
    console.error("❌ Push error:", err.response?.data || err.message);
  }
}
