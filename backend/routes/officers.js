const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Officer = require('../models/Officer');
const AuditLog = require('../models/AuditLog');
// Normalize camelCase frontend input → snake_case DB fields
const normalizeOfficerInput = (body) => {
  const data = { ...body };
  if (data.zoneId !== undefined) { data.current_zone_id = data.zoneId || null; delete data.zoneId; }
  if (data.fatigueScore !== undefined) { data.fatigue_score = data.fatigueScore; delete data.fatigueScore; }
  if (data.lastShiftEnd !== undefined) { data.last_shift_end = data.lastShiftEnd; delete data.lastShiftEnd; }
  return data;
};

// Helper to emit socket events
const emit = (req, event, data) => {
  const io = req.app.locals.io;
  if (io) io.emit(event, data);
};

// GET /stats
router.get('/stats', auth, async (req, res, next) => {
  try {
    const rankStats = await Officer.aggregate([
      { $group: { _id: '$rank', count: { $sum: 1 } } }
    ]);
    const statusStats = await Officer.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ rank: rankStats, status: statusStats });
  } catch (err) { next(err); }
});

// GET /
router.get('/', auth, async (req, res, next) => {
  try {
    const { rank, status, zone_id } = req.query;
    const filter = {};
    if (rank) filter.rank = rank;
    if (status) filter.status = status;
    if (zone_id) filter.current_zone_id = zone_id;
    
    const officers = await Officer.find(filter).populate('current_zone_id', 'name');
    res.json(officers);
  } catch (err) { next(err); }
});

// GET /:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const officer = await Officer.findById(req.params.id).populate('current_zone_id', 'name');
    if (!officer) return res.status(404).json({ message: 'Officer not found' });
    res.json(officer);
  } catch (err) { next(err); }
});

// POST /
router.post('/', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const officerData = normalizeOfficerInput(req.body);
    const officer = await Officer.create(officerData);
    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'create_officer',
      after_state: officer.toObject()
    });
    emit(req, 'officer:created', officer);
    res.status(201).json(officer);
  } catch (err) { next(err); }
});

// PUT /:id
router.put('/:id', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const { __version, ...rawData } = req.body;
    const updateData = normalizeOfficerInput(rawData);
    if (__version === undefined) {
      return res.status(400).json({ message: 'Must provide __version for concurrency control' });
    }

    const beforeState = await Officer.findById(req.params.id);
    if (!beforeState) return res.status(404).json({ message: 'Officer not found' });

    const officer = await Officer.findOneAndUpdate(
      { _id: req.params.id, __version },
      { $set: updateData, $inc: { __version: 1 } },
      { new: true, runValidators: true }
    );

    if (!officer) {
      return res.status(409).json({ message: 'Conflict: Document was modified by another user or does not exist.' });
    }

    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'update_officer',
      before_state: beforeState.toObject(),
      after_state: officer.toObject()
    });

    emit(req, 'officer:updated', officer);
    res.json(officer);
  } catch (err) { next(err); }
});

// DELETE /:id
router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const officer = await Officer.findByIdAndDelete(req.params.id);
    if (!officer) return res.status(404).json({ message: 'Officer not found' });
    
    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'delete_officer',
      before_state: officer.toObject()
    });

    emit(req, 'officer:deleted', { _id: req.params.id });
    res.json({ message: 'Officer deleted successfully' });
  } catch (err) { next(err); }
});

// POST /bulk
router.post('/bulk', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) return res.status(400).json({ message: 'Expected an array of officers' });
    const officers = await Officer.insertMany(req.body);
    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'bulk_create_officers',
      after_state: { count: officers.length }
    });
    // Maybe emit bulk event
    emit(req, 'officers:bulk_created', { count: officers.length });
    res.status(201).json(officers);
  } catch (err) { next(err); }
});

module.exports = router;
