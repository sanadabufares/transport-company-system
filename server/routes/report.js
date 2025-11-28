const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');
const { auth, checkRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Company reports (only accessible by companies)
router.get('/company/trips-by-date', checkRole(['company']), reportController.getCompanyTripsByDate);
router.get('/company/trips-by-driver', checkRole(['company']), reportController.getCompanyTripsByDriver);
router.get('/company/trips-by-visa', checkRole(['company']), reportController.getTripsByVisaNumber);

// Driver reports (only accessible by drivers)
router.get('/driver/trips-by-date', checkRole(['driver']), reportController.getDriverTripsByDate);
router.get('/driver/trips-by-company', checkRole(['driver']), reportController.getDriverTripsByCompany);
router.get('/driver/trips-by-visa', checkRole(['driver']), reportController.getTripsByVisaNumber);

module.exports = router;
