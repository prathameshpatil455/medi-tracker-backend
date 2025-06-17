import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js"; // adjust path as needed

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Directly use DiceBear avatar URL with name as seed
    const avatarUrl = `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(
      name
    )}`;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      userImage: avatarUrl,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      // token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // If userImage is missing, set it
    if (!user.userImage) {
      const avatarUrl = `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(
        user.name
      )}`;
      user.userImage = avatarUrl;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userImage: user.userImage,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateExpoPushToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Expo token is required" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { expoPushToken: token },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Expo push token updated successfully",
      expoPushToken: user.expoPushToken,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUsername = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Username updated successfully",
      name: user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // expires in 5 mins
    await user.save();

    const message = `
      <p>Hello ${user.name || "User"},</p>
      <p>We received a request to reset your MediTracker password.</p>
      <p><strong>Your One-Time Password (OTP): <span style="font-size:18px; color:#1e88e5;">${otp}</span></strong></p>
      <p>This OTP is valid for the next 5 minutes. Please use it to reset your password in the app.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <br />
      <p>Regards,<br />The MediTracker Team</p>
    `;

    await sendEmail(email, "Your MediTracker OTP for Password Reset", message);

    res.json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error("OTP email error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const verifyOtpAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
