const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Shift = require('../models/Shift');
const Zone = require('../models/Zone');
const Officer = require('../models/Officer');
const AuditLog = require('../models/AuditLog');
const { generateRoster } = require('../lib/scheduler');

// POST /generate
router.post('/generate', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const days = parseInt(req.body.days) || 30;
    const zones = await Zone.find();
    const officers = await Officer.find({ status: 'active' });

    const newShifts = generateRoster(zones, officers, days);

    if (newShifts.length > 0) {
      const minDate = newShifts[0].date;
      const maxDate = newShifts[newShifts.length - 1].date;
      
      // Clear existing shifts in this range to avoid unique constraint errors
      await Shift.deleteMany({
        date: { $gte: minDate, $lte: maxDate }
      });

      await Shift.insertMany(newShifts);

      await AuditLog.create({
        actor: req.user?.username || 'system',
        action: 'generate_roster',
        after_state: { days, shift_count: newShifts.length }
      });
    }

    res.status(201).json({ message: 'Roster generated successfully', shift_count: newShifts.length });
  } catch (err) { next(err); }
});

// GET /roster
router.get('/roster', auth, async (req, res, next) => {
  try {
    const { zone_id, date, shift_type } = req.query;
    const filter = {};
    if (zone_id) filter.zone_id = zone_id;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    }
    if (shift_type) filter.shift_type = shift_type;

    const shifts = await Shift.find(filter).populate('assigned_officers', 'name rank').populate('zone_id', 'name');
    res.json(shifts);
  } catch (err) { next(err); }
});

// GET /roster/:shiftId
router.get('/roster/:shiftId', auth, async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.shiftId)
      .populate('assigned_officers')
      .populate('zone_id');
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json(shift);
  } catch (err) { next(err); }
});

module.exports = router;
