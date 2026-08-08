const express = require('express');
const Unit = require('../models/Unit');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const emit = (req, event, payload) => req.app.locals.io?.emit(event, payload);
const allowed = ['unitId', 'type', 'status', 'sectorName', 'location', 'lat', 'lng'];
const cleanPayload = (body) => Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

router.get('/', auth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    res.json(await Unit.find(filter).sort({ updatedAt: -1 }));
  } catch (error) { next(error); }
});

router.post('/', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const unit = await Unit.create(cleanPayload(req.body));
    emit(req, 'unit:created', unit);
    res.status(201).json(unit);
  } catch (error) { next(error); }
});

router.put('/:id', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, cleanPayload(req.body), { new: true, runValidators: true });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    emit(req, 'unit:updated', unit);
    res.json(unit);
  } catch (error) { next(error); }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    emit(req, 'unit:deleted', { _id: req.params.id });
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
