const express = require('express');
const Sector = require('../models/Sector');
const Unit = require('../models/Unit');
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const emit = (req, event, payload) => req.app.locals.io?.emit(event, payload);

const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
};

router.get('/status', auth, (req, res) => res.json({ status: 'Optimal' }));

router.get('/stats', auth, async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const activeFilter = { status: { $nin: ['resolved', 'closed'] } };
    const [activeIncidents, unitsDeployed, availableUnits, resolvedToday, currentIncidents, previousIncidents, currentResolved, previousResolved] = await Promise.all([
      Incident.countDocuments(activeFilter),
      Unit.countDocuments({ status: { $in: ['En Route', 'On Scene', 'Patrolling'] } }),
      Unit.countDocuments({ status: 'Available' }),
      Incident.countDocuments({ status: { $in: ['resolved', 'closed'] }, resolvedAt: { $gte: today } }),
      Incident.countDocuments({ ...activeFilter, createdAt: { $gte: today } }),
      Incident.countDocuments({ ...activeFilter, createdAt: { $gte: yesterday, $lt: today } }),
      Incident.countDocuments({ status: { $in: ['resolved', 'closed'] }, resolvedAt: { $gte: today } }),
      Incident.countDocuments({ status: { $in: ['resolved', 'closed'] }, resolvedAt: { $gte: yesterday, $lt: today } }),
    ]);
    res.json({
      activeIncidents,
      unitsDeployed,
      availableUnits,
      resolvedToday,
      responseTime: '8 min',
      incidentTrend: percentChange(currentIncidents, previousIncidents),
      resolvedTrend: percentChange(currentResolved, previousResolved),
    });
  } catch (error) { next(error); }
});

router.get('/analytics', auth, async (req, res, next) => {
  try {
    const [incidents, units, sectors] = await Promise.all([Incident.find(), Unit.find(), Sector.find().populate('activeIncidents')]);
    const severityDistribution = ['low', 'medium', 'high', 'critical'].map((name) => ({ name, value: incidents.filter((incident) => incident.severity === name).length }));
    const unitTypeDistribution = [...new Set(units.map((unit) => unit.type))].map((name) => ({ name, value: units.filter((unit) => unit.type === name).length }));
    const hourlyTrend = Array.from({ length: 12 }, (_, offset) => {
      const start = new Date();
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() - (11 - offset));
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return {
        hour: start.toLocaleTimeString('en-IN', { hour: '2-digit', hour12: true }),
        incidents: incidents.filter((incident) => incident.createdAt >= start && incident.createdAt < end).length,
        resolved: incidents.filter((incident) => incident.resolvedAt && incident.resolvedAt >= start && incident.resolvedAt < end).length,
      };
    });
    const topSectors = sectors.map((sector) => ({
      _id: sector._id,
      name: sector.name,
      intensity: sector.intensity,
      activeIncidents: sector.activeIncidents || 0,
    })).sort((a, b) => b.intensity - a.intensity).slice(0, 8);
    res.json({ severityDistribution, unitTypeDistribution, hourlyTrend, topSectors });
  } catch (error) { next(error); }
});

router.post('/seed', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const latitude = Number(req.body.baseLat) || 28.6139;
    const longitude = Number(req.body.baseLng) || 77.209;
    const sectorSeeds = [
      ['Sector A1', 82, 0.012, -0.01], ['Sector B2', 64, 0.008, 0.014], ['Sector C3', 42, -0.01, 0.008],
      ['Sector D4', 25, -0.013, -0.006], ['Sector E5', 55, 0.003, -0.017], ['Sector F6', 18, -0.007, 0.019],
    ];
    const sectors = await Promise.all(sectorSeeds.map(([name, intensity, latOffset, lngOffset]) => Sector.findOneAndUpdate(
      { name }, { $setOnInsert: { name, intensity, latitude: latitude + latOffset, longitude: longitude + lngOffset } }, { new: true, upsert: true, setDefaultsOnInsert: true }
    )));
    const unitSeeds = [
      ['101', 'Patrol', 'Available', 'Sector A1'], ['102', 'Response', 'En Route', 'Sector A1'], ['103', 'Patrol', 'Patrolling', 'Sector B2'],
      ['104', 'Tactical', 'On Scene', 'Sector C3'], ['105', 'Traffic', 'Available', 'Sector D4'], ['106', 'K-9', 'Standby', 'Sector E5'],
    ];
    await Promise.all(unitSeeds.map(([unitId, type, status, sectorName], index) => Unit.findOneAndUpdate(
      { unitId }, { $setOnInsert: { unitId, type, status, sectorName, location: `${sectorName} command post`, lat: latitude + ((index - 3) * 0.004), lng: longitude + ((index % 3) * 0.006) } }, { new: true, upsert: true, setDefaultsOnInsert: true }
    )));
    const incidentSeeds = [
      ['Armed robbery in progress', 'critical', 'responding', 'Sector A1'], ['Traffic collision', 'high', 'reported', 'Sector B2'], ['Public disturbance', 'medium', 'responding', 'Sector C3'],
    ];
    await Promise.all(incidentSeeds.map(([title, severity, status, sectorName], index) => Incident.findOneAndUpdate(
      { title }, { $setOnInsert: { title, severity, status, sectorName, location: `${sectorName} central area`, lat: latitude + ((index - 1) * 0.007), lng: longitude + ((index - 1) * 0.009) } }, { new: true, upsert: true, setDefaultsOnInsert: true }
    )));
    emit(req, 'data:seeded', { sectorCount: sectors.length });
    res.status(201).json({ message: 'Demo data is ready', counts: { sectors: sectorSeeds.length, units: unitSeeds.length, incidents: incidentSeeds.length } });
  } catch (error) { next(error); }
});

module.exports = router;
