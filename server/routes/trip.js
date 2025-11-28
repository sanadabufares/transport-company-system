const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip');
const { auth, checkRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get trip by ID (accessible by any authenticated user)
router.get('/:id', tripController.getTripById);

// Company only routes
router.use('/company', checkRole(['company']));
router.post('/company', tripController.createTrip);
router.put('/company/:id', tripController.updateTrip);
router.delete('/company/:id', tripController.deleteTrip);
router.get('/company/all', tripController.getCompanyTrips);

// Driver only routes
router.use('/driver', checkRole(['driver']));
router.get('/driver/all', tripController.getDriverTrips);
router.get('/driver/available', tripController.getAvailableTrips);
router.put('/driver/:id/start', tripController.startTrip);
router.put('/driver/:id/complete', tripController.completeTrip);

module.exports = router;
