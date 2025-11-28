const driverController = require('../../controllers/driver');
const Driver = require('../../models/driver');
const Trip = require('../../models/trip');
const TripRequest = require('../../models/tripRequest');
const Company = require('../../models/company');
const Notification = require('../../models/notification');
const sinon = require('sinon');
const { expect } = require('chai');

// Mock the models
// Converted from jest.mock - use sinon.stub instead
// '../../models/driver';
// Converted from jest.mock - use sinon.stub instead
// '../../models/trip';
// Converted from jest.mock - use sinon.stub instead
// '../../models/tripRequest';
// Converted from jest.mock - use sinon.stub instead
// '../../models/company';
// Converted from jest.mock - use sinon.stub instead
// '../../models/notification';

// Import test utilities
const { createMockReqRes } = require('../testUtils');

describe('Driver Controller', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
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
      Driver.findByUserId.resolves(mockDriver);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getProfile(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.json.calledWith(mockDriver)).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getProfile(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Driver profile not found' })).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getProfile(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Server error' })).to.be.true;
    });
  });

  describe('updateProfile', () => {
    it('should update driver profile successfully', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      
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
      db.pool.execute = sinon.stub().resolves([{ affectedRows: 1 }]);
      
      // Call the controller function
      await driverController.updateProfile(req, res);
      
      // Restore original execute method
      db.pool.execute = originalExecute;
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
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
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { first_name: 'Updated John' }
      });

      // Call the controller function
      await driverController.updateProfile(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 400 when no fields provided to update', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model function
      Driver.findByUserId.resolves(mockDriver);

      // Create mock request and response with empty body
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: {}
      });

      // Call the controller function
      await driverController.updateProfile(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'No fields provided to update'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { first_name: 'Updated John' }
      });

      // Call the controller function
      await driverController.updateProfile(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Driver.updateAvailability.resolves(true);

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
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Driver.updateAvailability.calledWith(1, 'Haifa', '2025-10-26 08:00:00', '2025-10-26 18:00:00')).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Availability updated successfully'
      });
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { current_location: 'Haifa' }
      });

      // Call the controller function
      await driverController.updateAvailability(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.resolves(mockDriver);
      Driver.updateAvailability.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { current_location: 'Haifa' }
      });

      // Call the controller function
      await driverController.updateAvailability(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Driver.updateAvailability.calledWith(1, 'Haifa', undefined, undefined)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.getByDriverId.resolves(mockTrips);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getDriverTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.getByDriverId.calledWith(1)).to.be.true;
      expect(res.json.calledWith(mockTrips)).to.be.true;
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getDriverTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getDriverTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.json.calledWith(mockTrip)).to.be.true;
    });

    it('should return trip data when trip is pending and driver is not assigned', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: null, status: 'pending', pickup_location: 'Location A', destination: 'Location B' };

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.json.calledWith(mockTrip)).to.be.true;
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when driver is not assigned to trip and trip is not pending', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, status: 'assigned', pickup_location: 'Location A', destination: 'Location B' }; // Different driver_id

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.getTripById(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      Trip.updateStatus.resolves(true);
      Company.findById.resolves(mockCompany);
      Notification.create.resolves(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Trip.updateStatus.calledWith('1', 'in_progress')).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when driver is not assigned to trip', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, pickup_location: 'Location A', destination: 'Location B' }; // Different driver_id

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });

    it('should return 400 when trip cannot be started', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, status: 'completed', pickup_location: 'Location A', destination: 'Location B' }; // Already completed

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip cannot be started'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.startTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      Trip.updateStatus.resolves(true);
      Company.findById.resolves(mockCompany);
      Notification.create.resolves(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' },
        body: {}
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Trip.updateStatus.calledWith('1', 'completed')).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      Trip.updateStatus.resolves(true);
      Company.findById.resolves(mockCompany);
      Notification.create.resolves(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Trip.updateStatus.calledWith('1', 'completed')).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when driver is not assigned to trip', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, pickup_location: 'Location A', destination: 'Location B' }; // Different driver_id

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });

    it('should return 400 when trip cannot be completed', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, status: 'pending', pickup_location: 'Location A', destination: 'Location B' }; // Not in progress

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip cannot be completed'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });

      // Call the controller function
      await driverController.completeTrip(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.getAvailableTripsForDriver.callsFake(async () => mockTrips);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.getAvailableTripsForDriver.calledWith(1, 'Haifa', '2025-10-26 08:00:00', '2025-10-26 18:00:00')).to.be.true;
      expect(res.json.calledWith(mockTrips)).to.be.true;
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 400 when driver has not set availability', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 }; // No availability fields

      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please update your availability first'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getAvailableTrips(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.getByDriverId.resolves(mockDriverRequests);
      TripRequest.getCompanyRequestsForDriver.resolves(mockCompanyRequests);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getTripRequests(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.getByDriverId.calledWith(1)).to.be.true;
      expect(TripRequest.getCompanyRequestsForDriver.calledWith(1)).to.be.true;
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, trip_id: 1, driver_id: 1, status: 'pending' },
        { id: 2, trip_id: 2, driver_id: 1, status: 'accepted' },
        { id: 3, trip_id: 3, driver_id: 1, status: 'pending' },
        { id: 4, trip_id: 4, driver_id: 1, status: 'rejected' }
      ]);
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getTripRequests(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getTripRequests(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.getCompanyRequestsForDriver.resolves(mockRequests);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getCompanyRequests(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.getCompanyRequestsForDriver.calledWith(1)).to.be.true;
      expect(res.json.calledWith(mockRequests)).to.be.true;
    });

    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getCompanyRequests(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });

      // Call the controller function
      await driverController.getCompanyRequests(req, res);

      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      TripRequest.findByTripAndDriver.resolves(null);
      TripRequest.create.resolves(5);
      Company.findById.callsFake(async () => mockCompany);
      Notification.create.resolves(10);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(TripRequest.findByTripAndDriver.calledWith(1, 1)).to.be.true;
      expect(TripRequest.create).toHaveBeenCalledWith({
        trip_id: 1,
        driver_id: 1,
        request_type: 'driver_to_company'
      });
      expect(Company.findById.calledWith(1)).to.be.true;
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 10,
        title: 'New Trip Request',
        message: 'A driver has requested to take your trip from Location A to Location B on 2025-10-26.'
      });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request sent successfully',
        requestId: 5
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip not available', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, status: 'completed' }; // Not pending
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      TripRequest.findByTripAndDriver.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(TripRequest.findByTripAndDriver.calledWith(1, 1)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'A request for this trip already exists'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1 }
      });
      
      // Call the controller function
      await driverController.sendTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      Driver.hasTripConflict.resolves(false);
      TripRequest.updateStatus.resolves(true);
      Trip.assignDriver.resolves(true);
      Company.findById.callsFake(async () => mockCompany);
      Notification.create.resolves(5);
      
      // Create mock request and response
      expect(TripRequest.updateStatus.calledWith('1', 'accepted')).to.be.true;
      expect(Trip.assignDriver.calledWith(1, 1)).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });
    
    it('should return 403 when driver is not assigned to request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'company_to_driver' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trying to accept a request made by the driver', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'driver_to_company' }; // Request made by driver
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      Trip.findById.resolves(mockTrip);
      Driver.hasTripConflict.resolves(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(Driver.hasTripConflict.calledWith(1, '2025-10-26 14:00:00')).to.be.true;
      expect(res.status.calledWith(409)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'You already have a conflicting trip at this time.'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.acceptTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      Trip.findById.resolves(mockTrip);
      TripRequest.updateStatus.resolves(true);
      Company.findById.callsFake(async () => mockCompany);
      Notification.create.resolves(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(TripRequest.updateStatus.calledWith('1', 'rejected')).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });
    
    it('should return 403 when driver is not assigned to request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'company_to_driver' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trying to reject a request made by the driver', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'driver_to_company' }; // Request made by driver
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot reject a request you made'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.rejectTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      TripRequest.delete.resolves(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(1)).to.be.true;
      expect(TripRequest.delete.calledWith(1)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request canceled successfully'
      });
    });
    
    it('should return 404 when driver profile not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 999 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });
    
    it('should return 403 when driver is not assigned to request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'driver_to_company' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trying to cancel a company request', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 1, request_type: 'company_to_driver' }; // Request from company
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Can only cancel requests you made to companies'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1 }
      });
      
      // Call the controller function
      await driverController.cancelTripRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      Company.updateRating.resolves(true);
      Company.findById.callsFake(async () => mockCompany);
      Notification.create.resolves(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5, comment: 'Great service' }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(Company.updateRating.calledWith(1, 5)).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it('should return 403 when driver is not assigned to trip', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 2, company_id: 1, status: 'completed' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });
    });
    
    it('should return 400 when trip is not completed', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, driver_id: 1, company_id: 1, status: 'pending' }; // Not completed
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      Trip.findById.resolves(mockTrip);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot rate a company for a trip that is not completed'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { trip_id: 1, rating: 5 }
      });
      
      // Call the controller function
      await driverController.rateCompany(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Notification.findByUserId.resolves(mockNotifications);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getNotifications(req, res);
      
      // Assertions
      expect(Notification.findByUserId.calledWith(5)).to.be.true;
      expect(res.json.calledWith(mockNotifications)).to.be.true;
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getNotifications(req, res);
      
      // Assertions
      expect(Notification.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read successfully', async () => {
      // Mock the model functions
      Notification.markAsRead.resolves(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.markNotificationAsRead(req, res);
      
      // Assertions
      expect(Notification.markAsRead.calledWith('1', 5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification marked as read'
      });
    });
    
    it('should return 404 when notification not found', async () => {
      // Mock the model functions
      Notification.markAsRead.resolves(false);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '999' }
      });
      
      // Call the controller function
      await driverController.markNotificationAsRead(req, res);
      
      // Assertions
      expect(Notification.markAsRead.calledWith('999', 5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Notification not found'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.markAsRead.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { id: '1' }
      });
      
      // Call the controller function
      await driverController.markNotificationAsRead(req, res);
      
      // Assertions
      expect(Notification.markAsRead.calledWith('1', 5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      // Mock the model functions
      Notification.markAllAsRead.resolves(true);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.markAllNotificationsAsRead(req, res);
      
      // Assertions
      expect(Notification.markAllAsRead.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'All notifications marked as read'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.markAllAsRead.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.markAllNotificationsAsRead(req, res);
      
      // Assertions
      expect(Notification.markAllAsRead.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getCurrentDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        current_location: 'Haifa',
        available_from: '2025-10-26 08:00:00',
        available_to: '2025-10-26 18:00:00'
      });
    });
    
    it('should return empty availability when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getCurrentDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        current_location: '',
        available_from: '',
        available_to: ''
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getCurrentDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findById.resolves(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { driverId: '1' }
      });
      
      // Call the controller function
      await driverController.getDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findById.calledWith('1')).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        isAvailable: true,
        location: 'Haifa',
        availableFrom: '2025-10-26 08:00:00',
        availableTo: '2025-10-26 18:00:00'
      });
    });
    
    it('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findById.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { driverId: '999' }
      });
      
      // Call the controller function
      await driverController.getDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findById.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        params: { driverId: '1' }
      });
      
      // Call the controller function
      await driverController.getDriverAvailability(req, res);
      
      // Assertions
      expect(Driver.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.getByDriverId.resolves(mockTrips);
      TripRequest.countPendingByDriverId.resolves(3);
      Trip.countAvailableTrips.resolves(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getDriverStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.getByDriverId.calledWith(1)).to.be.true;
      expect(TripRequest.countPendingByDriverId.calledWith(1)).to.be.true;
      expect(Trip.countAvailableTrips.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getDriverStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getDriverStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      Trip.getRecentByDriverId.resolves(mockTrips);
      Company.findById.callsFake(async (id) => {
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
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.getRecentByDriverId.calledWith(1, 5)).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
      expect(Company.findById.calledWith(2)).to.be.true;
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
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getRecentTrips(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getRecentTrips(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('should return unread notifications count', async () => {
      // Mock the model functions
      Notification.countUnreadByUserId.resolves(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getUnreadNotificationsCount(req, res);
      
      // Assertions
      expect(Notification.countUnreadByUserId.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        count: 5
      });
    });
    
    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Notification.countUnreadByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getUnreadNotificationsCount(req, res);
      
      // Assertions
      expect(Notification.countUnreadByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Mock pool.execute to return the count
      const db = require('../../config/db');
      const originalExecute = db.pool.execute;
      db.pool.execute = sinon.stub()
        .resolves([[{ count: 3 }]]) // First query result
        .resolves([[{ count: 2 }]]); // Second query result (reassignment)
      
      // Call the controller function
      await driverController.getTripRequestsCount(req, res);
      
      // Restore original execute method
      db.pool.execute = originalExecute;
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        count: 5
      });
    });
    
    it.skip('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getTripRequestsCount(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getTripRequestsCount(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      TripRequest.updateStatus.resolves(true);
      Trip.findById.resolves(mockTrip);
      Company.findById.callsFake(async () => mockCompany);
      Trip.unassignDriver.resolves(true);
      Notification.create.resolves(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(1)).to.be.true;
      expect(TripRequest.updateStatus.calledWith(1, 'accepted')).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
      expect(Trip.unassignDriver.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      TripRequest.updateStatus.resolves(true);
      Trip.findById.resolves(mockTrip);
      Company.findById.resolves(mockCompany);
      Notification.create.resolves(5);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'rejected' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(1)).to.be.true;
      expect(TripRequest.updateStatus.calledWith(1, 'rejected')).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(Company.findById.calledWith(1)).to.be.true;
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
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it.skip('should return 403 when request is invalid or unauthorized', async () => {
      // Mock data
      const mockDriver = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, driver_id: 2, request_type: 'reassignment_approval' }; // Different driver_id
      
      // Mock the model functions
      Driver.findByUserId.resolves(mockDriver);
      TripRequest.findById.resolves(mockRequest);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or unauthorized request.'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' },
        body: { requestId: 1, status: 'accepted' }
      });
      
      // Call the controller function
      await driverController.respondToReassignmentRequest(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
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
      Driver.findByUserId.resolves(mockDriver);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Mock pool.execute to return the trips
      const db = require('../../config/db');
      const originalExecute = db.pool.execute;
      db.pool.execute = sinon.stub().resolves([mockTrips]);
      
      // Call the controller function
      await driverController.getReportStats(req, res);
      
      // Restore original execute method
      db.pool.execute = originalExecute;
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        totalTrips: 3,
        totalEarnings: 450,
        totalPassengers: 9
      });
    });
    
    it.skip('should return 404 when driver not found', async () => {
      // Mock the model function to return null
      Driver.findByUserId.resolves(null);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getReportStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver profile not found'
      });
    });
    
    it.skip('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.findByUserId.rejects(error);
      
      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'driver' }
      });
      
      // Call the controller function
      await driverController.getReportStats(req, res);
      
      // Assertions
      expect(Driver.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  // Add more test cases for other controller functions
});
