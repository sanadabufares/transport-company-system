const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { auth, checkRole } = require('../middleware/auth');

// Apply middleware to all routes
router.use(auth);
router.use(checkRole(['admin']));

// MINIMAL TEST - no middleware, hardcoded response
router.get('/ping', (req, res) => res.json({ pong: Date.now() }));

// Get pending registrations
router.get('/pending-users', adminController.getPendingUsers);

// Get pending users count
router.get('/pending-users/count', adminController.getPendingUsersCount);

// Approve or reject registrations
router.put('/approve-user/:id', adminController.approveUser);
router.put('/reject-user/:id', adminController.rejectUser);

// Get all companies
router.get('/companies', adminController.getAllCompanies);

// Simple test route
router.get('/test-new-route', (req, res) => {
  res.json({ message: 'New route works!', timestamp: new Date().toISOString() });
});

// Company stats
router.get('/companies/:id/stats', adminController.getCompanyStats);

// Company trips with filtering
router.get('/companies/:id/trips', adminController.getCompanyTrips);

// Get all drivers
router.get('/drivers', adminController.getAllDrivers);

// Driver stats
router.get('/drivers/:id/stats', adminController.getDriverStats);

// Get admin notifications
router.get('/notifications', adminController.getNotifications);

// Get unread notifications count
router.get('/notifications/unread-count', adminController.getUnreadNotificationsCount);

// Mark all notifications as read
router.put('/notifications/mark-all-read', adminController.markAllNotificationsAsRead);

// Mark notification as read
router.put('/notifications/:id/read', adminController.markNotificationAsRead);

// DEBUG: List all registered admin routes (temporary)
router.get('/__debug_routes', (req, res) => {
  try {
    const routes = router.stack
      .filter(layer => layer.route)
      .map(layer => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods || {})
      }));
    res.json(routes);
  } catch (e) {
    res.status(500).json({ message: 'Failed to introspect routes', error: e.message });
  }
});

module.exports = router;
