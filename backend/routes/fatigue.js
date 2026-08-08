const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Officer = require('../models/Officer');
const Shift = require('../models/Shift');

// Helper to get p90 with bounds safety
const getP90 = (officers) => {
  if (officers.length === 0) return 0;
  const sorted = [...officers].sort((a, b) => (a.fatigue_score || 0) - (b.fatigue_score || 0));
  const p90Index = Math.min(Math.floor(sorted.length * 0.9), sorted.length - 1);
  return sorted[p90Index].fatigue_score || 0;
};

const FATIGUE_MULTIPLIERS = {
  morning: 1.0,
  evening: 1.0,
  night: 1.5,
};
const BASE_FATIGUE_PER_SHIFT = 10;
const MAX_FATIGUE = 200; // Cap to prevent unbounded growth
const DAILY_DECAY = 5;   // Natural recovery per day

// GET /dashboard
router.get('/dashboard', auth, async (req, res, next) => {
  try {
    const officers = await Officer.find({ status: 'active' }).sort({ fatigue_score: -1 });
    const p90 = getP90(officers);
    const highRiskCount = officers.filter(o => (o.fatigue_score || 0) >= p90 && (o.fatigue_score || 0) > 0).length;

    // Distribution histogram
    const histogram = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0, '100+': 0
    };
    officers.forEach(o => {
      const s = o.fatigue_score || 0;
      if (s <= 20) histogram['0-20']++;
      else if (s <= 40) histogram['21-40']++;
      else if (s <= 60) histogram['41-60']++;
      else if (s <= 80) histogram['61-80']++;
      else if (s <= 100) histogram['81-100']++;
      else histogram['100+']++;
    });

    res.json({
      officers: officers.slice(0, 100), // Top 100
      p90_threshold: p90,
      high_risk_count: highRiskCount,
      total_officers: officers.length,
      histogram
    });
  } catch (err) { next(err); }
});

// POST /recalculate — recompute fatigue from shift data with correct multipliers
router.post('/recalculate', auth, async (req, res, next) => {
  try {
    const officers = await Officer.find();
    const shifts = await Shift.find().sort({ date: 1 });

    // Group shifts by officer
    const officerShifts = {};
    shifts.forEach(shift => {
      shift.assigned_officers.forEach(id => {
        const oid = id.toString();
        if (!officerShifts[oid]) officerShifts[oid] = [];
        officerShifts[oid].push({
          type: shift.shift_type,
          date: shift.date,
        });
      });
    });

    // Calculate how many unique days of shifts exist for decay calculation
    const allDates = new Set();
    shifts.forEach(s => allDates.add(new Date(s.date).toISOString().split('T')[0]));
    const totalDays = allDates.size;

    let updated = 0;
    for (const officer of officers) {
      const os = officerShifts[officer._id.toString()] || [];
      let score = 0;

      // Add fatigue for each shift with correct multipliers
      os.forEach(({ type }) => {
        const multiplier = FATIGUE_MULTIPLIERS[type] || 1.0;
        score += multiplier * BASE_FATIGUE_PER_SHIFT;
      });

      // Apply daily natural decay (recovery)
      score = Math.max(0, score - (totalDays * DAILY_DECAY));

      // Cap fatigue
      score = Math.min(MAX_FATIGUE, score);

      if (officer.fatigue_score !== score) {
        officer.fatigue_score = score;
        await officer.save();
        updated++;
      }
    }

    res.json({ message: `Fatigue recalculated for ${updated} officers`, updated, totalDays });
  } catch (err) { next(err); }
});

// GET /high-risk
router.get('/high-risk', auth, async (req, res, next) => {
  try {
    const officers = await Officer.find({ status: 'active' });
    const p90 = getP90(officers);
    const highRisk = officers
      .filter(o => (o.fatigue_score || 0) >= p90 && (o.fatigue_score || 0) > 0)
      .sort((a, b) => (b.fatigue_score || 0) - (a.fatigue_score || 0));
    res.json(highRisk);
  } catch (err) { next(err); }
});

module.exports = router;
