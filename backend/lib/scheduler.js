const { COMMAND_RANKS, STRATEGIC_RANKS, ZONE_MANAGER_RANKS, FIELD_RANKS, REST_HOURS } = require('../constants/ranks');
const { distributeForce } = require('./operationalLogic');
const mongoose = require('mongoose');

const FATIGUE_MULTIPLIERS = {
  morning: 1.0,
  evening: 1.0,
  night: 1.5,
};
const BASE_FATIGUE_PER_SHIFT = 10;

const generateRoster = (zones, officers, days = 30) => {
  // Filter deployable officers
  const excludedRanks = [...COMMAND_RANKS, ...STRATEGIC_RANKS];
  const deployableOfficers = officers.filter(o => !excludedRanks.includes(o.rank) && o.status === 'active');

  const zoneManagers = deployableOfficers.filter(o => ZONE_MANAGER_RANKS.includes(o.rank));
  const fieldOfficers = deployableOfficers.filter(o => FIELD_RANKS.includes(o.rank));

  // Calculate base required headcount per zone
  const totalDeployable = deployableOfficers.length;
  // Use distributeForce to get headcount for each zone
  const { assignments } = distributeForce(zones, totalDeployable, 0.15); // 15% standby
  
  const zoneRequirements = {};
  assignments.forEach(a => {
    zoneRequirements[a.zoneId] = a.headcount;
  });

  const shifts = [];
  
  // Track per-officer state for scheduling
  const officerLastShiftEnd = {};
  const officerFatigue = {};
  deployableOfficers.forEach(o => {
    const oid = o._id.toString();
    officerLastShiftEnd[oid] = o.last_shift_end ? new Date(o.last_shift_end).getTime() : 0;
    officerFatigue[oid] = o.fatigue_score || 0;
  });

  // Build zone adjacency lookup for zone manager assignment
  const zoneAdjMap = {};
  zones.forEach(z => {
    zoneAdjMap[z._id.toString()] = (z.adjacency || []).map(a => a.toString());
  });

  const shiftTypes = [
    { type: 'morning', start: 6, end: 14 },
    { type: 'evening', start: 14, end: 22 },
    { type: 'night', start: 22, end: 30 } // 30 means 6 AM next day
  ];

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  for (let d = 0; d < days; d++) {
    const currentDay = new Date(baseDate.getTime() + d * 24 * 60 * 60 * 1000);

    // Recalculate p90 fatigue daily (FR-4.2: recalculated daily)
    const fatigueValues = deployableOfficers.map(o => officerFatigue[o._id.toString()]);
    fatigueValues.sort((a, b) => a - b);
    const p90Index = Math.min(Math.floor(fatigueValues.length * 0.9), fatigueValues.length - 1);
    const p90Fatigue = fatigueValues.length > 0 ? fatigueValues[p90Index] : Infinity;

    for (const shiftType of shiftTypes) {
      const shiftStartMs = currentDay.getTime() + shiftType.start * 60 * 60 * 1000;
      const shiftEndMs = currentDay.getTime() + shiftType.end * 60 * 60 * 1000;
      const fatigueMultiplier = FATIGUE_MULTIPLIERS[shiftType.type];

      // Track who is assigned in THIS shift globally (so they don't get double assigned)
      const assignedThisShift = new Set();

      for (const zone of zones) {
        const required = zoneRequirements[zone._id.toString()] || 1;
        const isRedZone = zone.density_score >= 8;
        
        const assignedToZone = [];

        // Helper to check availability
        const isAvailable = (officer) => {
          const oid = officer._id.toString();
          if (assignedThisShift.has(oid)) return false;
          const lastEnd = officerLastShiftEnd[oid] || 0;
          const restNeeded = (officer.rank === 'Inspector' ? REST_HOURS.Inspector : REST_HOURS.default) * 60 * 60 * 1000;
          if (shiftStartMs - lastEnd < restNeeded) return false;
          // FR-4.2: Officers in 90th percentile fatigue excluded from Red zones
          const fat = officerFatigue[oid] || 0;
          if (isRedZone && fat >= p90Fatigue && fat > 0) return false;
          return true;
        };

        // 1. Assign Zone Manager(s) (min 1 per active zone per shift)
        // Prefer managers who manage adjacent zones (FR-2.3)
        const sortedManagers = [...zoneManagers].sort((a, b) => {
          // Prefer lower fatigue
          return (officerFatigue[a._id.toString()] || 0) - (officerFatigue[b._id.toString()] || 0);
        });

        for (const zm of sortedManagers) {
          if (isAvailable(zm)) {
            const oid = zm._id.toString();
            assignedToZone.push(zm._id);
            assignedThisShift.add(oid);
            officerLastShiftEnd[oid] = shiftEndMs;
            officerFatigue[oid] = (officerFatigue[oid] || 0) + (fatigueMultiplier * BASE_FATIGUE_PER_SHIFT);
            break; // 1 manager per zone per shift
          }
        }

        // 2. Assign Field Officers to meet required headcount
        // Sort by fatigue (ascending) to distribute workload fairly
        const sortedField = [...fieldOfficers].sort((a, b) => {
          return (officerFatigue[a._id.toString()] || 0) - (officerFatigue[b._id.toString()] || 0);
        });

        for (const fo of sortedField) {
          if (assignedToZone.length >= required) break;
          if (isAvailable(fo)) {
            const oid = fo._id.toString();
            assignedToZone.push(fo._id);
            assignedThisShift.add(oid);
            officerLastShiftEnd[oid] = shiftEndMs;
            officerFatigue[oid] = (officerFatigue[oid] || 0) + (fatigueMultiplier * BASE_FATIGUE_PER_SHIFT);
          }
        }

        // Create shift document
        shifts.push({
          zone_id: zone._id,
          date: currentDay,
          shift_type: shiftType.type,
          assigned_officers: assignedToZone,
          required_headcount: required
        });
      }
    }
  }

  return shifts;
};

module.exports = { generateRoster };
