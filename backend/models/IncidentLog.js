const mongoose = require('mongoose');

const IncidentLogSchema = new mongoose.Schema(
  {
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    delta_D: {
      type: Number,
      required: true,
    },
    delta_T: {
      type: Number,
      required: true,
    },
    resolution_steps_taken: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    resolved_by: {
      type: String,
      enum: ['auto', 'manual'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'escalated'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IncidentLog', IncidentLogSchema);
