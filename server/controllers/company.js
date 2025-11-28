const Company = require('../models/company');
const Trip = require('../models/trip');
const Driver = require('../models/driver');
const TripRequest = require('../models/tripRequest');
const Notification = require('../models/notification');
const Rating = require('../models/rating');
const DebugLog = require('../models/debugLog'); // For temporary debugging
const { pool } = require('../config/db');

// Get company profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update company profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    await Company.updateProfile(userId, updates);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all trips for a company
exports.getTrips = async (req, res) => {
  DebugLog.add({ level: 'info', message: '--- Executing getTrips ---' });
  try {
    const userId = req.user.id;
    DebugLog.add({ level: 'info', message: `[getTrips] Authenticated user ID: ${userId}` });

    const company = await Company.findByUserId(userId);
    DebugLog.add({ level: 'info', message: '[getTrips] Fetched company', data: company ? { id: company.id, name: company.company_name } : 'Not Found' });

    if (!company) {
      DebugLog.add({ level: 'warn', message: '[getTrips] Company not found, returning 404.' });
      return res.status(404).json({ message: 'Company not found' });
    }

    const { status } = req.query;
    DebugLog.add({ level: 'info', message: `[getTrips] Fetching trips for company ID: ${company.id} with status: ${status || 'all'}` });

    const trips = await Trip.getByCompanyId(company.id, status);
    DebugLog.add({ level: 'info', message: `[getTrips] Found ${trips ? trips.length : 0} trips.` });

    // Format trip_date and departure_time
    const formattedTrips = trips.map(trip => {
      const newTrip = { ...trip };
      if (newTrip.trip_date) {
        // Ensure date is in YYYY-MM-DD format
        newTrip.trip_date = new Date(newTrip.trip_date).toISOString().split('T')[0];
      }
      if (newTrip.departure_time) {
        newTrip.departure_time = newTrip.departure_time.substring(0, 5);
      }
      return newTrip;
    });

    res.json(formattedTrips);
    DebugLog.add({ level: 'info', message: '--- getTrips execution finished successfully ---' });
  } catch (error) {
    DebugLog.add({ level: 'error', message: '!!! ERROR in getTrips controller:', data: { message: error.message, stack: error.stack } });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single trip by ID
exports.getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to access this trip' });
    }
    if (trip.driver_id) {
      const driver = await Driver.findById(trip.driver_id);
      trip.driver = driver;
    }
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new trip
exports.createTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    let { pickup_location, destination, trip_date, departure_time, passenger_count, vehicle_type, company_price, driver_price, visa_number } = req.body;

    // Ensure trip_date is treated as a string and any time part is removed.
    if (trip_date) {
      trip_date = trip_date.split('T')[0];
    }

    // Check for duplicate visa_number for the same company
    if (visa_number) {
      const existingTrip = await Trip.findByVisaNumberAndCompany(visa_number, company.id);
      if (existingTrip) {
        return res.status(409).json({ message: 'A trip with this visa number already exists for your company.' });
      }
    }

    const newTrip = {
      company_id: company.id,
      pickup_location,
      destination,
      trip_date,
      departure_time,
      passenger_count,
      vehicle_type,
      company_price,
      driver_price,
      visa_number,
      status: 'pending'
    };

    console.log('[DEBUG] Creating trip with status:', newTrip.status);
    const tripId = await Trip.create(newTrip);
    console.log('[DEBUG] Trip created successfully with ID:', tripId);
    res.status(201).json({ message: 'Trip created successfully', trip_id: tripId });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a trip
exports.updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }
    let { pickup_location, destination, trip_date, departure_time, passenger_count, vehicle_type, company_price, driver_price, visa_number, driver_id, status } = req.body;

    // Ensure trip_date is treated as a string and any time part is removed.
    if (trip_date) {
      trip_date = trip_date.split('T')[0];
    }
    const tripData = {
      pickup_location,
      destination,
      trip_date,
      departure_time,
      passenger_count,
      vehicle_type,
      company_price,
      driver_price,
      visa_number,
      driver_id,
      status
    };

    // Filter out undefined values to prevent SQL errors
    const tripUpdates = Object.entries(tripData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const updated = await Trip.update(tripId, tripUpdates);
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update trip' });
    }
    res.json({ message: 'Trip updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a trip
exports.cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this trip' });
    }
    const updated = await Trip.updateStatus(tripId, 'cancelled');
    if (!updated) {
      return res.status(500).json({ message: 'Failed to cancel trip' });
    }
    if (trip.driver_id) {
      const driver = await Driver.findById(trip.driver_id);
      if (driver) {
        await Notification.create({
          user_id: driver.user_id,
          title: 'Trip Cancelled',
          message: `The trip from ${trip.pickup_location} to ${trip.destination} scheduled for ${trip.trip_date} has been cancelled by the company.`
        });
      }
    }
    res.json({ message: 'Trip cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to delete this trip' });
    }
    const deleted = await Trip.delete(tripId, company.id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete trip' });
    }
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available drivers for a trip
exports.getAvailableDrivers = async (req, res) => {
  try {
    console.log(`[DEBUG] getAvailableDrivers called for trip ID: ${req.params.tripId}`);
    
    const { tripId } = req.params;
    const userId = req.user.id;
    
    console.log(`[DEBUG] User ID: ${userId}`);
    
    // Verify company ownership of the trip
    const company = await Company.findByUserId(userId);
    if (!company) {
      console.log(`[DEBUG] Company not found for user ID: ${userId}`);
      return res.status(404).json({ message: 'Company not found' });
    }
    console.log(`[DEBUG] Company found: ${company.id} - ${company.company_name}`);

    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.log(`[DEBUG] Trip not found for ID: ${tripId}`);
      return res.status(404).json({ message: 'Trip not found' });
    }
    console.log(`[DEBUG] Trip found: ${trip.id} - ${trip.pickup_location} to ${trip.destination}`);
    
    if (trip.company_id !== company.id) {
      console.log(`[DEBUG] Trip company ID (${trip.company_id}) does not match user's company ID (${company.id})`);
      return res.status(403).json({ message: 'Not authorized to access this trip' });
    }
    
    // Use the Trip model function that properly excludes rejected drivers
    console.log(`[DEBUG] Calling Trip.getAvailableDriversForTrip(${tripId})`);
    const availableDrivers = await Trip.getAvailableDriversForTrip(tripId);
    console.log(`[DEBUG] Found ${availableDrivers.length} available drivers`);
    
    res.json(availableDrivers);

  } catch (error) {
    console.error('Error in getAvailableDrivers:', error);
    res.status(500).json({ message: 'Server error while fetching available drivers.' });
  }
};

