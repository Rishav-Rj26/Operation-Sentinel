const express = require('express');
const router = express.Router();

// Mount new sub-routers
router.use('/zones', require('./zones'));
router.use('/officers', require('./officers'));
router.use('/scheduler', require('./scheduler'));
router.use('/incidents', require('./incidents'));
router.use('/fatigue', require('./fatigue'));

module.exports = router;
