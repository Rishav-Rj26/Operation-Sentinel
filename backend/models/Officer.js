const mongoose = require('mongoose');
const { RANKS } = require('../constants/ranks');

const OfficerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Officer name is required'],
      trim: true,
    },
    rank: {
      type: String,
      required: [true, 'Rank is required'],
      enum: {
        values: RANKS,
        message: '{VALUE} is not a valid rank',
      },
    },
    current_zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    fatigue_score: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'standby'],
      default: 'active',
    },
    last_shift_end: {
      type: Date,
      default: null,
    },
    __version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        ret.zoneId = ret.current_zone_id;
        ret.fatigueScore = ret.fatigue_score;
        ret.lastShiftEnd = ret.last_shift_end;
        delete ret.current_zone_id;
        delete ret.fatigue_score;
        delete ret.last_shift_end;
        return ret;
      },
    },
  }
);

OfficerSchema.index({ rank: 1 });
OfficerSchema.index({ status: 1 });
OfficerSchema.index({ current_zone_id: 1 });

module.exports = mongoose.model('Officer', OfficerSchema);
