const sinon = require('sinon');
const { expect } = require('chai');
const tripController = require('../../controllers/trip');
const Trip = require('../../models/trip');
const Company = require('../../models/company');
const Driver = require('../../models/driver');
const Notification = require('../../models/notification');
const TripRequest = require('../../models/tripRequest');
const Rating = require('../../models/rating');
const { pool } = require('../../config/db');

describe('Trip Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all stubs
    sinon.restore();

    // Mock request and response objects
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 1, role: 'company' }
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe('getTripById', () => {
    it('should return a trip if found and user is authorized (company)', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 1, role: 'company' };
      
      const mockTrip = { id: 1, company_id: 1, pickup_location: 'Location A', destination: 'Location B' };
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      
      // Execute
      await tripController.getTripById(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockTrip);
    });

    it('should return a trip if found and user is authorized (driver)', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 2, role: 'driver' };
      
      const mockTrip = { id: 1, company_id: 1, driver_id: 1, pickup_location: 'Location A', destination: 'Location B' };
      const mockDriver = { id: 1, user_id: 2 };
      
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      sinon.stub(Driver, 'findByUserId').resolves(mockDriver);
      
      // Execute
      await tripController.getTripById(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockTrip);
    });

    it('should return 404 if trip not found', async () => {
      // Setup
      req.params.id = 999;
      
      sinon.stub(Trip, 'findById').resolves(null);
      
      // Execute
      await tripController.getTripById(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Trip not found' })).to.be.true;
    });

    it('should return 403 if company user is not authorized', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 1, role: 'company' };
      
      const mockTrip = { id: 1, company_id: 2, pickup_location: 'Location A', destination: 'Location B' };
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      
      // Execute
      await tripController.getTripById(req, res);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Unauthorized' })).to.be.true;
    });
  });

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      // Setup
      req.user = { id: 1, role: 'company' };
      req.body = {
        pickup_location: 'Location A',
        destination: 'Location B',
        trip_date: '2025-01-01',
        departure_time: '10:00:00',
        passenger_count: 4,
        vehicle_type: 'sedan',
        price: 100,
        visa_number: '1234-5678-9012-3456',
        special_instructions: 'None'
      };
      
      const mockCompany = { id: 1, user_id: 1 };
      const mockTripId = 1;
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'create').resolves(mockTripId);
      
      // Execute
      await tripController.createTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ 
        message: 'Trip created successfully',
        tripId: mockTripId
      })).to.be.true;
    });

    it('should return 404 if company profile not found', async () => {
      // Setup
      req.user = { id: 999, role: 'company' };
      
      sinon.stub(Company, 'findByUserId').resolves(null);
      
      // Execute
      await tripController.createTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Company profile not found' })).to.be.true;
    });
  });

  describe('updateTrip', () => {
    it('should update a trip successfully', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 1, role: 'company' };
      req.body = {
        pickup_location: 'Updated Location A',
        destination: 'Updated Location B',
        trip_date: '2025-01-02',
        departure_time: '11:00:00',
        passenger_count: 5,
        vehicle_type: 'suv',
        price: 150,
        visa_number: '1234-5678-9012-3456',
        special_instructions: 'Updated instructions'
      };
      
      const mockCompany = { id: 1, user_id: 1 };
      const mockTrip = { id: 1, company_id: 1, status: 'pending' };
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      sinon.stub(Trip, 'update').resolves(true);
      
      // Execute
      await tripController.updateTrip(req, res);
      
      // Assert
      expect(res.json.calledWith({ message: 'Trip updated successfully' })).to.be.true;
    });

    it('should return 404 if trip not found', async () => {
      // Setup
      req.params.id = 999;
      req.user = { id: 1, role: 'company' };
      
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'findById').resolves(null);
      
      // Execute
      await tripController.updateTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Trip not found' })).to.be.true;
    });

    it('should return 403 if company is not authorized', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 1, role: 'company' };
      
      const mockCompany = { id: 1, user_id: 1 };
      const mockTrip = { id: 1, company_id: 2, status: 'pending' };
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      
      // Execute
      await tripController.updateTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Unauthorized' })).to.be.true;
    });

    it('should return 400 if trip is not in pending status', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 1, role: 'company' };
      
      const mockCompany = { id: 1, user_id: 1 };
      const mockTrip = { id: 1, company_id: 1, status: 'assigned' };
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      
      // Execute
      await tripController.updateTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Cannot update trip that is already assigned or in progress' })).to.be.true;
    });
  });

  describe('deleteTrip', () => {
    it('should delete a trip successfully', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 1, role: 'company' };
      
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'delete').resolves(true);
      
      // Execute
      await tripController.deleteTrip(req, res);
      
      // Assert
      expect(res.json.calledWith({ message: 'Trip deleted successfully' })).to.be.true;
    });

    it('should return 404 if trip not found or cannot be deleted', async () => {
      // Setup
      req.params.id = 999;
      req.user = { id: 1, role: 'company' };
      
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'delete').resolves(false);
      
      // Execute
      await tripController.deleteTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Trip not found or cannot be deleted' })).to.be.true;
    });
  });

  describe('getCompanyTrips', () => {
    it('should return all trips for a company', async () => {
      // Setup
      req.user = { id: 1, role: 'company' };
      
      const mockCompany = { id: 1, user_id: 1 };
      const mockTrips = [
        { id: 1, company_id: 1, pickup_location: 'Location A', destination: 'Location B' },
        { id: 2, company_id: 1, pickup_location: 'Location C', destination: 'Location D' }
      ];
      
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      sinon.stub(Trip, 'getByCompanyId').resolves(mockTrips);
      
      // Execute
      await tripController.getCompanyTrips(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockTrips);
    });
  });

  describe('getDriverTrips', () => {
    it('should return 404 if driver profile not found', async () => {
      // Setup
      req.user = { id: 999, role: 'driver' };
      req.query = {};
      
      sinon.stub(Driver, 'findByUserId').resolves(null);
      
      // Execute
      await tripController.getDriverTrips(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Driver profile not found' })).to.be.true;
    });
  });

  describe('startTrip', () => {
    it('should start a trip successfully', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 2, role: 'driver' };
      
      const mockDriver = { id: 1, user_id: 2 };
      const mockTrip = { 
        id: 1, 
        company_id: 1, 
        driver_id: 1, 
        status: 'assigned',
        pickup_location: 'Location A',
        destination: 'Location B'
      };
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Driver, 'findByUserId').resolves(mockDriver);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      sinon.stub(Trip, 'updateStatus').resolves(true);
      sinon.stub(Company, 'findById').resolves(mockCompany);
      sinon.stub(Notification, 'create').resolves(1);
      
      // Execute
      await tripController.startTrip(req, res);
      
      // Assert
      expect(res.json.calledWith({ message: 'Trip started successfully' })).to.be.true;
      expect(Notification.create.calledOnce).to.be.true;
    });

    it('should return 404 if driver profile not found', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 999, role: 'driver' };
      
      sinon.stub(Driver, 'findByUserId').resolves(null);
      
      // Execute
      await tripController.startTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Driver profile not found' })).to.be.true;
    });

    it('should return 403 if driver is not authorized', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 2, role: 'driver' };
      
      const mockDriver = { id: 1, user_id: 2 };
      const mockTrip = { id: 1, company_id: 1, driver_id: 2, status: 'assigned' };
      
      sinon.stub(Driver, 'findByUserId').resolves(mockDriver);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      
      // Execute
      await tripController.startTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Unauthorized' })).to.be.true;
    });
  });

  describe('completeTrip', () => {
    it('should complete a trip successfully', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 2, role: 'driver' };
      req.body = { rating: 5, comment: 'Great company!' };
      
      const mockDriver = { id: 1, user_id: 2 };
      const mockTrip = { 
        id: 1, 
        company_id: 1, 
        driver_id: 1, 
        status: 'in_progress',
        pickup_location: 'Location A',
        destination: 'Location B'
      };
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Driver, 'findByUserId').resolves(mockDriver);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      sinon.stub(Trip, 'updateStatus').resolves(true);
      sinon.stub(Company, 'findById').resolves(mockCompany);
      sinon.stub(Notification, 'create').resolves(1);
      sinon.stub(Rating, 'create').resolves(1);
      sinon.stub(Rating, 'getCompanyAverageRating').resolves(4.5);
      sinon.stub(Rating, 'getCompanyRatings').resolves([{}, {}, {}]);
      sinon.stub(pool, 'execute').resolves([{ affectedRows: 1 }]);
      
      // Execute
      await tripController.completeTrip(req, res);
      
      // Assert
      expect(res.json.calledWith({ message: 'Trip completed successfully' })).to.be.true;
      expect(Notification.create.calledOnce).to.be.true;
      expect(Rating.create.calledOnce).to.be.true;
    });

    it('should return 404 if driver profile not found', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 999, role: 'driver' };
      
      sinon.stub(Driver, 'findByUserId').resolves(null);
      
      // Execute
      await tripController.completeTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Driver profile not found' })).to.be.true;
    });

    it('should return 400 if trip is not in progress', async () => {
      // Setup
      req.params.id = 1;
      req.user = { id: 2, role: 'driver' };
      
      const mockDriver = { id: 1, user_id: 2 };
      const mockTrip = { id: 1, company_id: 1, driver_id: 1, status: 'assigned' };
      
      sinon.stub(Driver, 'findByUserId').resolves(mockDriver);
      sinon.stub(Trip, 'findById').resolves(mockTrip);
      
      // Execute
      await tripController.completeTrip(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Trip cannot be completed' })).to.be.true;
    });
  });
});
