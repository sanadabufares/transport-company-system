const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company');
const { auth, checkRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);
router.use(checkRole(['company']));

// Dashboard
router.get('/dashboard-stats', companyController.getDashboardStats);

// Company profile
router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);

// Trip management
router.post('/trips', companyController.createTrip);
router.get('/trips', companyController.getTrips);
router.get('/trips/:tripId', companyController.getTripById);
router.put('/trips/:tripId', companyController.updateTrip);
router.post('/trips/:tripId/cancel', companyController.cancelTrip);

// Driver management
router.get('/trips/:tripId/available-drivers', companyController.getAvailableDrivers);
router.get('/trips/:tripId/all-drivers', companyController.getAllDriversForTrip); // New simple endpoint
router.get('/trips/:tripId/requesting-drivers', companyController.getRequestingDrivers);
router.post('/driver-request', companyController.sendDriverRequest);
router.post('/trips/:tripId/request-reassignment', companyController.requestDriverReassignment);

// Trip Requests
router.get('/trip-requests', companyController.getTripRequests);
router.post('/trip-requests', companyController.sendDriverRequest);
router.get('/driver-requests', companyController.getDriverRequests);

// Get all approved drivers
router.get('/drivers', companyController.getAllDrivers);
router.post('/respond-to-request', companyController.respondToTripRequest);
router.post('/cancel-request', companyController.cancelTripRequest);

// Ratings
router.post('/trips/:tripId/rate-driver', companyController.rateDriver);

// Reports
router.get('/reports/stats', companyController.getReports);
router.get('/reports/trips', companyController.getReports);
router.get('/reports/drivers', companyController.getReports);

// Notifications
router.get('/notifications', companyController.getNotifications);
router.get('/notifications/unread-count', companyController.getUnreadNotificationsCount);
router.put('/notifications/read-all', companyController.markAllNotificationsAsRead);
router.put('/notifications/:id/read', companyController.markNotificationAsRead);

// Trip Requests Count
router.get('/trip-requests/count', companyController.getTripRequestsCount);

module.exports = router;
