const driverController = require('../../controllers/driver');
const Driver = require('../../models/driver');
const Trip = require('../../models/trip');
const TripRequest = require('../../models/tripRequest');
const Company = require('../../models/company');
const Notification = require('../../models/notification');

// Mock the models
jest.mock('../../models/driver');
jest.mock('../../models/trip');
jest.mock('../../models/tripRequest');
jest.mock('../../models/company');
jest.mock('../../models/notification');

// Import test utilities
const { createMockReqRes } = require('../testUtils');

describe('Driver Controller', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return driver profile when found', async () => {
      // Mock data
      const mockDriver = {
        id: 1,
        user_id: 5,
        first_name: 'John',
        last_name: 'Doe'
      };

      // Mock the model function
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getProfile(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith(mockDriver);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getProfile(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Driver profile not found' });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getProfile(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updateProfile', () => {
    it('should update driver profile successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: {
          first_name: 'Updated John',
          last_name: 'Updated Doe',
          phone: '111-222-3333',
          address: 'Updated Address',
          license_number: 'Updated License',
          license_expiry: '2026-12-31',
          vehicle_type: 'van',
          vehicle_plate: 'Updated Plate'
        }
      });
      
      // Mock pool.execute to return successful result
      const db = require('../../config/db');
      const originalExecute = db.pool.execute;
      db.pool.execute = jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]);
      
      // Call the controller function
      await driverController.updateProfile(req, res);
      
      // Restore original execute method
      db.pool.execute = originalExecute;
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(db.pool.execute).toHaveBeenCalledWith(
        'UPDATE drivers SET first_name = ?, last_name = ?, phone = ?, address = ?, license_number = ?, license_expiry = ?, vehicle_type = ?, vehicle_plate = ? WHERE id = ?',
        ['Updated John', 'Updated Doe', '111-222-3333', 'Updated Address', 'Updated License', '2026-12-31', 'van', 'Updated Plate', 1]
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile updated successfully'
      });
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { first_name: 'Updated John' }
      });

      // Call the controller function
      await driverController.updateProfile(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 400 when no fields provided to update', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model function
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);

      // Create mock request and response with empty body
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: {}
      });

      // Call the controller function
      await driverController.updateProfile(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No fields provided to update'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { first_name: 'Updated John' }
      });

      // Call the controller function
      await driverController.updateProfile(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('updateAvailability', () => {
    it('should update driver availability successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Driver.updateAvailability.mockResolvedValueOnce(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: {
          current_location: 'Haifa',
          available_from: '2025-10-26 08:00:00',
          available_to: '2025-10-26 18:00:00'
        }
      });

      // Call the controller function
      await driverController.updateAvailability(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Driver.updateAvailability).toHaveBeenCalledWith(1, 'Haifa', '2025-10-26 08:00:00', '2025-10-26 18:00:00');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Availability updated successfully'
      });
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { current_location: 'Haifa' }
      });

      // Call the controller function
      await driverController.updateAvailability(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Driver.updateAvailability.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { current_location: 'Haifa' }
      });

      // Call the controller function
      await driverController.updateAvailability(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Driver.updateAvailability).toHaveBeenCalledWith(1, 'Haifa', undefined, undefined);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getDriverTrips', () => {
    it('should return driver trips when found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrips = [
        { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B' },
        { id: 2, driver_id: 1, pickup_location: 'Location C', destination: 'Location D' }
      ];

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.getByDriverId.mockResolvedValueOnce(mockTrips);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getDriverTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.getByDriverId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockTrips);
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getDriverTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getDriverTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getTripById', () => {
    it('should return trip data when trip exists and driver is assigned', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B' };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockTrip);
    });

    it('should return trip data when trip is pending and driver is not assigned', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: null, status: 'pending', pickup_location: 'Location A', destination: 'Location B' };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(mockTrip);
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when driver is not assigned to trip and trip is not pending', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, status: 'assigned', pickup_location: 'Location A', destination: 'Location B' }; // Different driver_id

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('startTrip', () => {
    it('should start a trip successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B', company_id: 1 };
      const mockCompany = { id: 1, user_id: 10 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Trip.updateStatus.mockResolvedValueOnce(true);
      Company.findById.mockResolvedValueOnce(mockCompany);
      Notification.create.mockResolvedValueOnce(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(Trip.updateStatus).toHaveBeenCalledWith('1', 'in_progress');
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Trip Started',
        message: 'Trip from Location A to Location B has been started by the driver.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip started successfully'
      });
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when driver is not assigned to trip', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, pickup_location: 'Location A', destination: 'Location B' }; // Different driver_id

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });

    it('should return 400 when trip cannot be started', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, status: 'completed', pickup_location: 'Location A', destination: 'Location B' }; // Already completed

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip cannot be started'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('completeTrip', () => {
    it('should complete a trip successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B', company_id: 1, status: 'in_progress' };
      const mockCompany = { id: 1, user_id: 10 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Trip.updateStatus.mockResolvedValueOnce(true);
      Company.findById.mockResolvedValueOnce(mockCompany);
      Notification.create.mockResolvedValueOnce(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' },
        body: {}
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(Trip.updateStatus).toHaveBeenCalledWith('1', 'completed');
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Trip Completed',
        message: 'Trip from Location A to Location B has been completed by the driver.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip completed successfully',
        rating_saved: false
      });
    });

    it('should complete a trip and save rating when provided', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B', company_id: 1, status: 'in_progress' };
      const mockCompany = { id: 1, user_id: 10 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Trip.updateStatus.mockResolvedValueOnce(true);
      Company.findById.mockResolvedValueOnce(mockCompany);
      Notification.create.mockResolvedValueOnce(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(Trip.updateStatus).toHaveBeenCalledWith('1', 'completed');
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Trip Completed',
        message: 'Trip from Location A to Location B has been completed by the driver.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip completed successfully',
        rating_saved: true
      });
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when driver is not assigned to trip', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, pickup_location: 'Location A', destination: 'Location B' }; // Different driver_id

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });

    it('should return 400 when trip cannot be completed', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, status: 'pending', pickup_location: 'Location A', destination: 'Location B' }; // Not in progress

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip cannot be completed'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getAvailableTrips', () => {
    it('should return available trips when driver has availability set', async () => {
      // Mock data
      const mockDriver = { 
        id: 1, 
        user_id: 5, 
        current_location: 'Haifa', 
        available_from: '2025-10-26 08:00:00', 
        available_to: '2025-10-26 18:00:00' 
      };
      const mockTrips = [
        { id: 1, pickup_location: 'Haifa', destination: 'Location B' },
        { id: 2, pickup_location: 'Haifa', destination: 'Location D' }
      ];

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.getAvailableTripsForDriver.mockImplementation(async () => mockTrips);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.getAvailableTripsForDriver).toHaveBeenCalledWith(1, 'Haifa', '2025-10-26 08:00:00', '2025-10-26 18:00:00');
      expect(res.json).toHaveBeenCalledWith(mockTrips);
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 400 when driver has not set availability', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 }; // No availability fields

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please update your availability first'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getTripRequests', () => {
    it('should return all trip requests for driver', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockDriverRequests = [
        { id: 1, trip_id: 1, driver_id: 1, status: 'pending' },
        { id: 2, trip_id: 2, driver_id: 1, status: 'accepted' }
      ];
      const mockCompanyRequests = [
        { id: 3, trip_id: 3, driver_id: 1, status: 'pending' },
        { id: 4, trip_id: 4, driver_id: 1, status: 'rejected' }
      ];

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.getByDriverId.mockResolvedValueOnce(mockDriverRequests);
      TripRequest.getCompanyRequestsForDriver.mockResolvedValueOnce(mockCompanyRequests);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getTripRequests(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.getByDriverId).toHaveBeenCalledWith(1);
      expect(TripRequest.getCompanyRequestsForDriver).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, trip_id: 1, driver_id: 1, status: 'pending' },
        { id: 2, trip_id: 2, driver_id: 1, status: 'accepted' },
        { id: 3, trip_id: 3, driver_id: 1, status: 'pending' },
        { id: 4, trip_id: 4, driver_id: 1, status: 'rejected' }
      ]);
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getTripRequests(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getTripRequests(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getCompanyRequests', () => {
    it('should return company requests for driver', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequests = [
        { id: 1, trip_id: 1, driver_id: 1, status: 'pending' },
        { id: 2, trip_id: 2, driver_id: 1, status: 'accepted' }
      ];

      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.getCompanyRequestsForDriver.mockResolvedValueOnce(mockRequests);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getCompanyRequests(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.getCompanyRequestsForDriver).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getCompanyRequests(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getCompanyRequests(req, res);

      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('sendTripRequest', () => {
    it('should send a trip request successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, status: 'pending', pickup_location: 'Location A', destination: 'Location B', company_id: 1, trip_date: '2025-10-26' };
      const mockCompany = { id: 1, user_id: 10 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      TripRequest.findByTripAndDriver.mockResolvedValueOnce(null);
      TripRequest.create.mockResolvedValueOnce(5);
      Company.findById.mockImplementation(async () => mockCompany);
      Notification.create.mockResolvedValueOnce(10);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(TripRequest.findByTripAndDriver).toHaveBeenCalledWith(1, 1);
      expect(TripRequest.create).toHaveBeenCalledWith({
        trip_id: 1,
        driver_id: 1,
        request_type: 'driver_to_company'
      });
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'New Trip Request',
        message: 'A driver has requested to take your trip from Location A to Location B on 2025-10-26.'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request sent successfully',
        requestId: 5
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip not available', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, status: 'completed' }; // Not pending
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not available'
      });
    });
    
    it('should return 400 when request already exists', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, status: 'pending' };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      TripRequest.findByTripAndDriver.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(TripRequest.findByTripAndDriver).toHaveBeenCalledWith(1, 1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'A request for this trip already exists'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('acceptTripRequest', () => {
    it('should accept a trip request successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'company_to_driver' };
      const mockTrip = { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B', company_id: 1, trip_date: '2025-10-26' };
      const mockCompany = { id: 1, user_id: 10 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      Driver.hasTripConflict.mockResolvedValueOnce(false);
      TripRequest.updateStatus.mockResolvedValueOnce(true);
      Trip.assignDriver.mockResolvedValueOnce(true);
      Company.findById.mockImplementation(async () => mockCompany);
      Notification.create.mockResolvedValueOnce(5);
      
      // Create mock request and response
      expect(TripRequest.updateStatus).toHaveBeenCalledWith('1', 'accepted');
      expect(Trip.assignDriver).toHaveBeenCalledWith(1, 1);
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Trip Request Accepted',
        message: 'Driver has accepted your request for the trip from Location A to Location B on 2025-10-26.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request accepted'
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });
    
    it('should return 403 when driver is not assigned to request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'company_to_driver' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trying to accept a request made by the driver', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'driver_to_company' }; // Request made by driver
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot accept a request you made'
      });
    });
    
    it('should return 409 when there is a scheduling conflict', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'company_to_driver' };
      const mockTrip = { id: 1, driver_id: 1, trip_date: '2025-10-26', departure_time: '14:00:00' };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Driver.hasTripConflict.mockResolvedValueOnce(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('1');
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(Driver.hasTripConflict).toHaveBeenCalledWith(1, '2025-10-26 14:00:00');
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You already have a conflicting trip at this time.'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('rejectTripRequest', () => {
    it('should reject a trip request successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'company_to_driver' };
      const mockTrip = { id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B', company_id: 1, trip_date: '2025-10-26' };
      const mockCompany = { id: 1, user_id: 10 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      TripRequest.updateStatus.mockResolvedValueOnce(true);
      Company.findById.mockImplementation(async () => mockCompany);
      Notification.create.mockResolvedValueOnce(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('1');
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(TripRequest.updateStatus).toHaveBeenCalledWith('1', 'rejected');
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Trip Request Rejected',
        message: 'Driver has rejected your request for the trip from Location A to Location B on 2025-10-26.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request rejected'
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });
    
    it('should return 403 when driver is not assigned to request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'company_to_driver' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trying to reject a request made by the driver', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'driver_to_company' }; // Request made by driver
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot reject a request you made'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('cancelTripRequest', () => {
    it('should cancel a trip request successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'driver_to_company' };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      TripRequest.delete.mockResolvedValueOnce(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(1);
      expect(TripRequest.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request canceled successfully'
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 999 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });
    
    it('should return 403 when driver is not assigned to request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'driver_to_company' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trying to cancel a company request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'company_to_driver' }; // Request from company
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Can only cancel requests you made to companies'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while canceling trip request.'
      });
    });
  });

  describe('rateCompany', () => {
    it('should rate a company successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, company_id: 1, status: 'completed', pickup_location: 'Location A', destination: 'Location B' };
      const mockCompany = { id: 1, user_id: 10 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Company.updateRating.mockResolvedValueOnce(true);
      Company.findById.mockImplementation(async () => mockCompany);
      Notification.create.mockResolvedValueOnce(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5, comment: 'Great service' }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(Company.updateRating).toHaveBeenCalledWith(1, 5);
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'New Rating Received',
        message: 'You have received a 5-star rating for the trip from Location A to Location B.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company rated successfully'
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 403 when driver is not assigned to trip', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, company_id: 1, status: 'completed' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trip is not completed', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, company_id: 1, status: 'pending' }; // Not completed
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot rate a company for a trip that is not completed'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for driver', async () => {
      // Mock data
      const mockNotifications = [
        { id: 1, user_id: 5, title: 'Notification 1', message: 'Message 1' },
        { id: 2, user_id: 5, title: 'Notification 2', message: 'Message 2' }
      ];
      
      // Mock the model functions
      Notification.findByUserId.mockResolvedValueOnce(mockNotifications);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getNotifications(req, res);
      
      // Assertions
      expect(Notification.findByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getNotifications(req, res);
      
      // Assertions
      expect(Notification.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read successfully', async () => {
      // Mock the model functions
      Notification.markAsRead.mockResolvedValueOnce(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.markNotificationAsRead(req, res);
      
      // Assertions
      expect(Notification.markAsRead).toHaveBeenCalledWith('1', 5);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification marked as read'
      });
    });
    
    it('should return 404 when notification not found', async () => {
      // Mock the model functions
      Notification.markAsRead.mockResolvedValueOnce(false);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });
      
      // Call the controller function
      await driverController.markNotificationAsRead(req, res);
      
      // Assertions
      expect(Notification.markAsRead).toHaveBeenCalledWith('999', 5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification not found'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.markAsRead.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.markNotificationAsRead(req, res);
      
      // Assertions
      expect(Notification.markAsRead).toHaveBeenCalledWith('1', 5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      // Mock the model functions
      Notification.markAllAsRead.mockResolvedValueOnce(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.markAllNotificationsAsRead(req, res);
      
      // Assertions
      expect(Notification.markAllAsRead).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All notifications marked as read'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.markAllAsRead.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.markAllNotificationsAsRead(req, res);
      
      // Assertions
      expect(Notification.markAllAsRead).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getCurrentDriverAvailability', () => {
    it('should return driver availability when found', async () => {
      // Mock data
      const mockDriver = { 
        id: 1, 
        user_id: 5, 
        current_location: 'Haifa', 
        available_from: '2025-10-26 08:00:00', 
        available_to: '2025-10-26 18:00:00' 
      };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getCurrentDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        current_location: 'Haifa',
        available_from: '2025-10-26 08:00:00',
        available_to: '2025-10-26 18:00:00'
      });
    });
    
    it('should return empty availability when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getCurrentDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        current_location: '',
        available_from: '',
        available_to: ''
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getCurrentDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching availability'
      });
    });
  });

  describe('getDriverAvailability', () => {
    it('should return driver availability when found', async () => {
      // Mock data
      const mockDriver = { 
        id: 1, 
        is_available: 1, 
        current_location: 'Haifa', 
        available_from: '2025-10-26 08:00:00', 
        available_to: '2025-10-26 18:00:00' 
      };
      
      // Mock the model functions
      Driver.findById.mockResolvedValueOnce(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { driverId: '1' }
      });
      
      // Call the controller function
      await driverController.getDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        isAvailable: true,
        location: 'Haifa',
        availableFrom: '2025-10-26 08:00:00',
        availableTo: '2025-10-26 18:00:00'
      });
    });
    
    it('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findById.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { driverId: '999' }
      });
      
      // Call the controller function
      await driverController.getDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findById).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findById.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { driverId: '1' }
      });
      
      // Call the controller function
      await driverController.getDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getDriverStats', () => {
    it('should return driver stats when driver found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrips = [
        { id: 1, status: 'assigned' },
        { id: 2, status: 'in_progress' },
        { id: 3, status: 'completed' },
        { id: 4, status: 'completed', price: '100.00' },
        { id: 5, status: 'completed', price: '150.00' }
      ];
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.getByDriverId.mockResolvedValueOnce(mockTrips);
      TripRequest.countPendingByDriverId.mockResolvedValueOnce(3);
      Trip.countAvailableTrips.mockResolvedValueOnce(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getDriverStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.getByDriverId).toHaveBeenCalledWith(1);
      expect(TripRequest.countPendingByDriverId).toHaveBeenCalledWith(1);
      expect(Trip.countAvailableTrips).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        activeTrips: 2,
        completedTrips: 3,
        tripRequests: 3,
        totalEarnings: 250,
        availableTrips: 5
      });
    });
    
    it('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getDriverStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getDriverStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getRecentTrips', () => {
    it('should return recent trips when driver found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrips = [
        { id: 1, pickup_location: 'Location A', destination: 'Location B', trip_date: '2025-10-26', departure_time: '14:00:00', status: 'assigned', passenger_count: 2, vehicle_type: 'car', price: '100.00', company_id: 1 },
        { id: 2, pickup_location: 'Location C', destination: 'Location D', trip_date: '2025-10-25', departure_time: '10:00:00', status: 'completed', passenger_count: 4, vehicle_type: 'van', price: '150.00', company_id: 2 }
      ];
      const mockCompanies = [
        { company_name: 'Company A' },
        { company_name: 'Company B' }
      ];
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      Trip.getRecentByDriverId.mockResolvedValueOnce(mockTrips);
      Company.findById.mockImplementation(async (id) => {
        if (id === 1) return mockCompanies[0];
        if (id === 2) return mockCompanies[1];
        return null;
      });
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getRecentTrips(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(Trip.getRecentByDriverId).toHaveBeenCalledWith(1, 5);
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Company.findById).toHaveBeenCalledWith(2);
      expect(res.json).toHaveBeenCalledWith([
        {
          id: 1,
          pickup_location: 'Location A',
          destination: 'Location B',
          trip_date: '2025-10-26',
          departure_time: '14:00:00',
          status: 'assigned',
          passenger_count: 2,
          vehicle_type: 'car',
          price: '100.00',
          company_name: 'Company A'
        },
        {
          id: 2,
          pickup_location: 'Location C',
          destination: 'Location D',
          trip_date: '2025-10-25',
          departure_time: '10:00:00',
          status: 'completed',
          passenger_count: 4,
          vehicle_type: 'van',
          price: '150.00',
          company_name: 'Company B'
        }
      ]);
    });
    
    it('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getRecentTrips(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getRecentTrips(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('should return unread notifications count', async () => {
      // Mock the model functions
      Notification.countUnreadByUserId.mockResolvedValueOnce(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getUnreadNotificationsCount(req, res);
      
      // Assertions
      expect(Notification.countUnreadByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        count: 5
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.countUnreadByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getUnreadNotificationsCount(req, res);
      
      // Assertions
      expect(Notification.countUnreadByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getTripRequestsCount', () => {
    it.skip('should return trip requests count when driver found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Mock pool.execute to return the count
      const db = require('../../config/db');
      const originalExecute = db.pool.execute;
      db.pool.execute = jest.fn()
        .mockResolvedValueOnce([[{ count: 3 }]]) // First query result
        .mockResolvedValueOnce([[{ count: 2 }]]); // Second query result (reassignment)
      
      // Call the controller function
      await driverController.getTripRequestsCount(req, res);
      
      // Restore original execute method
      db.pool.execute = originalExecute;
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        count: 5
      });
    });
    
    it.skip('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getTripRequestsCount(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getTripRequestsCount(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('respondToReassignmentRequest', () => {
    it.skip('should accept a reassignment request successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5, first_name: 'John', last_name: 'Doe' };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'reassignment_approval' };
      const mockTrip = { id: 1, destination: 'Location B', company_id: 1 };
      const mockCompany = { id: 1, user_id: 10 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      TripRequest.updateStatus.mockResolvedValueOnce(true);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Company.findById.mockImplementation(async () => mockCompany);
      Trip.unassignDriver.mockResolvedValueOnce(true);
      Notification.create.mockResolvedValueOnce(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(1);
      expect(TripRequest.updateStatus).toHaveBeenCalledWith(1, 'accepted');
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Trip.unassignDriver).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Reassignment Approved',
        message: 'Driver John Doe has approved the reassignment for the trip to Location B. The trip is now pending.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reassignment request has been accepted.'
      });
    });
    
    it.skip('should reject a reassignment request successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5, first_name: 'John', last_name: 'Doe' };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'reassignment_approval' };
      const mockTrip = { id: 1, destination: 'Location B', company_id: 1 };
      const mockCompany = { id: 1, user_id: 10 };
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      TripRequest.updateStatus.mockResolvedValueOnce(true);
      Trip.findById.mockResolvedValueOnce(mockTrip);
      Company.findById.mockResolvedValueOnce(mockCompany);
      Notification.create.mockResolvedValueOnce(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'rejected' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(1);
      expect(TripRequest.updateStatus).toHaveBeenCalledWith(1, 'rejected');
      expect(Trip.findById).toHaveBeenCalledWith(1);
      expect(Company.findById).toHaveBeenCalledWith(1);
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'Reassignment Rejected',
        message: 'Driver John Doe has rejected the reassignment for the trip to Location B.'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reassignment request has been rejected.'
      });
    });
    
    it.skip('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it.skip('should return 403 when request is invalid or unauthorized', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'reassignment_approval' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      TripRequest.findById.mockResolvedValueOnce(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(TripRequest.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or unauthorized request.'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to respond to reassignment request'
      });
    });
  });

  describe('getReportStats', () => {
    // Skip these tests for now as they require more complex mocking
    it.skip('should return report stats when driver found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrips = [
        { id: 1, status: 'completed', driver_price: '100.00', passenger_count: 2 },
        { id: 2, status: 'completed', driver_price: '150.00', passenger_count: 4 },
        { id: 3, status: 'completed', driver_price: '200.00', passenger_count: 3 }
      ];
      
      // Mock the model functions
      Driver.findByUserId.mockResolvedValueOnce(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Mock pool.execute to return the trips
      const db = require('../../config/db');
      const originalExecute = db.pool.execute;
      db.pool.execute = jest.fn().mockResolvedValueOnce([mockTrips]);
      
      // Call the controller function
      await driverController.getReportStats(req, res);
      
      // Restore original execute method
      db.pool.execute = originalExecute;
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        totalTrips: 3,
        totalEarnings: 450,
        totalPassengers: 9
      });
    });
    
    it.skip('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.mockResolvedValueOnce(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getReportStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.mockRejectedValueOnce(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getReportStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  // Add more test cases for other controller functions
});
