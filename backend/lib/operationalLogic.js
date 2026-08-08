const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const calculateZScore = (sizeScore, densityScore, sizeWeight = 0.4, densityWeight = 0.6) => {
  if (densityWeight <= sizeWeight) throw new Error('Density weight must be greater than size weight.');
  return Number(((sizeWeight * sizeScore + densityWeight * densityScore) / (sizeWeight + densityWeight)).toFixed(2));
};

const distributeForce = (zones, availableForce, standbyRatio = 0.15) => {
  if (!Array.isArray(zones) || zones.length === 0) return { standby: 0, assignments: [] };
  const standby = Math.ceil(availableForce * standbyRatio);
  const deployable = Math.max(0, availableForce - standby);
  const scores = zones.map((zone) => calculateZScore(zone.size_score, zone.density_score));
  const total = scores.reduce((sum, score) => sum + score, 0);
  let assigned = 0;
  const assignments = zones.map((zone, index) => {
    const headcount = Math.floor((scores[index] / total) * deployable);
    assigned += headcount;
    return { zoneId: zone._id, headcount };
  });
  assignments.sort((a, b) => b.headcount - a.headcount).slice(0, deployable - assigned).forEach((assignment) => { assignment.headcount += 1; });
  return { standby, assignments };
};

const intensityFromSeverity = (severity) => ({ low: 15, medium: 35, high: 60, critical: 85 }[severity] || 25);

module.exports = { clamp, calculateZScore, distributeForce, intensityFromSeverity };
