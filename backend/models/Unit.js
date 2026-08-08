const mongoose = require('mongoose');

const UNIT_TYPES = ['Patrol', 'Response', 'K-9', 'Tactical', 'Air Support', 'Traffic', 'Detective'];
const UNIT_STATUSES = ['Available', 'En Route', 'On Scene', 'Standby', 'Patrolling', 'Off Duty'];

const UnitSchema = new mongoose.Schema(
  {
    unitId: { type: String, required: [true, 'Unit ID is required'], trim: true, unique: true, maxlength: 30 },
    type: { type: String, enum: UNIT_TYPES, default: 'Patrol' },
    status: { type: String, enum: UNIT_STATUSES, default: 'Available' },
    sectorName: { type: String, trim: true, maxlength: 80, default: '' },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 160 },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Unit', UnitSchema);
