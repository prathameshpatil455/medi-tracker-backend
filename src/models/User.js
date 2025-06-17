import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    expoPushToken: { type: String, default: null },
    userImage: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
