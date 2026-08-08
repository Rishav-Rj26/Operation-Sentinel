const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Zone = require('../models/Zone');
const Officer = require('../models/Officer');
const StandbyPool = require('../models/StandbyPool');
const Shift = require('../models/Shift');
const Sector = require('../models/Sector');
const Unit = require('../models/Unit');
const Incident = require('../models/Incident');
const AuditLog = require('../models/AuditLog');
const { calculateZScore } = require('../lib/operationalLogic');
const { generateRoster } = require('../lib/scheduler');

const emit = (req, event, data) => req.app.locals.io?.emit(event, data);

// Indian first/last names for realistic demo data
const FIRST_NAMES = [
  'Rajesh', 'Amit', 'Suresh', 'Priya', 'Anil', 'Vikram', 'Deepak', 'Sunita',
  'Manoj', 'Kavita', 'Rakesh', 'Sanjay', 'Pooja', 'Ravi', 'Neha', 'Ashok',
  'Meena', 'Ramesh', 'Anjali', 'Vijay', 'Nisha', 'Ajay', 'Geeta', 'Sunil',
  'Kiran', 'Dinesh', 'Swati', 'Mohan', 'Rekha', 'Pramod', 'Anita', 'Ganesh',
  'Lata', 'Prakash', 'Sapna', 'Yogesh', 'Seema', 'Naresh', 'Asha', 'Bharat',
  'Usha', 'Harish', 'Pushpa', 'Girish', 'Rita', 'Mahesh', 'Kamla', 'Pankaj',
  'Shobha', 'Tarun', 'Jyoti', 'Manish', 'Radha', 'Arun', 'Madhuri', 'Rohit'
];
const LAST_NAMES = [
  'Kumar', 'Sharma', 'Singh', 'Verma', 'Gupta', 'Yadav', 'Patel', 'Tiwari',
  'Mishra', 'Chauhan', 'Pandey', 'Joshi', 'Mehta', 'Reddy', 'Nair', 'Das',
  'Malhotra', 'Saxena', 'Bhatia', 'Aggarwal', 'Pillai', 'Rao', 'Chopra', 'Dubey'
];

