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

export const getDailyMedicineLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = dayjs().startOf("day");
    const weekday = today.day();

    const medicines = await Medicine.find({
      userId,
      startDate: { $lte: today.toDate() },
      endDate: { $gte: today.toDate() },
      $or: [
        { daysOfWeek: { $exists: false } },
        { daysOfWeek: { $in: [weekday] } },
      ],
    });

    const logs = await MedicineLog.find({
      userId,
      date: today.toDate(),
    });

    const logMap = new Map();
    logs.forEach((log) => {
      logMap.set(`${log.medicineId}-${log.time}`, log);
    });

    const result = medicines.flatMap((med) =>
      med.times.map((time) => {
        const log = logMap.get(`${med._id}-${time}`);
        return {
          medicineId: med._id,
          medicineName: med.name,
          scheduledTime: time,
          takenTime: log?.updatedAt || null,
          taken: log?.taken || false,
        };
      })
    );

    res.json({
      date: today.format("YYYY-MM-DD"),
      doses: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyMedicineLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    const target =
      !isNaN(year) && !isNaN(month) ? dayjs(`${year}-${month}-01`) : dayjs();

    const start = target.startOf("month").toDate();
    const end = target.endOf("month").toDate();

    const logs = await MedicineLog.find({
      userId,
      date: { $gte: start, $lte: end },
    }).populate("medicineId", "name");

    const grouped = {};

    logs.forEach((log) => {
      const dateStr = dayjs(log.date).format("YYYY-MM-DD");
      if (!grouped[dateStr]) grouped[dateStr] = [];

      grouped[dateStr].push({
        medicineId: log.medicineId._id,
        medicineName: log.medicineId.name,
        scheduledTime: log.time,
        takenTime: log.updatedAt,
        taken: log.taken,
      });
    });

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
