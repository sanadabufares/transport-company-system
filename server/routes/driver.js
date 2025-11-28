const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver');
const { auth, checkRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);
router.use(checkRole(['driver']));

// Driver profile
router.get('/profile', driverController.getProfile);
router.put('/profile', driverController.updateProfile);

// Driver availability
router.post('/availability', driverController.updateAvailability);
router.get('/availability/current', driverController.getCurrentDriverAvailability);

// Driver dashboard
router.get('/stats', driverController.getDriverStats);
router.get('/trips/recent', driverController.getRecentTrips);

// Trip management
router.get('/trips', driverController.getDriverTrips);
router.get('/trips/:id', driverController.getTripById);
router.put('/trips/:id/start', driverController.startTrip);
router.put('/trips/:id/complete', driverController.completeTrip);

// Available trips for a driver
router.get('/available-trips', driverController.getAvailableTrips);

// Trip requests
router.get('/trip-requests', driverController.getTripRequests);
router.get('/company-requests', driverController.getCompanyRequests);
router.post('/trip-requests', driverController.sendTripRequest);
router.put('/trip-requests/:id/accept', driverController.acceptTripRequest);
router.put('/trip-requests/:id/reject', driverController.rejectTripRequest);
router.post('/trip-requests/cancel', driverController.cancelTripRequest);
router.post('/trip-requests/respond-reassignment', driverController.respondToReassignmentRequest);

// Ratings
router.post('/rate-company', driverController.rateCompany);

// Notifications
router.get('/notifications', driverController.getNotifications);
router.get('/notifications/unread-count', driverController.getUnreadNotificationsCount);
router.put('/notifications/:id/read', driverController.markNotificationAsRead);
router.put('/notifications/read-all', driverController.markAllNotificationsAsRead);

// Trip Requests Count
router.get('/trip-requests/count', driverController.getTripRequestsCount);

// Reports
router.get('/reports/stats', driverController.getReportStats);
router.get('/reports/trips', driverController.getReportTrips);

module.exports = router;
