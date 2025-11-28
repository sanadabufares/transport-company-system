const User = require('../models/user');
const Company = require('../models/company');
const Driver = require('../models/driver');
const Notification = require('../models/notification');
const { pool } = require('../config/db');

// Get all pending user registrations
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.getPendingUsers();
    
    // Get additional details for each user
    const usersWithDetails = await Promise.all(pendingUsers.map(async (user) => {
      let details = null;
      
      if (user.role === 'company') {
        details = await Company.findByUserId(user.id);
      } else if (user.role === 'driver') {
        details = await Driver.findByUserId(user.id);
      }
      
      return {
        ...user,
        details
      };
    }));
    
    res.json(usersWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending users count
exports.getPendingUsersCount = async (req, res) => {
  try {
    const pendingUsers = await User.getPendingUsers();
    const count = pendingUsers.length;
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting pending users count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve a user registration
exports.approveUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Approve the user
    const approved = await User.approveUser(userId);
    if (!approved) {
      return res.status(500).json({ message: 'Failed to approve user' });
    }
    
    // Create notification for the user
    const notification = {
      user_id: userId,
      title: 'Registration Approved',
      message: 'Your registration has been approved. You can now use the system.'
    };
    
    await Notification.create(notification);
    
    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject a user registration
exports.rejectUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists and get their email before deleting
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create rejection notification before deleting the user
    // We need to get the user's email to potentially send an email notification
    const userEmail = user.email;
    const userRole = user.role;
    
    // Reject/delete the user
    const rejected = await User.rejectUser(userId);
    if (!rejected) {
      return res.status(500).json({ message: 'Failed to reject user' });
    }
    
    // Here you would typically send an email notification
    // Since we're not implementing actual email sending, we'll just log it
    console.log(`Rejection notification sent to ${userEmail} (${userRole})`);
    
    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    console.log('Getting all companies...');
    const companies = await Company.getAll();
    console.log(`Found ${companies.length} companies`);
    res.json(companies);
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    console.log('Getting all drivers...');
    const drivers = await Driver.getAll();
    console.log(`Found ${drivers.length} drivers`);
    res.json(drivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin notifications
exports.getNotifications = async (req, res) => {
  try {
    // Admin ID is the logged-in user ID from authentication middleware
    const adminId = req.user.id;
    
    // Get all notifications for the admin
    const notifications = await Notification.findByUserId(adminId);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const adminId = req.user.id;
    
    const updated = await Notification.markAsRead(notificationId, adminId);
    
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found or already read' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread notifications count
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const count = await Notification.getUnreadCount(adminId);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all notifications for the admin
exports.getNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Get all notifications for the admin
    const notifications = await Notification.findByUserId(adminId);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error getting admin notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const updated = await Notification.markAllAsRead(adminId);
    
    if (!updated) {
      return res.status(404).json({ message: 'No unread notifications found or failed to update' });
    }
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats for a specific company (trips and requests)
exports.getCompanyStats = async (req, res) => {
  try {
    const companyId = req.params.id;

    // Validate company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Active trips = All trips created by the company
    const [activeTripsRows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM trips WHERE company_id = ?`,
      [companyId]
    );

    // Completed trips = Trips with driver assigned AND completed status
    const [completedTripsRows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM trips 
       WHERE company_id = ? AND driver_id IS NOT NULL AND status = 'completed'`,
      [companyId]
    );

    // Request trips = Drivers who requested trips from this company
    const [pendingRequestsRows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM trip_requests tr 
       JOIN trips t ON tr.trip_id = t.id 
       WHERE t.company_id = ? AND tr.status = 'pending'`,
      [companyId]
    );

    res.json({
      activeTrips: Number(activeTripsRows[0]?.count || 0),
      completedTrips: Number(completedTripsRows[0]?.count || 0),
      pendingRequests: Number(pendingRequestsRows[0]?.count || 0)
    });
  } catch (error) {
    console.error('Error getting company stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get company trips with filtering
exports.getCompanyTrips = async (req, res) => {
  try {
    const companyId = req.params.id;
    const { filter } = req.query; // active, completed, requested

    // Validate company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    let query = `
      SELECT t.*, 
             CONCAT(d.first_name, ' ', d.last_name) as driver_name,
             COUNT(tr.id) as request_count
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN trip_requests tr ON t.id = tr.trip_id AND tr.status = 'pending'
      WHERE t.company_id = ?
    `;
    
    const params = [companyId];

    // Apply filters
    switch (filter) {
      case 'active':
        // All trips (any status)
        break;
      case 'completed':
        query += ` AND t.driver_id IS NOT NULL AND t.status = 'completed'`;
        break;
      case 'requested':
        query += ` AND EXISTS (
          SELECT 1 FROM trip_requests tr2 
          WHERE tr2.trip_id = t.id AND tr2.status = 'pending'
        )`;
        break;
    }

    query += ` GROUP BY t.id ORDER BY t.created_at DESC`;

    const [trips] = await pool.execute(query, params);

    res.json({
      trips,
      filter: filter || 'all',
      company: {
        id: company.id,
        name: company.company_name
      }
    });
  } catch (error) {
    console.error('Error getting company trips:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats for a specific driver (trips and requests)
exports.getDriverStats = async (req, res) => {
  console.log('--- NEW REQUEST: getDriverStats ---');
  try {
    const driverId = req.params.id;
    console.log(`[STATS] Fetching stats for driver ID: ${driverId}`);

    // 1. Validate driver exists
    console.log(`[STATS] Validating driver...`);
    const driver = await Driver.findById(driverId);
    console.log(`[STATS] Driver validation result:`, driver ? `Found driver ${driver.first_name}` : 'Driver not found');
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // 2. Get Active trips
    console.log(`[STATS] Querying active trips...`);
    const [activeTripsRows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM trips WHERE driver_id = ?`,
      [driverId]
    );
    console.log(`[STATS] Active trips result:`, activeTripsRows);

    // 3. Get Completed trips
    console.log(`[STATS] Querying completed trips...`);
    const [completedTripsRows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM trips WHERE driver_id = ? AND status = 'completed'`,
      [driverId]
    );
    console.log(`[STATS] Completed trips result:`, completedTripsRows);

    // 4. Get Pending requests
    console.log(`[STATS] Querying pending requests...`);
    const [pendingRequestsRows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM trip_requests WHERE driver_id = ? AND status = 'pending'`,
      [driverId]
    );
    console.log(`[STATS] Pending requests result:`, pendingRequestsRows);

    const stats = {
      activeTrips: Number(activeTripsRows[0]?.count || 0),
      completedTrips: Number(completedTripsRows[0]?.count || 0),
      pendingRequests: Number(pendingRequestsRows[0]?.count || 0)
    };

    console.log('[STATS] Successfully compiled driver stats:', stats);
    res.json(stats);

  } catch (error) {
    console.error('[STATS-ERROR] Failed to get driver stats:', error);
    res.status(500).json({ message: 'Server error while fetching driver stats' });
  }
};
