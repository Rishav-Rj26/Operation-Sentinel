const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Zone = require('../models/Zone');

// Helper to emit socket events
const emit = (req, event, data) => {
  const io = req.app.locals.io;
  if (io) io.emit(event, data);
};

// GET all zones
router.get('/', auth, async (req, res, next) => {
  try {
    const zones = await Zone.find().populate('adjacency', 'name');
    res.json(zones);
  } catch (err) { next(err); }
});

// POST new zone
router.post('/', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    emit(req, 'zone:created', zone);
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

// PUT update zone (with OCC)
router.put('/:id', auth, requireRole('admin', 'dispatcher'), async (req, res, next) => {
  try {
    const { __version, ...updateData } = req.body;

    if (__version === undefined) {
      return res.status(400).json({ message: 'Must provide __version for concurrency control' });
    }

    const zone = await Zone.findOneAndUpdate(
      { _id: req.params.id, __version },
      { $set: updateData, $inc: { __version: 1 } },
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(409).json({ message: 'Conflict: Document was modified by another user or does not exist.' });
    }

    emit(req, 'zone:updated', zone);
    res.json(zone);
  } catch (err) { next(err); }
});

// DELETE zone
router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    // Optionally check __version on delete too
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    // Also remove this zone from any adjacency lists
    await Zone.updateMany(
      { adjacency: req.params.id },
      { $pull: { adjacency: req.params.id } }
    );

    emit(req, 'zone:deleted', { _id: req.params.id });
    res.json({ message: 'Zone deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
