// import nodemailer from "nodemailer";

// export const sendSummaryEmail = async (to, subject, html) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: "smtp-relay.brevo.com",
//       port: 587,
//       auth: {
//         user: process.env.BREVO_EMAIL,
//         pass: process.env.BREVO_SMTP_KEY,
//       },
//     });

//     const info = await transporter.sendMail({
//       from: `"WalletWise" <${process.env.BREVO_EMAIL}>`,
//       to,
//       subject,
//       html,
//     });

//     console.log("✅ Email sent:", info.messageId);
//   } catch (error) {
//     console.error("❌ Email send error:", error.message);
//   }
// };

import axios from "axios";

export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "WalletWise",
          email: process.env.BREVO_SENDER_EMAIL, // your verified Brevo sender email
        },
        to: [
          {
            email: to,
            name: "User", // optional
          },
        ],
        subject,
        htmlContent,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log(
      "✅ Email sent using Brevo API:",
      response.data.messageId || response.data
    );
  } catch (error) {
    if (error.response) {
      console.error("❌ Brevo API Error:", error.response.data);
    } else {
      console.error("❌ Brevo API Request Failed:", error.message);
    }
  }
};
