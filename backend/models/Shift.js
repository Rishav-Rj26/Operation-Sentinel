const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema(
  {
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift_type: {
      type: String,
      enum: ['morning', 'evening', 'night'],
      required: true,
    },
    assigned_officers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Officer',
      },
    ],
    required_headcount: {
      type: Number,
      required: true,
      min: 0,
    },
    __version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ShiftSchema.index({ zone_id: 1, date: 1, shift_type: 1 }, { unique: true });

module.exports = mongoose.model('Shift', ShiftSchema);
