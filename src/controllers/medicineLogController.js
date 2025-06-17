import MedicineLog from "../models/medicineLogModel.js";
import Medicine from "../models/medicineModel.js";
import dayjs from "dayjs";

// @desc    Mark medicine as taken for a specific time
// @route   POST /api/medicines/:id/mark-taken
// @access  Private
export const markMedicineAsTaken = async (req, res) => {
  const userId = req.user._id;
  const medicineId = req.params.id;
  const { time } = req.body;

  if (!time) return res.status(400).json({ message: "Time is required" });

  const date = dayjs().startOf("day").toDate(); // just date portion

  try {
    const medicine = await Medicine.findOne({ _id: medicineId, userId });
    if (!medicine)
      return res.status(404).json({ message: "Medicine not found" });

    const log = await MedicineLog.findOneAndUpdate(
      { userId, medicineId, date, time },
      { taken: true },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Marked as taken", log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medicine logs for a specific date
// @route   GET /api/medicines/logs?date=YYYY-MM-DD
export const getMedicineLogsByDate = async (req, res) => {
  try {
    const userId = req.user._id;
    const date = dayjs(req.query.date || new Date())
      .startOf("day")
      .toDate();

    const logs = await MedicineLog.find({ userId, date }).populate(
      "medicineId",
      "name dosage"
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark multiple medicines as taken
// @route   POST /api/medicines/mark-bulk
// @body    [{ medicineId, time }]
export const markMultipleAsTaken = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = dayjs().startOf("day").toDate();
    const entries = req.body;

    const results = await Promise.all(
      entries.map(async ({ medicineId, time }) => {
        return await MedicineLog.findOneAndUpdate(
          { userId, medicineId, date: today, time },
          { taken: true },
          { upsert: true, new: true }
        );
      })
    );

    res.json({ message: "Marked multiple doses", results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
