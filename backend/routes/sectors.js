const express = require('express');
const Sector = require('../models/Sector');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const emit = (req, event, payload) => req.app.locals.io?.emit(event, payload);

router.get('/', auth, async (req, res, next) => {
  try {
    const sectors = await Sector.find().sort({ name: 1 }).populate('activeIncidents');
    res.json(sectors);
  } catch (error) { next(error); }
});

router.post('/', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const sector = await Sector.create(req.body);
    await sector.populate('activeIncidents');
    emit(req, 'sector:created', sector);
    res.status(201).json(sector);
  } catch (error) { next(error); }
});

router.put('/:id', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const sector = await Sector.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('activeIncidents');
    if (!sector) return res.status(404).json({ message: 'Sector not found' });
    emit(req, 'sector:updated', sector);
    res.json(sector);
  } catch (error) { next(error); }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const sector = await Sector.findByIdAndDelete(req.params.id);
    if (!sector) return res.status(404).json({ message: 'Sector not found' });
    emit(req, 'sector:deleted', { _id: req.params.id });
    res.json({ message: 'Sector deleted successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
