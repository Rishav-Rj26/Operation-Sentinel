const express = require('express');
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { intensityFromSeverity } = require('../lib/operationalLogic');

const router = express.Router();
const emit = (req, event, payload) => req.app.locals.io?.emit(event, payload);
const allowed = ['title', 'description', 'severity', 'status', 'location', 'sectorName', 'lat', 'lng'];
const cleanPayload = (body) => Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

router.get('/', auth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.status) filter.status = req.query.status;
    res.json(await Incident.find(filter).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post('/', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    if (!payload.sectorName) payload.sectorName = payload.location;
    if (payload.lat === undefined || payload.lng === undefined) {
      payload.lat = 28.6139;
      payload.lng = 77.209;
    }
    const incident = await Incident.create(payload);
    emit(req, 'incident:created', incident);
    emit(req, 'incident:priority', { id: incident._id, intensity: intensityFromSeverity(incident.severity) });
    res.status(201).json(incident);
  } catch (error) { next(error); }
});

router.put('/:id', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    if (['resolved', 'closed'].includes(payload.status)) payload.resolvedAt = new Date();
    const incident = await Incident.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    emit(req, 'incident:updated', incident);
    res.json(incident);
  } catch (error) { next(error); }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    emit(req, 'incident:deleted', { _id: req.params.id });
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) { next(error); }
});

module.exports = router;
