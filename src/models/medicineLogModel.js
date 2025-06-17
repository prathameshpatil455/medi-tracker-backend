import mongoose from "mongoose";

const medicineLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // "08:00"
    taken: { type: Boolean, default: false },
  },
  { timestamps: true }
);

medicineLogSchema.index(
  { userId: 1, medicineId: 1, date: 1, time: 1 },
  { unique: true }
);

export default mongoose.model("MedicineLog", medicineLogSchema);
