const assert = require('node:assert/strict');
const { calculateZScore, distributeForce, intensityFromSeverity } = require('../lib/operationalLogic');

assert.equal(calculateZScore(2, 10), 6.8);
assert.throws(() => calculateZScore(5, 5, 0.6, 0.4), /Density weight/);

const allocation = distributeForce([
  { _id: 'a', size_score: 5, density_score: 9 },
  { _id: 'b', size_score: 5, density_score: 3 },
], 100);
assert.equal(allocation.standby, 15);
assert.equal(allocation.assignments.reduce((sum, item) => sum + item.headcount, 0), 85);
assert.ok(allocation.assignments.find((item) => item.zoneId === 'a').headcount > allocation.assignments.find((item) => item.zoneId === 'b').headcount);
assert.equal(intensityFromSeverity('critical'), 85);
assert.equal(intensityFromSeverity('low'), 15);

console.log('Operational logic tests passed.');
