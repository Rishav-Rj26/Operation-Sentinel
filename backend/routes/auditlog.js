const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// GET / — paginated, filterable audit log
router.get('/', auth, async (req, res, next) => {
  try {
    const { action, actor, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (actor) filter.actor = actor;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) { next(err); }
});

// GET /stats — action type aggregation
router.get('/stats', auth, async (req, res, next) => {
  try {
    const stats = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 }, latest: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
    ]);
    res.json(stats);
  } catch (err) { next(err); }
});

module.exports = router;
