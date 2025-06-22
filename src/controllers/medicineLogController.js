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

  const now = dayjs();
  const today = now.startOf("day");
  const date = today.toDate();

  try {
    const medicine = await Medicine.findOne({ _id: medicineId, userId });
    if (!medicine)
      return res.status(404).json({ message: "Medicine not found" });

    // Reject if today is outside medicine duration
    const isActive =
      dayjs(medicine.startDate).isBefore(today.add(1, "day")) &&
      dayjs(medicine.endDate).isAfter(today.subtract(1, "day"));
    if (!isActive) {
      return res
        .status(400)
        .json({ message: "Medicine is not scheduled for today" });
    }

    // Disallow time that is not in scheduled times
    if (!medicine.times?.includes(time)) {
      return res
        .status(400)
        .json({ message: "Invalid time for this medicine" });
    }

    // Check if already marked as taken
    const existingLog = await MedicineLog.findOne({
      userId,
      medicineId,
      date,
      time,
    });

    if (existingLog?.taken) {
      return res.status(200).json({
        message: "Already marked as taken",
        log: existingLog,
      });
    }

    // Prevent marking for a past date
    if (dayjs(existingLog?.updatedAt).isBefore(today)) {
      return res
        .status(400)
        .json({ message: "Cannot mark past medicine as taken" });
    }

    // Mark as taken now
    const log = await MedicineLog.findOneAndUpdate(
      { userId, medicineId, date, time },
      { taken: true },
      { upsert: true, new: true }
    );

    // Decrement tablet count only if this is first time marking
    if (!existingLog?.taken && medicine.tabletCount > 0) {
      medicine.tabletCount -= 1;
      await medicine.save();
    }

    res.status(200).json({ message: "Marked as taken", log });
  } catch (error) {
    console.error("Error in markMedicineAsTaken:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medicine logs for a specific date
// @route   GET /api/medicines/logs?date=YYYY-MM-DD
export const getMedicineLogsByDate = async (req, res) => {
  try {
    const userId = req.user._id;
    const date = dayjs(req.query.date || new Date()).startOf("day");
    const weekday = date.day(); // Sunday = 0

    // 1. Get all medicines scheduled for that date
    const medicines = await Medicine.find({
      userId,
      startDate: { $lte: date.toDate() },
      endDate: { $gte: date.toDate() },
      $or: [
        { daysOfWeek: { $exists: false } },
        { daysOfWeek: { $in: [weekday] } },
      ],
    });

    // 2. Get existing logs for the date
    const logs = await MedicineLog.find({
      userId,
      date: date.toDate(),
    });

    // 3. Merge medicine schedules with logs
    const result = [];

    for (const med of medicines) {
      for (const time of med.times || []) {
        const existingLog = logs.find(
          (log) =>
            log.medicineId.toString() === med._id.toString() &&
            log.time === time
        );

        result.push({
          medicineId: med._id,
          medicineName: med.name,
          scheduledTime: time,
          taken: existingLog?.taken || false,
          takenTime: existingLog?.taken ? existingLog.updatedAt : null,
        });
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("getMedicineLogsByDate error:", error);
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

// @desc    Get today's medicine logs with scheduled & taken info
// @route   GET /api/medicines/logs/today
export const getDailyMedicineLog = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = dayjs().startOf("day");
    const weekday = today.day(); // Sunday = 0

    // 1. Get all scheduled medicines for today
    const medicines = await Medicine.find({
      userId,
      startDate: { $lte: today.toDate() },
      endDate: { $gte: today.toDate() },
      $or: [
        { daysOfWeek: { $exists: false } },
        { daysOfWeek: { $in: [weekday] } },
      ],
    });

    // 2. Get existing logs
    const logs = await MedicineLog.find({
      userId,
      date: today.toDate(),
    });

    // 3. Create a lookup map for logs
    const logMap = new Map();
    logs.forEach((log) => {
      logMap.set(`${log.medicineId}-${log.time}`, log);
    });

    // 4. Merge medicine + log info
    const result = medicines.flatMap((med) =>
      (med.times || []).map((time) => {
        const log = logMap.get(`${med._id}-${time}`);
        return {
          medicineId: med._id,
          medicineName: med.name,
          dosage: med.dosage || null,
          notes: med.notes || null,
          scheduledTime: time,
          taken: log?.taken || false,
          takenTime: log?.updatedAt || null,
        };
      })
    );

    // 5. Sort by scheduledTime
    result.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    // 6. Return response
    res.json({
      date: today.format("YYYY-MM-DD"),
      doses: result,
    });
  } catch (error) {
    console.error("Error in getDailyMedicineLog:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlyMedicineLogs = async (req, res) => {
  try {
    const userId = req.user._id;

    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    const targetDate =
      !isNaN(year) && !isNaN(month) ? dayjs(`${year}-${month}-01`) : dayjs();

    const start = targetDate.startOf("month").toDate();
    const end = targetDate.endOf("month").toDate();

    const logs = await MedicineLog.find({
      userId,
      date: { $gte: start, $lte: end },
    }).populate("medicineId", "name");

    const grouped = {};

    logs.forEach((log) => {
      // Handle case where medicine has been deleted
      if (!log.medicineId) return;

      const dateStr = dayjs(log.date).format("YYYY-MM-DD");

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }

      grouped[dateStr].push({
        medicineId: log.medicineId._id,
        medicineName: log.medicineId.name,
        scheduledTime: log.time,
        takenTime: log?.taken ? log.updatedAt : null,
        taken: log.taken,
      });
    });

    res.json(grouped);
  } catch (error) {
    console.error("Error in getMonthlyMedicineLogs:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve logs", error: error.message });
  }
};

export const createLogsForMedicine = async (medicine) => {
  const { startDate, endDate, times, daysOfWeek, _id, userId } = medicine;

  const logs = [];
  let date = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).endOf("day");

  while (date.isBefore(end)) {
    const weekday = date.day(); // 0=Sun ... 6=Sat

    if (!daysOfWeek || daysOfWeek.includes(weekday)) {
      times.forEach((time) => {
        logs.push({
          userId,
          medicineId: _id,
          date: date.toDate(),
          time,
          taken: false,
        });
      });
    }

    date = date.add(1, "day");
  }

  if (logs.length > 0) {
    await MedicineLog.insertMany(logs);
  }
};

export const updateFutureLogsForMedicine = async (medicine) => {
  const now = dayjs().startOf("day");
  const { startDate, endDate, times, daysOfWeek, _id, userId } = medicine;

  // 1. Remove only future, untaken logs
  await MedicineLog.deleteMany({
    medicineId: _id,
    userId,
    date: { $gte: now.toDate() },
    taken: false,
  });

  // 2. Recreate logs from today onwards
  const logs = [];
  let date = dayjs.max(dayjs(startDate), now);
  const end = dayjs(endDate).endOf("day");

  while (date.isBefore(end)) {
    const weekday = date.day();
    if (!daysOfWeek || daysOfWeek.includes(weekday)) {
      times.forEach((time) => {
        logs.push({
          userId,
          medicineId: _id,
          date: date.toDate(),
          time,
          taken: false,
        });
      });
    }
    date = date.add(1, "day");
  }

  if (logs.length > 0) {
    await MedicineLog.insertMany(logs);
  }
};
