import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    dosage: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    frequencyPerDay: { type: Number }, // e.g., 2 times a day
    times: [{ type: String }], // e.g., ["08:00", "20:00"]
    daysOfWeek: [{ type: Number }], // 0 = Sunday, 6 = Saturday (for weekly frequency)
    notes: { type: String },
    tabletCount: { type: Number, default: 0 }, // total tablets user has
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);
