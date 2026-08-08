const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
    },
    size_score: {
      type: Number,
      required: [true, 'Size score is required'],
      min: 1,
      max: 10,
    },
    density_score: {
      type: Number,
      required: [true, 'Density score is required'],
      min: 1,
      max: 10,
    },
    zscore: {
      type: Number,
      default: 0,
    },
    adjacency: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
      },
    ],
    safe_threshold: {
      type: Number,
      default: 0,
    },
    __version: {
      type: Number,
      default: 0,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ZoneSchema.virtual('color').get(function() {
  if (this.density_score >= 8) return 'red';
  if (this.density_score >= 4) return 'yellow';
  return 'green';
});

module.exports = mongoose.model('Zone', ZoneSchema);
