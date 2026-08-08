const Officer = require('../models/Officer');
const Zone = require('../models/Zone');
const { resolveDeficit } = require('./resolutionEngine');
const { distributeForce } = require('./operationalLogic');

const simulateMassAbsence = async (zoneId, percentage = 0.10) => {
  const zone = await Zone.findById(zoneId);
  if (!zone) throw new Error('Zone not found');

  const officers = await Officer.find({ current_zone_id: zoneId, status: 'active' });
  const numToAbsence = Math.max(1, Math.floor(officers.length * percentage));
  
  if (numToAbsence === 0 || officers.length === 0) {
    return { message: 'Not enough officers to simulate absence', absencedCount: 0, deltaT: 0, incident: null };
  }

  // Set them to on_leave
  const absencedIds = [];
  for (let i = 0; i < numToAbsence && i < officers.length; i++) {
    officers[i].status = 'on_leave';
    await officers[i].save();
    absencedIds.push(officers[i]._id);
  }

  const allZones = await Zone.find();
  // Count active officers AFTER absences, not before — fixes the bug where
  // the old code counted all active officers including the ones we just marked absent
  const allActive = await Officer.countDocuments({ status: 'active' });
  
  // Re-run distributeForce to get new requirement
  const { assignments } = distributeForce(allZones, allActive, 0.15);
  const assignment = assignments.find(a => a.zoneId.toString() === zoneId.toString());
  const required = assignment ? assignment.headcount : 0;
  
  // Current active in zone (after absences)
  const currentDeployed = await Officer.countDocuments({ current_zone_id: zoneId, status: 'active' });
  const deltaT = required - currentDeployed;

  let incident = null;
  if (deltaT > 0) {
    const allOfficers = await Officer.find();
    incident = await resolveDeficit(zone, allZones, allOfficers, deltaT);
  }

  return { absencedCount: numToAbsence, absencedIds, deltaT, incident };
};

module.exports = { simulateMassAbsence };
