const Driver = require('../models/driver');
const Trip = require('../models/trip');
const Company = require('../models/company');
const TripRequest = require('../models/tripRequest');
const Notification = require('../models/notification');
const Rating = require('../models/rating');
const { pool } = require('../config/db');

// Get driver profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update driver profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, address, license_number, license_expiry, vehicle_type, vehicle_plate } = req.body;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Build update object with only provided fields
    const fieldsToUpdate = {};
    if (first_name !== undefined) fieldsToUpdate.first_name = first_name;
    if (last_name !== undefined) fieldsToUpdate.last_name = last_name;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (license_number !== undefined) fieldsToUpdate.license_number = license_number;
    if (license_expiry !== undefined) fieldsToUpdate.license_expiry = license_expiry;
    if (vehicle_type !== undefined) fieldsToUpdate.vehicle_type = vehicle_type;
    if (vehicle_plate !== undefined) fieldsToUpdate.vehicle_plate = vehicle_plate;

    // Check if any fields to update
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    // Create dynamic SQL query for partial updates
    const setClause = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    const values = Object.values(fieldsToUpdate);
    values.push(driver.id); // Add driver ID for WHERE clause


    const { pool } = require('../config/db');
    const [result] = await pool.execute(
      `UPDATE drivers SET ${setClause} WHERE id = ?`,
      values
    );
    const updated = result.affectedRows > 0;
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update driver profile' });
    }
    
    res.json({ message: 'Driver profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update driver availability
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_location, available_from, available_to } = req.body;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    const updated = await Driver.updateAvailability(driver.id, current_location, available_from, available_to);
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update availability' });
    }
    
    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all trips for the driver
