const Trip = require('../models/trip');
const Company = require('../models/company');
const Driver = require('../models/driver');
const Notification = require('../models/notification');
const TripRequest = require('../models/tripRequest');
const Rating = require('../models/rating');
const { pool } = require('../config/db');

// Get trip by ID
exports.getTripById = async (req, res) => {
  try {
    const tripId = req.params.id;
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Check authorization based on role
    if (req.user.role === 'company') {
      const company = await Company.findByUserId(req.user.id);
      if (!company || trip.company_id !== company.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findByUserId(req.user.id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      
      // Drivers can only view trips that are assigned to them or available
      if (trip.driver_id !== driver.id && trip.status !== 'pending') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new trip (company only)
exports.createTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const { pickup_location, destination, trip_date, departure_time, passenger_count, vehicle_type, price, visa_number, special_instructions } = req.body;
    
    const trip = {
      company_id: company.id,
      pickup_location,
      destination,
      trip_date,
      departure_time,
      passenger_count,
      vehicle_type,
      price,
      visa_number,
      special_instructions
    };
    
    const tripId = await Trip.create(trip);
    
    res.status(201).json({ 
      message: 'Trip created successfully',
      tripId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update trip (company only)
exports.updateTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    if (trip.company_id !== company.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (trip.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update trip that is already assigned or in progress' });
    }
    
    const { pickup_location, destination, trip_date, departure_time, passenger_count, vehicle_type, price, visa_number, special_instructions } = req.body;
    
    const updatedTrip = {
      pickup_location,
      destination,
      trip_date,
      departure_time,
      passenger_count,
      vehicle_type,
      price,
      visa_number,
      special_instructions
    };
    
    const updated = await Trip.update(tripId, updatedTrip);
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update trip' });
    }
    
    res.json({ message: 'Trip updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete trip (company only)
exports.deleteTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user.id;
    
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const deleted = await Trip.delete(tripId, company.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Trip not found or cannot be deleted' });
    }
    
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all trips for a company
exports.getCompanyTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findByUserId(userId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const trips = await Trip.getByCompanyId(company.id);
    
    res.json(trips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all trips for a driver
exports.getDriverTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findByUserId(userId);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get trips for this driver, optionally filtered by status
    const { status } = req.query;
    const trips = await Trip.findByDriverId(driver.id, status);
    
    // Enrich trips with company information
    const enrichedTrips = await Promise.all(trips.map(async trip => {
      const company = await Company.findById(trip.company_id);
      return {
        ...trip,
        company_name: company.company_name,
        company_contact: company.contact_person,
        company_phone: company.phone
      };
    }));
    
    res.json(enrichedTrips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available trips for a driver
exports.getAvailableTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get trips matching driver's vehicle type and without an assigned driver
    const availableTrips = await Trip.findAvailableForDriver(driver.vehicle_type);
    
    // Filter out trips that the driver has already requested
    const driverRequests = await TripRequest.findByDriverId(driver.id);
    const requestedTripIds = driverRequests.map(req => req.trip_id);
    
    const filteredTrips = availableTrips.filter(trip => 
      !requestedTripIds.includes(trip.id)
    );
    
    // Enrich trips with company information
    const enrichedTrips = await Promise.all(filteredTrips.map(async trip => {
      const company = await Company.findById(trip.company_id);
      return {
        ...trip,
        company_name: company.company_name,
        company_contact: company.contact_person,
        company_phone: company.phone,
        company_rating: company.rating
      };
    }));
    
    res.json(enrichedTrips);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start trip (driver only)
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

// Complete trip (driver only)
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
        const Rating = require('../models/rating');
        const ratingData = {
          trip_id: parseInt(tripId),
          rater_id: userId,
          rater_type: 'user',
          rated_id: trip.company_id,
          rated_type: 'company',
          rating: parseInt(rating),
          comment: comment || null
        };
        
        const ratingId = await Rating.create(ratingData);
        
        // Update company's average rating
        const Company = require('../models/company');
        const averageRating = await Rating.getCompanyAverageRating(trip.company_id);
        const ratingCount = await Rating.getCompanyRatings(trip.company_id);
        
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
    
    res.json({ message: 'Trip completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
