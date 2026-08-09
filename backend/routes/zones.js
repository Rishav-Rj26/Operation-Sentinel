const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Zone = require('../models/Zone');
const Officer = require('../models/Officer');
const AuditLog = require('../models/AuditLog');
const { resolveDeficit } = require('../lib/resolutionEngine');
const { calculateZScore, distributeForce } = require('../lib/operationalLogic');
const { simulateMassAbsence } = require('../lib/massAbsence');

// Helper to emit socket events
const emit = (req, event, data) => {
  const io = req.app.locals.io;
  if (io) io.emit(event, data);
};

// Normalize camelCase frontend input → snake_case DB fields
const normalizeZoneInput = (body) => {
  const data = { ...body };
  if (data.sizeScore !== undefined) { data.size_score = data.sizeScore; delete data.sizeScore; }
  if (data.densityScore !== undefined) { data.density_score = data.densityScore; delete data.densityScore; }
  if (data.adjacentZones !== undefined) { data.adjacency = data.adjacentZones; delete data.adjacentZones; }
  if (data.safeThreshold !== undefined) { data.safe_threshold = data.safeThreshold; delete data.safeThreshold; }
  // Auto-compute zscore if scores are present
  if (data.size_score !== undefined && data.density_score !== undefined) {
    data.zscore = calculateZScore(data.size_score, data.density_score);
  }
  return data;
};

// GET all zones
router.get('/', auth, async (req, res, next) => {
  try {
    const zones = await Zone.find().populate('adjacency', 'name');
    res.json(zones);
  } catch (err) { next(err); }
});

// POST new zone
router.post('/', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const zoneData = normalizeZoneInput(req.body);
    const zone = await Zone.create(zoneData);
    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'create_zone',
      after_state: zone.toObject()
    });
    emit(req, 'zone:created', zone);
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

// PUT update zone (with OCC)
router.put('/:id', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const { __version, ...rawData } = req.body;
    const updateData = normalizeZoneInput(rawData);

    if (__version === undefined) {
      return res.status(400).json({ message: 'Must provide __version for concurrency control' });
    }

    const beforeState = await Zone.findById(req.params.id);
    if (!beforeState) return res.status(404).json({ message: 'Zone not found' });

    let zone = await Zone.findOneAndUpdate(
      { _id: req.params.id, __version },
      { $set: updateData, $inc: { __version: 1 } },
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(409).json({ message: 'Conflict: Document was modified by another user or does not exist.' });
    }

    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'update_zone',
      before_state: beforeState.toObject(),
      after_state: zone.toObject()
    });

    let dynamicLoad = null;
    // Check if D increased
    if (zone.density_score > beforeState.density_score) {
      zone.zscore = calculateZScore(zone.size_score, zone.density_score);
      await zone.save();

      const allZones = await Zone.find();
      const allActive = await Officer.countDocuments({ status: 'active' });
      const { assignments } = distributeForce(allZones, allActive, 0.15);
      const assignment = assignments.find(a => a.zoneId.toString() === zone._id.toString());
      const newRequired = assignment ? assignment.headcount : 0;
      
      const currentDeployed = await Officer.countDocuments({ current_zone_id: zone._id, status: 'active' });
      const deltaT = newRequired - currentDeployed;

      if (deltaT > 0) {
        const allOfficers = await Officer.find();
        const incident = await resolveDeficit(zone, allZones, allOfficers, deltaT);
        dynamicLoad = {
          required: newRequired,
          currentDeployed,
          deltaT,
          status: incident.status,
          resolutionSteps: incident.resolution_steps_taken,
          incidentId: incident._id,
        };
        emit(req, 'zone:deficit', { zone_id: zone._id, deltaT });
        if (incident.status === 'escalated') {
          emit(req, 'zone:alert', incident);
        }
      } else {
        dynamicLoad = { required: newRequired, currentDeployed, deltaT: 0, status: 'resolved', resolutionSteps: [] };
      }
    }

    emit(req, 'zone:updated', zone);
    res.json({ ...zone.toJSON(), dynamicLoad });
  } catch (err) { next(err); }
});

// DELETE zone
router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const beforeState = await Zone.findById(req.params.id);
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    await Zone.updateMany(
      { adjacency: req.params.id },
      { $pull: { adjacency: req.params.id } }
    );

    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'delete_zone',
      before_state: beforeState ? beforeState.toObject() : null
    });

    emit(req, 'zone:deleted', { _id: req.params.id });
    res.json({ message: 'Zone deleted successfully' });
  } catch (err) { next(err); }
});

// POST /mass-absence
router.post('/:id/mass-absence', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const percentage = req.body.percentage || 0.10;
    const result = await simulateMassAbsence(req.params.id, percentage);
    
    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'simulate_mass_absence',
      after_state: { zone_id: req.params.id, percentage, result }
    });
    
    if (result.incident && result.incident.status === 'escalated') {
      emit(req, 'zone:alert', result.incident);
    }
    
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