exports.getDriverTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    const trips = await Trip.getByDriverId(driver.id);
    
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trip by ID
exports.getTripById = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    if (trip.driver_id !== driver.id && trip.status !== 'pending') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start trip
exports.startTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    if (trip.driver_id !== driver.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (trip.status !== 'assigned') {
      return res.status(400).json({ message: 'Trip cannot be started' });
    }
    
    const updated = await Trip.updateStatus(tripId, 'in_progress');
    if (!updated) {
      return res.status(500).json({ message: 'Failed to start trip' });
    }
    
    // Create notification for the company
    const company = await Company.findById(trip.company_id);
    const notification = {
      user_id: company.user_id,
      title: 'Trip Started',
      message: `Trip from ${trip.pickup_location} to ${trip.destination} has been started by the driver.`
    };
    
    await Notification.create(notification);
    
    res.json({ message: 'Trip started successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete trip
exports.completeTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    if (trip.driver_id !== driver.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (trip.status !== 'in_progress') {
      return res.status(400).json({ message: 'Trip cannot be completed' });
    }
    
    const updated = await Trip.updateStatus(tripId, 'completed');
    if (!updated) {
      return res.status(500).json({ message: 'Failed to complete trip' });
    }
    
    // Save company rating if provided
    
    if (rating && rating >= 1 && rating <= 5) {
      try {
        const ratingData = {
          trip_id: parseInt(tripId),
          rater_id: driver.id,
          rater_type: 'driver',
          rated_id: trip.company_id,
          rated_type: 'company',
          rating: parseInt(rating),
          comment: comment || null
        };
        
        const ratingId = await Rating.create(ratingData);
        
        // Update company's average rating
        const averageRating = await Rating.getCompanyAverageRating(trip.company_id);
        const ratingCount = await Rating.getCompanyRatings(trip.company_id);
        
        const { pool } = require('../config/db');
        await pool.execute(
          'UPDATE companies SET rating = ?, rating_count = ? WHERE id = ?',
          [averageRating, ratingCount.length, trip.company_id]
        );
      } catch (ratingError) {
        console.error('Rating save error:', ratingError);
        // Don't fail the whole request if rating fails
      }
    }
    
    // Create notification for the company
    const company = await Company.findById(trip.company_id);
    const notification = {
      user_id: company.user_id,
      title: 'Trip Completed',
      message: `Trip from ${trip.pickup_location} to ${trip.destination} has been completed by the driver.`
    };
    
    await Notification.create(notification);
    
    res.json({ 
      message: 'Trip completed successfully',
      rating_saved: rating ? true : false 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available trips for the driver
exports.getAvailableTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    if (!driver.current_location || !driver.available_from || !driver.available_to) {
      return res.status(400).json({ message: 'Please update your availability first' });
    }
    
    const trips = await Trip.getAvailableTripsForDriver(
      driver.id,
      driver.current_location,
      driver.available_from,
      driver.available_to
    );
    
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trip requests for the driver (both driver-initiated and company-initiated)
exports.getTripRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get all trip requests, specifically including company-to-driver requests
    // First get driver-to-company requests
    const driverRequests = await TripRequest.getByDriverId(driver.id);
    
    // Then get company-to-driver requests using the specific method
    const companyRequests = await TripRequest.getCompanyRequestsForDriver(driver.id);
    
    
    // Combine both types of requests, avoiding duplicates
    const allRequests = [];
    const requestIds = new Set();
    
    // Add driver-to-company requests
    driverRequests.forEach(req => {
      if (!requestIds.has(req.id)) {
        allRequests.push(req);
        requestIds.add(req.id);
      }
    });
    
    // Add company-to-driver requests
    companyRequests.forEach(req => {
      if (!requestIds.has(req.id)) {
        allRequests.push(req);
        requestIds.add(req.id);
      }
    });
    
    
    res.json(allRequests);
  } catch (error) {
    console.error('[Driver Controller] Error getting trip requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get company-initiated requests for the driver
exports.getCompanyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get only company-to-driver requests
    const requests = await TripRequest.getCompanyRequestsForDriver(driver.id);
    
    
    res.json(requests);
  } catch (error) {
    console.error('[Driver Controller] Error getting company requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a trip request to a company
exports.sendTripRequest = async (req, res) => {
  try {
    const { trip_id } = req.body;
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Check if trip exists and is pending
    const trip = await Trip.findById(trip_id);
    if (!trip || trip.status !== 'pending') {
      return res.status(404).json({ message: 'Trip not available' });
    }
    
    // Check if request already exists
    const existingRequest = await TripRequest.findByTripAndDriver(trip_id, driver.id);
    if (existingRequest) {
      return res.status(400).json({ message: 'A request for this trip already exists' });
    }
    
    const request = {
      trip_id,
      driver_id: driver.id,
      request_type: 'driver_to_company'
    };
    
    const requestId = await TripRequest.create(request);
    
    // Create notification for the company
    const company = await Company.findById(trip.company_id);
    const notification = {
      user_id: company.user_id,
      title: 'New Trip Request',
      message: `A driver has requested to take your trip from ${trip.pickup_location} to ${trip.destination} on ${trip.trip_date}.`
    };
    
    await Notification.create(notification);
    
    res.status(201).json({ 
      message: 'Trip request sent successfully',
      requestId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept a trip request from a company
exports.acceptTripRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get the request
    const request = await TripRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Trip request not found' });
    }
    
    if (request.driver_id !== driver.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (request.request_type !== 'company_to_driver') {
      return res.status(400).json({ message: 'Cannot accept a request you made' });
    }

    // Check for scheduling conflicts before accepting
    const trip = await Trip.findById(request.trip_id);
    const tripDateTime = `${new Date(trip.trip_date).toISOString().slice(0, 10)} ${trip.departure_time}`;
    const hasConflict = await Driver.hasTripConflict(driver.id, tripDateTime);

    if (hasConflict) {
      return res.status(409).json({ message: 'You already have a conflicting trip at this time.' });
    }
    
    // Update request status
    const updated = await TripRequest.updateStatus(requestId, 'accepted');
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update trip request' });
    }
    
    // Assign driver to trip
    await Trip.assignDriver(request.trip_id, driver.id);
    
    // Delete all other pending requests for the same trip
    console.log(`[ACCEPT DEBUG] Starting cleanup for trip ${request.trip_id}, accepted request ID: ${requestId}`);
    
    // First, check what other requests exist for this trip
    const { pool } = require('../config/db');
    const [existingRequests] = await pool.execute(
      'SELECT id, driver_id, status FROM trip_requests WHERE trip_id = ?',
      [request.trip_id]
    );
    console.log(`[ACCEPT DEBUG] Found ${existingRequests.length} total requests for trip ${request.trip_id}:`, existingRequests);
    
    const [pendingRequests] = await pool.execute(
      'SELECT id, driver_id, status FROM trip_requests WHERE trip_id = ? AND id != ? AND status = ?',
      [request.trip_id, requestId, 'pending']
    );
    console.log(`[ACCEPT DEBUG] Found ${pendingRequests.length} pending requests to delete:`, pendingRequests);
    
    // Now delete them
    const [deleteResult] = await pool.execute(
      'DELETE FROM trip_requests WHERE trip_id = ? AND id != ? AND status = ?',
      [request.trip_id, requestId, 'pending']
    );
    console.log(`[ACCEPT DEBUG] DELETE query executed - affected rows: ${deleteResult.affectedRows}`);
    
    // Verify deletion
    const [remainingRequests] = await pool.execute(
      'SELECT id, driver_id, status FROM trip_requests WHERE trip_id = ?',
      [request.trip_id]
    );
    console.log(`[ACCEPT DEBUG] After deletion, ${remainingRequests.length} requests remain for trip ${request.trip_id}:`, remainingRequests);
    
    // Create notification for the company
    const company = await Company.findById(trip.company_id);
    const notification = {
      user_id: company.user_id,
      title: 'Trip Request Accepted',
      message: `Driver has accepted your request for the trip from ${trip.pickup_location} to ${trip.destination} on ${trip.trip_date}.`
    };
    
    await Notification.create(notification);
    
    res.json({ message: 'Trip request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject a trip request from a company
exports.rejectTripRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get the request
    const request = await TripRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Trip request not found' });
    }
    
    if (request.driver_id !== driver.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (request.request_type !== 'company_to_driver') {
      return res.status(400).json({ message: 'Cannot reject a request you made' });
    }
    
    // Update request status
    const updated = await TripRequest.updateStatus(requestId, 'rejected');
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update trip request' });
    }
    
    // Get trip details for notification
    const trip = await Trip.findById(request.trip_id);
    
    // Create notification for the company
    const company = await Company.findById(trip.company_id);
    const notification = {
      user_id: company.user_id,
      title: 'Trip Request Rejected',
      message: `Driver has rejected your request for the trip from ${trip.pickup_location} to ${trip.destination} on ${trip.trip_date}.`
    };
    
    await Notification.create(notification);
    
    res.json({ message: 'Trip request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel (delete) a trip request that the driver created
exports.cancelTripRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;
    
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get the request
    const request = await TripRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Trip request not found' });
    }
    
    if (request.driver_id !== driver.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Only allow canceling driver-to-company requests (driver's own requests)
    if (request.request_type !== 'driver_to_company') {
      return res.status(400).json({ message: 'Can only cancel requests you made to companies' });
    }
    
    // Delete the request from database
    const deleted = await TripRequest.delete(requestId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to cancel trip request' });
    }
    
    
    res.status(200).json({ 
      message: 'Trip request canceled successfully'
    });
  } catch (error) {
    console.error('Error in cancelTripRequest:', error);
    res.status(500).json({ message: 'Server error while canceling trip request.' });
  }
};

// Rate a company
exports.rateCompany = async (req, res) => {
  try {
    const { trip_id, rating, comment } = req.body;
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Check if trip is completed and driver was assigned to it
    const trip = await Trip.findById(trip_id);
    if (!trip || trip.driver_id !== driver.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (trip.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot rate a company for a trip that is not completed' });
    }
    
    // Update company rating
    await Company.updateRating(trip.company_id, rating);
    
    // Create notification for the company
    const company = await Company.findById(trip.company_id);
    const notification = {
      user_id: company.user_id,
      title: 'New Rating Received',
      message: `You have received a ${rating}-star rating for the trip from ${trip.pickup_location} to ${trip.destination}.`
    };
    
    await Notification.create(notification);
    
    res.json({ message: 'Company rated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await Notification.findByUserId(userId);
    
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const updated = await Notification.markAsRead(notificationId, userId);
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.markAllAsRead(userId);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current driver's availability
exports.getCurrentDriverAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      // Return empty availability data that matches frontend expectations
      return res.json({
        current_location: '',
        available_from: '',
        available_to: ''
      });
    }
    
    const availability = {
      current_location: driver.current_location || '',
      available_from: driver.available_from || '',
      available_to: driver.available_to || ''
    };
    
    res.json(availability);

  } catch (error) {
    console.error('Error fetching current driver availability:', error);
    res.status(500).json({ message: 'Server error while fetching availability' });
  }
};

// Get driver availability
exports.getDriverAvailability = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const availability = {
      isAvailable: driver.is_available === 1,
      location: driver.current_location || '',
      availableFrom: driver.available_from || '',
      availableTo: driver.available_to || ''
    };
    
    res.json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get driver statistics for dashboard
exports.getDriverStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    const driverId = driver.id;
    
    // Get all trips for the driver
    const trips = await Trip.getByDriverId(driverId);
    
    // Calculate stats
    const activeTrips = trips.filter(trip => ['assigned', 'in_progress'].includes(trip.status)).length;
    const completedTrips = trips.filter(trip => trip.status === 'completed').length;
    
    // Count pending trip requests
    const tripRequests = await TripRequest.countPendingByDriverId(driverId);
    
    // Calculate total earnings
    const totalEarnings = trips
      .filter(trip => trip.status === 'completed')
      .reduce((sum, trip) => sum + parseFloat(trip.price || 0), 0);
    
    // Count available trips
    const availableTrips = await Trip.countAvailableTrips(driverId);
    
    const stats = {
      activeTrips,
      completedTrips,
      tripRequests,
      totalEarnings,
      availableTrips
    };
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent trips for driver dashboard
exports.getRecentTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    const driverId = driver.id;
    
    // Get recent trips (limit to 5)
    const trips = await Trip.getRecentByDriverId(driverId, 5);
    
    // Format trips with company names
    const formattedTrips = [];
    for (const trip of trips) {
      const company = await Company.findById(trip.company_id);
      
      formattedTrips.push({
        id: trip.id,
        pickup_location: trip.pickup_location,
        destination: trip.destination,
        trip_date: trip.trip_date,
        departure_time: trip.departure_time,
        status: trip.status,
        passenger_count: trip.passenger_count,
        vehicle_type: trip.vehicle_type,
        price: trip.price,
        company_name: company ? company.company_name : 'Unknown Company'
      });
    }
    
    res.json(formattedTrips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread notifications count
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Count unread notifications
    const count = await Notification.countUnreadByUserId(userId);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trip requests count
exports.getTripRequestsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Count trip requests from companies to driver
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM trip_requests tr 
       WHERE tr.driver_id = ? AND tr.request_type = 'company_to_driver' AND tr.status = 'pending'`,
      [driver.id]
    );
    
    // Also count reassignment requests
    const [reassignmentRows] = await pool.execute(
      `SELECT COUNT(*) as count FROM trip_requests tr 
       WHERE tr.driver_id = ? AND tr.request_type = 'reassignment_approval' AND tr.status = 'pending'`,
      [driver.id]
    );
    
    const count = rows[0].count + reassignmentRows[0].count;
    res.json({ count });
  } catch (error) {
    console.error('Error in getTripRequestsCount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Respond to a reassignment request from a company
exports.respondToReassignmentRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body; // status: 'accepted' or 'rejected'
    const userId = req.user.id;

    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const request = await TripRequest.findById(requestId);
    if (!request || request.driver_id !== driver.id || request.request_type !== 'reassignment_approval') {
      return res.status(403).json({ message: 'Invalid or unauthorized request.' });
    }

    await TripRequest.updateStatus(requestId, status);

    const trip = await Trip.findById(request.trip_id);
    const company = await Company.findById(trip.company_id);

    if (status === 'accepted') {
      // Unassign the driver and set the trip back to pending
      await Trip.unassignDriver(request.trip_id);

      // Notify the company
      await Notification.create({
        user_id: company.user_id,
        title: 'Reassignment Approved',
        message: `Driver ${driver.first_name} ${driver.last_name} has approved the reassignment for the trip to ${trip.destination}. The trip is now pending.`
      });

    } else { // 'rejected'
      // Notify the company
      await Notification.create({
        user_id: company.user_id,
        title: 'Reassignment Rejected',
        message: `Driver ${driver.first_name} ${driver.last_name} has rejected the reassignment for the trip to ${trip.destination}.`
      });
    }

    res.json({ message: `Reassignment request has been ${status}.` });

  } catch (error) {
    console.error('Error responding to reassignment request:', error);
    res.status(500).json({ message: 'Failed to respond to reassignment request' });
  }
};

// Get report statistics for driver (all completed rides)
exports.getReportStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[Stats] Getting stats for user ID:', userId);
    
    const driver = await Driver.findByUserId(userId);
    console.log('[Stats] Driver found:', driver ? { id: driver.id, user_id: driver.user_id } : 'null');
    
    if (!driver || !driver.id) {
      console.log('[Stats] Driver not found or no driver ID');
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Get all completed trips for this driver (no date filters)
    const { pool } = require('../config/db');
    console.log('[Stats] Querying trips for driver ID:', driver.id);
    
    const [trips] = await pool.execute(
      `SELECT * FROM trips 
       WHERE driver_id = ? 
       AND status = 'completed'`,
      [driver.id]
    );

    console.log('[Stats] Found trips:', trips.length);

    const stats = {
      totalTrips: trips.length,
      totalEarnings: trips.reduce((sum, trip) => sum + parseFloat(trip.driver_price || 0), 0),
      totalPassengers: trips.reduce((sum, trip) => sum + parseInt(trip.passenger_count || 0), 0)
    };

    console.log('[Stats] Calculated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error getting report stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get report trips for driver
exports.getReportTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, visaNumber, companyName, reportType } = req.query;
    console.log('[Trips] Getting trips for user ID:', userId);
    console.log('[Trips] Query params:', { startDate, endDate, visaNumber, companyName, reportType });
    
    const driver = await Driver.findByUserId(userId);
    console.log('[Trips] Driver found:', driver ? { id: driver.id, user_id: driver.user_id } : 'null');
    
    if (!driver || !driver.id) {
      console.log('[Trips] Driver not found or no driver ID');
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Build dynamic WHERE clause and parameters
    let whereClause = 'WHERE t.driver_id = ? AND t.status = "completed"';
    let queryParams = [driver.id];

    // Add optional date filters
    if (startDate && endDate) {
      whereClause += ' AND t.trip_date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereClause += ' AND t.trip_date >= ?';
      queryParams.push(startDate);
    } else if (endDate) {
      whereClause += ' AND t.trip_date <= ?';
      queryParams.push(endDate);
    }

    // Add visa number filter
    if (visaNumber) {
      whereClause += ' AND t.visa_number LIKE ?';
      queryParams.push(`%${visaNumber}%`);
    }

    // Add company name filter
    if (companyName) {
      whereClause += ' AND c.company_name LIKE ?';
      queryParams.push(`%${companyName}%`);
    }

    console.log('[Trips] WHERE clause:', whereClause);
    console.log('[Trips] Query params:', queryParams);

    // Get trips with company info and visa number
    const { pool } = require('../config/db');
    const [trips] = await pool.execute(
      `SELECT t.*, c.company_name 
       FROM trips t 
       LEFT JOIN companies c ON t.company_id = c.id
       ${whereClause}
       ORDER BY t.trip_date DESC, t.departure_time DESC`,
      queryParams
    );

    console.log('[Trips] Found trips:', trips.length);
    res.json(trips);
  } catch (error) {
    console.error('Error getting report trips:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
