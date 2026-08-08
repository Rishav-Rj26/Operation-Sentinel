const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Incident title is required'], trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['reported', 'responding', 'resolved', 'closed'], default: 'reported' },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 160 },
    sectorName: { type: String, trim: true, maxlength: 80, default: '' },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

IncidentSchema.index({ status: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('Incident', IncidentSchema);
