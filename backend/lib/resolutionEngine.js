const IncidentLog = require('../models/IncidentLog');
const AuditLog = require('../models/AuditLog');
const Officer = require('../models/Officer');
const StandbyPool = require('../models/StandbyPool');

const resolveDeficit = async (zone, allZones, allOfficers, deltaT) => {
  let remainingDeficit = deltaT;
  const resolutionSteps = [];
  const assignedOfficers = [];

  // Step A: Adjacent Pooling
  // Pull from adjacent zones that have capacity above their safe threshold
  const adjacentZones = allZones.filter(z => 
    zone.adjacency.some(adjId => adjId.toString() === z._id.toString())
  );

  for (const adjZone of adjacentZones) {
    if (remainingDeficit <= 0) break;

    // Find active officers in this adjacent zone
    const officersInZone = allOfficers.filter(o => 
      o.current_zone_id && o.current_zone_id.toString() === adjZone._id.toString() && o.status === 'active'
    );
    
    // Only pull if adjacent zone has officers above its safe threshold
    const safeMin = adjZone.safe_threshold || 0;
    const deployableCount = Math.max(0, officersInZone.length - safeMin);
    
    if (deployableCount > 0) {
      const numToPull = Math.min(remainingDeficit, deployableCount);
      const pulledOfficers = officersInZone.slice(0, numToPull);

      for (const po of pulledOfficers) {
        po.current_zone_id = zone._id;
        // Apply 2.0x fatigue multiplier for emergency redeployment (FR-4.2)
        po.fatigue_score = (po.fatigue_score || 0) + (2.0 * 10);
        await po.save();
        assignedOfficers.push(po);
        
        await AuditLog.create({
          actor: 'system',
          action: 'resolve_deficit_step_a',
          before_state: { officer: po._id, zone: adjZone._id },
          after_state: { officer: po._id, zone: zone._id, fatigueAdded: 20 }
        });
      }

      resolutionSteps.push({
        step: 'A',
        source: 'adjacent_zone',
        zone_id: adjZone._id,
        zone_name: adjZone.name,
        pulled: numToPull
      });

      remainingDeficit -= numToPull;
    }
  }

  // Step B: Global Reserve
  if (remainingDeficit > 0) {
    const standbyOfficers = allOfficers.filter(o => o.status === 'standby');
    if (standbyOfficers.length > 0) {
      const numToPull = Math.min(remainingDeficit, standbyOfficers.length);
      const pulledOfficers = standbyOfficers.slice(0, numToPull);

      for (const po of pulledOfficers) {
        po.current_zone_id = zone._id;
        po.status = 'active';
        // Apply 2.0x fatigue multiplier for emergency redeployment (FR-4.2)
        po.fatigue_score = (po.fatigue_score || 0) + (2.0 * 10);
        await po.save();
        assignedOfficers.push(po);
        
        await AuditLog.create({
          actor: 'system',
          action: 'resolve_deficit_step_b',
          before_state: { officer: po._id, status: 'standby' },
          after_state: { officer: po._id, zone: zone._id, status: 'active', fatigueAdded: 20 }
        });
      }

      // Update StandbyPool document
      const pool = await StandbyPool.findOne();
      if (pool) {
        pool.officers = pool.officers.filter(id => !pulledOfficers.find(po => po._id.toString() === id.toString()));
        pool.total_reserved = pool.officers.length;
        await pool.save();
      }

      resolutionSteps.push({
        step: 'B',
        source: 'standby_pool',
        pulled: numToPull
      });

      remainingDeficit -= numToPull;
    }
  }

  // Step C: Escalation
  const isResolved = remainingDeficit <= 0;
  const status = isResolved ? 'resolved' : 'escalated';

  const incident = await IncidentLog.create({
    zone_id: zone._id,
    delta_D: zone.density_score,
    delta_T: deltaT,
    resolution_steps_taken: resolutionSteps,
    resolved_by: isResolved ? 'auto' : 'manual', // Escalated = needs manual intervention
    status
  });

  if (!isResolved) {
    await AuditLog.create({
      actor: 'system',
      action: 'resolve_deficit_step_c_escalation',
      after_state: {
        zone: zone._id,
        remaining_deficit: remainingDeficit,
        incident_id: incident._id,
      }
    });
  }

  return incident;
};

module.exports = { resolveDeficit };
