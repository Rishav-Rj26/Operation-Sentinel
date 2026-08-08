const mongoose = require('mongoose');

const SectorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Sector name is required'], trim: true, unique: true, maxlength: 80 },
    intensity: { type: Number, required: true, min: 0, max: 100, default: 0 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SectorSchema.virtual('activeIncidents', {
  ref: 'Incident',
  localField: 'name',
  foreignField: 'sectorName',
  count: true,
  match: { status: { $nin: ['resolved', 'closed'] } },
});

module.exports = mongoose.model('Sector', SectorSchema);
