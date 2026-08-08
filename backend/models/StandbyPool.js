const mongoose = require('mongoose');

const StandbyPoolSchema = new mongoose.Schema(
  {
    officers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Officer',
      },
    ],
    rank_breakdown: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    total_reserved: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StandbyPool', StandbyPoolSchema);