const randomName = () => `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;

// POST /seed — comprehensive demo data
router.post('/seed', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const scale = req.body.scale || 'micro'; // 'micro' = 6 zones, 'macro' = 40 zones

    // ── Clear existing data ──────────────────────────────
    await Promise.all([
      Zone.deleteMany({}),
      Officer.deleteMany({}),
      StandbyPool.deleteMany({}),
      Shift.deleteMany({}),
    ]);

    // ── 1. Create Zones ─────────────────────────────────
    const zoneSeeds = scale === 'macro' ? generateMacroZones() : [
      { name: 'North Gate',      size_score: 7, density_score: 9 },
      { name: 'South Market',    size_score: 8, density_score: 6 },
      { name: 'East Temple',     size_score: 5, density_score: 10 },
      { name: 'West Park',       size_score: 6, density_score: 3 },
      { name: 'Central Plaza',   size_score: 9, density_score: 7 },
      { name: 'River Bridge',    size_score: 4, density_score: 2 },
    ];

    // Compute zscores
    zoneSeeds.forEach(z => {
      z.zscore = calculateZScore(z.size_score, z.density_score);
      z.safe_threshold = Math.max(1, Math.floor(z.zscore));
    });

    const zones = await Zone.insertMany(zoneSeeds);

    // Set adjacencies (connect each zone to its neighbors in a ring + cross links)
    for (let i = 0; i < zones.length; i++) {
      const adjacentIds = [];
      if (i > 0) adjacentIds.push(zones[i - 1]._id);
      if (i < zones.length - 1) adjacentIds.push(zones[i + 1]._id);
      // Cross-connect first to last for ring topology
      if (i === 0 && zones.length > 2) adjacentIds.push(zones[zones.length - 1]._id);
      if (i === zones.length - 1 && zones.length > 2) adjacentIds.push(zones[0]._id);

      zones[i].adjacency = adjacentIds;
      await zones[i].save();
    }

    // ── 2. Create Officers ──────────────────────────────
    // Rank distribution matching real-world force composition
    const rankDistribution = [
      { rank: 'DGP',           count: 1  },  // Command — non-deployable
      { rank: 'ADGP',          count: 1  },
      { rank: 'IG',            count: 1  },
      { rank: 'DIG',           count: 2  },  // Strategic oversight
      { rank: 'SP',            count: 3  },
      { rank: 'DSP',           count: 4  },  // Zone managers
      { rank: 'ASP',           count: 4  },
      { rank: 'Inspector',     count: 6  },
      { rank: 'SI',            count: 10 },  // Field ranks
      { rank: 'ASI',           count: 12 },
      { rank: 'HeadConstable', count: 20 },
      { rank: 'Constable',     count: 40 },
    ];

    if (scale === 'macro') {
      // Scale up for 40 zones
      rankDistribution.forEach(r => {
        if (['SI', 'ASI', 'HeadConstable', 'Constable'].includes(r.rank)) r.count *= 5;
        if (['DSP', 'ASP', 'Inspector'].includes(r.rank)) r.count *= 3;
        if (['DIG', 'SP'].includes(r.rank)) r.count *= 2;
      });
    }

    const officerDocs = [];
    for (const { rank, count } of rankDistribution) {
      for (let i = 0; i < count; i++) {
        officerDocs.push({
          name: randomName(),
          rank,
          status: 'active',
          fatigue_score: Math.floor(Math.random() * 50), // Varied fatigue for demo
          current_zone_id: null,
          last_shift_end: null,
        });
      }
    }

    const officers = await Officer.insertMany(officerDocs);
    const totalOfficers = officers.length;

    // ── 3. Reserve 15% as Standby ───────────────────────
    const standbyCount = Math.ceil(totalOfficers * 0.15);
    const standbyOfficers = officers
      .filter(o => ['SI', 'ASI', 'HeadConstable', 'Constable'].includes(o.rank))
      .slice(0, standbyCount);

    for (const so of standbyOfficers) {
      so.status = 'standby';
      await Officer.findByIdAndUpdate(so._id, { status: 'standby' });
    }

    // Build rank breakdown
    const rankBreakdown = {};
    standbyOfficers.forEach(o => {
      rankBreakdown[o.rank] = (rankBreakdown[o.rank] || 0) + 1;
    });

    await StandbyPool.create({
      officers: standbyOfficers.map(o => o._id),
      rank_breakdown: rankBreakdown,
      total_reserved: standbyCount,
    });

    // ── 4. Generate 7-day Roster ─────────────────────────
    const refreshedZones = await Zone.find();
    const activeOfficers = await Officer.find({ status: 'active' });
    const shifts = generateRoster(refreshedZones, activeOfficers, 7);

    if (shifts.length > 0) {
      await Shift.insertMany(shifts);
    }

    // ── 5. Seed legacy models (Sectors/Units/Incidents) ──
    const latitude = Number(req.body.baseLat) || 28.6139;
    const longitude = Number(req.body.baseLng) || 77.209;

    const sectorSeeds = [
      ['Sector A1', 82, 0.012, -0.01], ['Sector B2', 64, 0.008, 0.014],
      ['Sector C3', 42, -0.01, 0.008], ['Sector D4', 25, -0.013, -0.006],
      ['Sector E5', 55, 0.003, -0.017], ['Sector F6', 18, -0.007, 0.019],
    ];
    await Promise.all(sectorSeeds.map(([name, intensity, latOff, lngOff]) =>
      Sector.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, intensity, latitude: latitude + latOff, longitude: longitude + lngOff } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    ));

    const unitSeeds = [
      ['101', 'Patrol', 'Available', 'Sector A1'],
      ['102', 'Response', 'En Route', 'Sector A1'],
      ['103', 'Patrol', 'Patrolling', 'Sector B2'],
      ['104', 'Tactical', 'On Scene', 'Sector C3'],
      ['105', 'Traffic', 'Available', 'Sector D4'],
      ['106', 'K-9', 'Standby', 'Sector E5'],
    ];
    await Promise.all(unitSeeds.map(([unitId, type, status, sectorName], index) =>
      Unit.findOneAndUpdate(
        { unitId },
        { $setOnInsert: { unitId, type, status, sectorName, location: `${sectorName} command post`, lat: latitude + ((index - 3) * 0.004), lng: longitude + ((index % 3) * 0.006) } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    ));

    const incidentSeeds = [
      ['Armed robbery in progress', 'critical', 'responding', 'Sector A1'],
      ['Traffic collision', 'high', 'reported', 'Sector B2'],
      ['Public disturbance', 'medium', 'responding', 'Sector C3'],
    ];
    await Promise.all(incidentSeeds.map(([title, severity, status, sectorName], index) =>
      Incident.findOneAndUpdate(
        { title },
        { $setOnInsert: { title, severity, status, sectorName, location: `${sectorName} central area`, lat: latitude + ((index - 1) * 0.007), lng: longitude + ((index - 1) * 0.009) } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    ));

    await AuditLog.create({
      actor: req.user?.username || 'system',
      action: 'comprehensive_seed',
      after_state: {
        zones: zones.length,
        officers: totalOfficers,
        standby: standbyCount,
        shifts: shifts.length,
        scale,
      }
    });

    emit(req, 'data:seeded', { scale });

    res.status(201).json({
      message: `Demo data seeded (${scale} scale)`,
      counts: {
        zones: zones.length,
        officers: totalOfficers,
        standby: standbyCount,
        shifts: shifts.length,
        sectors: sectorSeeds.length,
        units: unitSeeds.length,
        incidents: incidentSeeds.length,
      }
    });
  } catch (error) { next(error); }
});

// Helper: generate 40-zone macro config
function generateMacroZones() {
  const zoneNames = [];
  const prefixes = ['North', 'South', 'East', 'West', 'Central', 'Outer', 'Inner', 'Upper'];
  const suffixes = ['Gate', 'Market', 'Temple', 'Park', 'Plaza', 'Bridge', 'Colony', 'Station', 'Circle', 'Road'];
  for (const p of prefixes) {
    for (const s of suffixes) {
      zoneNames.push(`${p} ${s}`);
      if (zoneNames.length >= 40) break;
    }
    if (zoneNames.length >= 40) break;
  }
  return zoneNames.map(name => ({
    name,
    size_score: Math.floor(Math.random() * 8) + 2,  // 2-9
    density_score: Math.floor(Math.random() * 9) + 1, // 1-9
  }));
}

module.exports = router;
