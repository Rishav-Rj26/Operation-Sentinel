const express = require('express');
const router = express.Router();

router.use('/', require('./dashboard'));
router.use('/', require('./seed'));
router.use('/sectors', require('./sectors'));
router.use('/units', require('./units'));
router.use('/zones', require('./zones'));
router.use('/officers', require('./officers'));
router.use('/scheduler', require('./scheduler'));
router.use('/incidents', require('./incidents'));
router.use('/fatigue', require('./fatigue'));
router.use('/audit-logs', require('./auditlog'));

module.exports = router;
