import Medicine from "../models/medicineModel.js";
import dayjs from "dayjs";

// @desc    Get all medicines for a user
export const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.user._id });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new medicine
export const addMedicine = async (req, res) => {
  const {
    name,
    dosage,
    frequencyPerDay,
    times,
    startDate,
    endDate,
    daysOfWeek,
    notes,
    tabletCount, // NEW
  } = req.body;

  try {
    const newMedicine = new Medicine({
      userId: req.user._id,
      name,
      dosage,
      frequencyPerDay,
      times,
      startDate,
      endDate,
      daysOfWeek,
      notes,
      tabletCount, // NEW
    });

    const saved = await newMedicine.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const updated = await Medicine.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, // tabletCount can be included in the request body
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Medicine not found" });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete medicine
export const deleteMedicine = async (req, res) => {
  try {
    const deleted = await Medicine.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!deleted)
      return res.status(404).json({ message: "Medicine not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medicines scheduled for today
export const getMedicinesForToday = async (req, res) => {
  try {
    const today = dayjs().startOf("day");
    const weekday = today.day(); // 0 = Sunday ... 6 = Saturday

    const medicines = await Medicine.find({
      userId: req.user._id,
      startDate: { $lte: today.toDate() },
      endDate: { $gte: today.toDate() },
      $or: [
        { daysOfWeek: { $exists: false } }, // daily meds
        { daysOfWeek: { $in: [weekday] } }, // weekly specific
      ],
    });

    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medicines scheduled within current month
export const getMedicinesForMonth = async (req, res) => {
  try {
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");

    const medicines = await Medicine.find({
      userId: req.user._id,
      startDate: { $lte: endOfMonth.toDate() },
      endDate: { $gte: startOfMonth.toDate() },
    });

    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!medicine) return res.status(404).json({ message: "Not found" });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get percentage of medicine doses taken
// @route   GET /api/medicines/progress
export const getMedicineProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const logs = await MedicineLog.find({ userId });

    const total = logs.length;
    const taken = logs.filter((log) => log.taken).length;
    const percentage = total ? ((taken / total) * 100).toFixed(2) : 0;

    res.json({
      totalDoses: total,
      takenDoses: taken,
      progressPercent: percentage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming doses in next X hours
// @route   GET /api/medicines/upcoming?hours=4
export const getUpcomingDoses = async (req, res) => {
  const hours = Number(req.query.hours || 4);
  const now = dayjs();
  const until = now.add(hours, "hour");
  const weekday = now.day();

  try {
    const medicines = await Medicine.find({
      userId: req.user._id,
      startDate: { $lte: now.toDate() },
      endDate: { $gte: now.toDate() },
      $or: [
        { daysOfWeek: { $exists: false } },
        { daysOfWeek: { $in: [weekday] } },
      ],
    });

    // Filter times within next X hours
    const upcoming = [];

    medicines.forEach((med) => {
      med.times?.forEach((time) => {
        const timeToday = dayjs(`${now.format("YYYY-MM-DD")}T${time}`);
        if (timeToday.isAfter(now) && timeToday.isBefore(until)) {
          upcoming.push({
            medicineId: med._id,
            name: med.name,
            dosage: med.dosage,
            time,
          });
        }
      });
    });

    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Show medicines with low tablet stock (less than 2 days left)
// @route   GET /api/medicines/refill-warning
export const getRefillWarnings = async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.user._id });

    const warnings = medicines
      .map((med) => {
        const daysLeft =
          med.tabletCount && med.frequencyPerDay
            ? Math.floor(med.tabletCount / med.frequencyPerDay)
            : null;

        return {
          medicineId: med._id,
          name: med.name,
          tabletCount: med.tabletCount || 0,
          daysLeft,
          refillNeeded: daysLeft !== null && daysLeft < 2,
        };
      })
      .filter((m) => m.refillNeeded);

    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