// Get drivers who requested this specific trip (for edit trip assignment)
exports.getRequestingDrivers = async (req, res) => {
  try {
    
    const { tripId } = req.params;
    const userId = req.user.id;
    
    // Verify company ownership of the trip
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to access this trip' });
    }
    
    // Get only drivers who have requested this trip
    const requestingDrivers = await Trip.getRequestingDriversForTrip(tripId);
    
    
    res.json(requestingDrivers);

  } catch (error) {
    console.error('Error in getRequestingDrivers:', error);
    res.status(500).json({ message: 'Server error while fetching requesting drivers.' });
  }
};

// Send request to a driver for a trip
exports.sendDriverRequest = async (req, res) => {
  try {
    const { trip_id: tripId, driver_id: driverId } = req.body;
    const userId = req.user.id;
    
    
    // Validate required parameters
    if (!tripId || !driverId) {
      return res.status(400).json({ 
        message: 'Missing required parameters: trip_id and driver_id are required',
        received: { tripId, driverId }
      });
    }
    
    // Validate trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Find company
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Check for existing request
    const [existingRequests] = await pool.execute(
      'SELECT * FROM trip_requests WHERE trip_id = ? AND driver_id = ?',
      [tripId, driverId]
    );
    
    if (existingRequests.length > 0) {
      return res.status(400).json({ 
        message: 'A request already exists for this trip and driver',
        requestId: existingRequests[0].id 
      });
    }
    
    // Create the new request
    const newRequest = { trip_id: tripId, driver_id: driverId, request_type: 'company_to_driver', status: 'pending' };
    const requestId = await TripRequest.create(newRequest);
    
    // Create notification for the driver
    await Notification.create({
      user_id: driver.user_id,
      title: 'New Trip Request',
      message: `You have a new trip request from ${company.company_name}.`
    });
    
    // Check if the request was actually created
    const [verifyRequest] = await pool.execute(
      'SELECT * FROM trip_requests WHERE id = ?',
      [requestId]
    );
    
    
    res.status(201).json({ message: 'Trip request sent successfully', requestId });
  } catch (error) {
    console.error('[Company Controller] Error sending driver request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trip requests for a company (both driver-initiated and company-initiated)
exports.getTripRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Get all trip requests for this company without filtering by type
    const tripRequests = await TripRequest.getByCompanyId(company.id, null);
    
    
    res.json(tripRequests);
  } catch (error) {
    console.error('[Company Controller] Error getting trip requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get only driver-initiated requests for a company
exports.getDriverRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Get only driver-to-company requests
    const tripRequests = await TripRequest.getByCompanyId(company.id, 'driver_to_company');
    
    
    res.json(tripRequests);
  } catch (error) {
    console.error('[Company Controller] Error getting driver requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Respond to a driver's trip request
exports.respondToTripRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    console.log(`[Company Controller] Responding to trip request ${requestId} with status: ${status}`);
    
    const request = await TripRequest.findById(requestId);
    if (!request) {
      console.log(`[Company Controller] Trip request ${requestId} not found`);
      return res.status(404).json({ message: 'Trip request not found' });
    }
    
    const trip = await Trip.findById(request.trip_id);
    if (!trip) {
      console.log(`[Company Controller] Trip ${request.trip_id} not found`);
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    if (status === 'accepted') {
      // Check for scheduling conflicts before assigning
      const tripDateTime = `${new Date(trip.trip_date).toISOString().slice(0, 10)} ${trip.departure_time}`;
      const hasConflict = await Driver.hasTripConflict(request.driver_id, tripDateTime);

      if (hasConflict) {
        return res.status(409).json({ message: 'This driver already has a conflicting trip at the selected time.' });
      }

      // A driver can be assigned to a pending, assigned, or in-progress trip.
      // A driver cannot be assigned if the trip is already completed or cancelled.
      if (['completed', 'cancelled'].includes(trip.status)) {
        console.log(`[Company Controller] Cannot assign driver to ${trip.status} trip`);
        return res.status(409).json({ 
          message: `This trip is already ${trip.status} and cannot be assigned.` 
        });
      }

      console.log(`[Company Controller] Accepting request ${requestId} - Assigning driver ${request.driver_id} to trip ${trip.id}`);
      // Use a transaction to ensure atomicity
      await Trip.assignDriverAndRejectOthers(request.trip_id, request.driver_id, requestId);

    } else {
      // If rejecting, update the request status
      console.log(`[Company Controller] Rejecting request ${requestId}`);
      await TripRequest.updateStatus(requestId, status);
    }
    
    // Find driver to send notification
    const driver = await Driver.findById(request.driver_id);
    if (driver) {
      console.log(`[Company Controller] Sending notification to driver ${driver.id} (user: ${driver.user_id})`);
      
      // Create notification with more detailed message
      await Notification.create({
        user_id: driver.user_id,
        title: `Trip Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
        message: `Your request for the trip from ${trip.pickup_location} to ${trip.destination} on ${trip.trip_date} has been ${status === 'accepted' ? 'accepted' : 'rejected'}.`
      });
    }
    
    // Fetch updated stats to send back to the client
    const company = await Company.findByUserId(req.user.id);
    const [pendingTripsCount, activeTripsCount, completedTripsCount, tripRequests, availableDriversCount, unreadNotificationsCount, allTrips] = await Promise.all([
      Trip.countByCompanyIdAndStatus(company.id, 'pending'),
      Trip.countByCompanyIdAndStatus(company.id, 'assigned') + Trip.countByCompanyIdAndStatus(company.id, 'in_progress'),
      Trip.countByCompanyIdAndStatus(company.id, 'completed'),
      TripRequest.getByCompanyId(company.id, 'driver_to_company'),
      Driver.countAllApproved(),
      Notification.countUnreadByUserId(req.user.id),
      Trip.getByCompanyId(company.id)
    ]);

    const updatedStats = {
      activeTrips: activeTripsCount,
      pendingTrips: pendingTripsCount,
      completedTrips: completedTripsCount,
      driverRequests: tripRequests.length,
      totalTrips: allTrips.length,
      availableDrivers: availableDriversCount,
      unreadNotifications: unreadNotificationsCount
    };

    res.json({ 
      message: `Trip request ${status} successfully`,
      updatedStats
    });
  } catch (error) {
    console.error('[Company Controller] Error responding to trip request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel (delete) a trip request
exports.cancelTripRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    console.log(`[Company Controller] Canceling (deleting) trip request ${requestId}`);
    
    const request = await TripRequest.findById(requestId);
    if (!request) {
      console.log(`[Company Controller] Trip request ${requestId} not found`);
      return res.status(404).json({ message: 'Trip request not found' });
    }
    
    // Verify company ownership of the trip
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    if (request.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }
    
    // Delete the trip request completely
    const deleted = await TripRequest.delete(requestId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to cancel trip request' });
    }
    
    console.log(`[Company Controller] Successfully deleted trip request ${requestId}`);
    
    res.status(200).json({ 
      message: 'Trip request canceled successfully'
    });
  } catch (error) {
    console.error('Error in cancelTripRequest:', error);
    res.status(500).json({ message: 'Server error while canceling trip request.' });
  }
};


// Rate a driver for a trip
exports.rateDriver = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    const trip = await Trip.findById(tripId);
    if (!trip || trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Not authorized to rate this trip' });
    }
    const newRating = { trip_id: tripId, rater_id: company.id, rater_type: 'company', rated_id: trip.driver_id, rated_type: 'driver', rating, comment };
    const ratingId = await Rating.create(newRating);
    await Driver.updateRating(trip.driver_id);
    const driver = await Driver.findById(trip.driver_id);
    if (driver) {
      await Notification.create({
        user_id: driver.user_id,
        title: 'New Rating',
        message: `You have received a new rating of ${rating} for a trip.`
      });
    }
    res.status(201).json({ message: 'Driver rated successfully', ratingId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get company dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const [pendingTripsCount, assignedTripsCount, inProgressTripsCount, completedTripsCount, tripRequests, availableDriversCount, unreadNotificationsCount, allTrips] = await Promise.all([
      Trip.countByCompanyIdAndStatus(company.id, 'pending'),
      Trip.countByCompanyIdAndStatus(company.id, 'assigned'),
      Trip.countByCompanyIdAndStatus(company.id, 'in_progress'),
      Trip.countByCompanyIdAndStatus(company.id, 'completed'),
      TripRequest.getByCompanyId(company.id, 'driver_to_company'),
      Driver.countAllApproved(),
      Notification.countUnreadByUserId(userId),
      Trip.getByCompanyId(company.id)
    ]);

    const activeTripsCount = assignedTripsCount + inProgressTripsCount;

    const stats = {
      activeTrips: activeTripsCount,
      pendingTrips: pendingTripsCount,
      completedTrips: completedTripsCount,
      driverRequests: tripRequests.length,
      totalRevenue: allTrips
        .filter(trip => trip.status === 'completed')
        .reduce((sum, trip) => {
          const companyPrice = parseFloat(trip.company_price) || 0;
          const driverPrice = parseFloat(trip.driver_price) || 0;
          const revenue = companyPrice - driverPrice;
          return sum + revenue;
        }, 0),
      totalTrips: allTrips.length,
      availableDrivers: availableDriversCount,
      averageRating: company.rating,
      recentTrips: allTrips.slice(0, 5),
      unreadNotifications: unreadNotificationsCount
    };

    res.json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate reports for company
exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, reportType, visaNumber, driverEmail } = req.query;
    const company = await Company.findByUserId(userId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Validate input
    if (!visaNumber && !driverEmail && (!startDate || !endDate)) {
      return res.status(400).json({ message: 'A date range, visa number, or driver email is required.' });
    }
    
    // Get trips within date range
    const trips = await Trip.getByDateRange(
      userId, 
      'company',
      startDate, 
      endDate,
      { visaNumber, driverEmail }
    );
    
    let reportData = {};
    
    // Determine report type from path
    const path = req.path; // e.g., /stats, /trips, /drivers

    if (path.endsWith('/stats')) {
      const monthlyData = {};
      
      trips.forEach(trip => {
        const month = trip.trip_date.substring(0, 7); // YYYY-MM format
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            totalRevenue: 0,
            tripCount: 0,
            completedCount: 0,
            cancelledCount: 0
          };
        }
        
        monthlyData[month].tripCount++;
        
        if (trip.status === 'completed') {
          monthlyData[month].totalRevenue += (parseFloat(trip.company_price) || 0) - (parseFloat(trip.driver_price) || 0);
          monthlyData[month].completedCount++;
        } else if (trip.status === 'cancelled') {
          monthlyData[month].cancelledCount++;
        }
      });
      
      reportData = {
        monthlyData,
        totalRevenue: trips
          .filter(trip => trip.status === 'completed')
          .reduce((sum, trip) => sum + ((parseFloat(trip.company_price) || 0) - (parseFloat(trip.driver_price) || 0)), 0),
        totalTrips: trips.length,
        completedTrips: trips.filter(trip => trip.status === 'completed').length,
        cancelledTrips: trips.filter(trip => trip.status === 'cancelled').length
      };
    } else if (path.endsWith('/drivers')) {
      const completedTrips = trips.filter(trip => 
        trip.status === 'completed' && trip.driver_id
      );
      
      const driverIds = [...new Set(completedTrips.map(trip => trip.driver_id))];
      
      const driverData = await Promise.all(driverIds.map(async driverId => {
        const driver = await Driver.findById(driverId);
        const driverTrips = completedTrips.filter(trip => trip.driver_id === driverId);
        
        const ratings = await Rating.findByRaterAndRated(
          company.id, 'company', driverId, 'driver'
        );
        
        const totalRevenue = driverTrips.reduce(
          (sum, trip) => sum + ((parseFloat(trip.company_price) || 0) - (parseFloat(trip.driver_price) || 0)), 0
        );
        
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / ratings.length 
          : 0;
        
        return {
          driverId,
          driverName: `${driver.first_name} ${driver.last_name}`,
          tripCount: driverTrips.length,
          totalRevenue,
          averageRating,
          ratingsCount: ratings.length
        };
      }));
      
      reportData = {
        driverData,
        totalDrivers: driverIds.length,
        totalTrips: completedTrips.length,
        totalRevenue: completedTrips.reduce(
          (sum, trip) => sum + ((parseFloat(trip.company_price) || 0) - (parseFloat(trip.driver_price) || 0)), 0
        )
      };
    } else if (path.endsWith('/trips')) {
      const tripData = await Promise.all(trips.map(async trip => {
        let driverName = 'No Driver';
        
        if (trip.driver_id) {
          const driver = await Driver.findById(trip.driver_id);
          driverName = `${driver.first_name} ${driver.last_name}`;
        }
        
        return {
          ...trip,
          driverName,
        };
      }));
      
      reportData = {
        trips: tripData,
        totalTrips: trips.length,
      };
    } else {
      // Default to a summary trip data
      reportData = {
        trips: await Promise.all(trips.map(async trip => {
          let driverName = 'No Driver';
          
          if (trip.driver_id) {
            const driver = await Driver.findById(trip.driver_id);
            if (driver) {
              driverName = `${driver.first_name} ${driver.last_name}`;
            }
          }
          
          return {
            ...trip,
            driverName
          };
        })),
        totalTrips: trips.length,
        pendingTrips: trips.filter(trip => trip.status === 'pending').length,
        inProgressTrips: trips.filter(trip => ['assigned', 'in_progress'].includes(trip.status)).length,
        completedTrips: trips.filter(trip => trip.status === 'completed').length,
        cancelledTrips: trips.filter(trip => trip.status === 'cancelled').length
      };
    }
    
    res.json(reportData);
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
    const { id } = req.params;
    const userId = req.user.id;
    await Notification.markAsRead(id, userId);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread notifications count
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countUnreadByUserId(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error in getUnreadNotificationsCount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trip requests count
exports.getTripRequestsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Count trip requests from drivers to company
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM trip_requests tr 
       JOIN trips t ON tr.trip_id = t.id 
       WHERE t.company_id = ? AND tr.request_type = 'driver_to_company' AND tr.status = 'pending'`,
      [company.id]
    );
    
    const count = rows[0].count;
    res.json({ count });
  } catch (error) {
    console.error('Error in getTripRequestsCount:', error);
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

// Get all approved drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.getAllApproved();
    res.json(drivers);
  } catch (error) {
    console.error('Error in getAllDrivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Simple endpoint that just returns all drivers for a trip
exports.getAllDriversForTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    console.log(`[DEBUG] getAllDriversForTrip called for trip ID: ${tripId}`);
    
    // Get all drivers
    const [allDrivers] = await pool.execute(
      `SELECT d.*, u.username, u.email
       FROM drivers d
       JOIN users u ON d.user_id = u.id
       WHERE u.is_approved = TRUE`
    );
    
    console.log(`[DEBUG] Found ${allDrivers.length} drivers`);
    res.json(allDrivers);
  } catch (error) {
    console.error('Error in getAllDriversForTrip:', error);
    res.status(500).json({ message: 'Server error while fetching drivers.' });
  }
};

// Request to re-assign a driver from an active trip
exports.requestDriverReassignment = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const trip = await Trip.findById(tripId);

    // Validate the trip
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'You are not authorized to modify this trip' });
    }
    if (!trip.driver_id) {
      return res.status(400).json({ message: 'No driver is currently assigned to this trip.' });
    }
    if (!['assigned', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ message: `Cannot request reassignment for a trip with status '${trip.status}'.` });
    }

    // Create a reassignment request for the current driver
    const newRequest = {
      trip_id: tripId,
      driver_id: trip.driver_id,
      request_type: 'reassignment_approval',
      status: 'pending'
    };
    const requestId = await TripRequest.create(newRequest);

    // Notify the current driver
    const driver = await Driver.findById(trip.driver_id);
    if (driver) {
      await Notification.create({
        user_id: driver.user_id,
        title: 'Reassignment Request',
        message: `Your company has requested to reassign you from the trip to ${trip.destination}. Please respond.`
      });
    }

    res.status(201).json({ message: 'Reassignment request sent to the current driver.', requestId });

  } catch (error) {
    console.error('Error requesting driver reassignment:', error);
    res.status(500).json({ message: 'Failed to request driver reassignment' });
  }
};
