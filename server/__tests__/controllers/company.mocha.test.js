const companyController = require('../../controllers/company');
const Company = require('../../models/company');
const Trip = require('../../models/trip');
const TripRequest = require('../../models/tripRequest');
const Notification = require('../../models/notification');
const { createMockReqRes } = require('../testUtils');
const sinon = require('sinon');
const { pool } = require('../../config/db');

// Set up stubs for models
const companyStub = sinon.stub(Company);
const tripStub = sinon.stub(Trip);
const tripRequestStub = sinon.stub(TripRequest);
const notificationStub = sinon.stub(Notification);
const dbStub = sinon.stub(pool, 'execute');

describe('Company Controller', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
  });

  describe('updateProfile', () => {
    it('should update company profile successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5, company_name: 'Test Company' };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Company.update.resolves(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        body: {
          company_name: 'Updated Company',
          contact_person: 'Updated Contact',
          phone: '111-222-3333',
          address: '456 Updated St'
        }
      });

      // Call the controller function
      await companyController.updateProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Company.update).toHaveBeenCalledWith(1, {
        company_name: 'Updated Company',
        contact_person: 'Updated Contact',
        phone: '111-222-3333',
        address: '456 Updated St'
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company profile updated successfully'
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        body: { company_name: 'Updated Company' }
      });

      // Call the controller function
      await companyController.updateProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company profile not found'
      });
    });

    it('should return 400 when no fields provided to update', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5, company_name: 'Test Company' };

      // Mock the model function
      Company.findByUserId.resolves(mockCompany);

      // Create mock request and response with empty body
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        body: {}
      });

      // Call the controller function
      await companyController.updateProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'No fields provided to update'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        body: { company_name: 'Updated Company' }
      });

      // Call the controller function
      await companyController.updateProfile(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('getProfile', () => {
    it('should return company profile when found', async () => {
      // Mock data
      const mockCompany = {
        id: 1,
        user_id: 5,
        company_name: 'Test Company',
        contact_person: 'John Smith',
        phone: '123-456-7890'
      };

      // Mock the model function
      Company.findByUserId.resolves(mockCompany);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(res.json.calledWith(mockCompany)).to.be.true;
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when company profile not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' }
      });

      // Call the controller function
      await companyController.getProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Company profile not found' })).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Server error' })).to.be.true;
    });
  });

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.create.resolves(5);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        body: {
          pickup_location: 'Location A',
          destination: 'Location B',
          trip_date: '2025-10-25',
          departure_time: '14:00:00',
          passenger_count: 4,
          vehicle_type: 8,
          company_price: 500,
          driver_price: 400,
          visa_number: 'V123456',
          special_instructions: 'Some instructions'
        }
      });

      // Call the controller function
      await companyController.createTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.create).toHaveBeenCalledWith({
        company_id: 1,
        pickup_location: 'Location A',
        destination: 'Location B',
        trip_date: '2025-10-25',
        departure_time: '14:00:00',
        passenger_count: 4,
        vehicle_type: 8,
        company_price: 500,
        driver_price: 400,
        visa_number: 'V123456',
        special_instructions: 'Some instructions'
      });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip created successfully',
        tripId: 5
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        body: { pickup_location: 'Location A', destination: 'Location B' }
      });

      // Call the controller function
      await companyController.createTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        body: { pickup_location: 'Location A', destination: 'Location B' }
      });

      // Call the controller function
      await companyController.createTrip(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while creating trip'
      });
    });
  });

  describe('getTrips', () => {
    it('should return trips for a company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrips = [
        {
          id: 1,
          company_id: 1,
          pickup_location: 'Location A',
          destination: 'Location B'
        },
        {
          id: 2,
          company_id: 1,
          pickup_location: 'Location C',
          destination: 'Location D'
        }
      ];

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findByCompanyId.resolves(mockTrips);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getTrips(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findByCompanyId.calledWith(1)).to.be.true;
      expect(res.json.calledWith(mockTrips)).to.be.true;
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' }
      });

      // Call the controller function
      await companyController.getTrips(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getTrips(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching trips'
      });
    });
  });

  describe('getTripById', () => {
    it('should return trip data when trip exists', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = {
        id: 1,
        company_id: 1,
        pickup_location: 'Location A',
        destination: 'Location B'
      };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.getTripById(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.json.calledWith(mockTrip)).to.be.true;
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.getTripById(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '999' }
      });

      // Call the controller function
      await companyController.getTripById(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when trip does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 2 }; // Different company_id

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.getTripById(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to access this trip'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.getTripById(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('updateTrip', () => {
    it('should update a trip successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 1 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);
      Trip.update.resolves(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' },
        body: {
          pickup_location: 'Updated Location A',
          destination: 'Updated Location B',
          passenger_count: 6
        }
      });

      // Call the controller function
      await companyController.updateTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Trip.update).toHaveBeenCalledWith('1', {
        pickup_location: 'Updated Location A',
        destination: 'Updated Location B',
        passenger_count: 6
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip updated successfully'
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { id: '1' },
        body: { pickup_location: 'Updated Location' }
      });

      // Call the controller function
      await companyController.updateTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '999' },
        body: { pickup_location: 'Updated Location' }
      });

      // Call the controller function
      await companyController.updateTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when trip does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 2 }; // Different company_id

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' },
        body: { pickup_location: 'Updated Location' }
      });

      // Call the controller function
      await companyController.updateTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to update this trip'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' },
        body: { pickup_location: 'Updated Location' }
      });

      // Call the controller function
      await companyController.updateTrip(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('deleteTrip', () => {
    it('should delete a trip successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 1 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);
      Trip.delete.resolves(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.deleteTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Trip.delete.calledWith('1')).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip deleted successfully'
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.deleteTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '999' }
      });

      // Call the controller function
      await companyController.deleteTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when trip does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 2 }; // Different company_id

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.deleteTrip(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to delete this trip'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { id: '1' }
      });

      // Call the controller function
      await companyController.deleteTrip(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('sendDriverRequest', () => {
    it('should send a driver request successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 1 };
      const mockDriver = { id: 2, user_id: 6 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);
      TripRequest.findByTripAndDriver.resolves(null);
      TripRequest.create.resolves(5);
      Notification.create.resolves(10);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1', driverId: '2' }
      });

      // Call the controller function
      await companyController.sendDriverRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(TripRequest.findByTripAndDriver.calledWith('1', 2)).to.be.true;
      expect(TripRequest.create).toHaveBeenCalledWith({
        trip_id: '1',
        driver_id: 2,
        request_type: 'company_to_driver'
      });
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver request sent successfully',
        requestId: 5
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { tripId: '1', driverId: '2' }
      });

      // Call the controller function
      await companyController.sendDriverRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '999', driverId: '2' }
      });

      // Call the controller function
      await companyController.sendDriverRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when trip does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 2 }; // Different company_id

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1', driverId: '2' }
      });

      // Call the controller function
      await companyController.sendDriverRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to send requests for this trip'
      });
    });

    it('should return 400 when request already exists', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 1 };
      const mockRequest = { id: 5, trip_id: 1, driver_id: 2 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);
      TripRequest.findByTripAndDriver.resolves(mockRequest);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1', driverId: '2' }
      });

      // Call the controller function
      await companyController.sendDriverRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(TripRequest.findByTripAndDriver.calledWith('1', 2)).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'A request for this driver and trip already exists'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1', driverId: '2' }
      });

      // Call the controller function
      await companyController.sendDriverRequest(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while sending driver request'
      });
    });
  });

  describe('getAvailableDrivers', () => {
    it('should return available drivers for a trip', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5, company_name: 'Test Company' };
      const mockTrip = { id: 1, company_id: 1, pickup_location: 'Location A', destination: 'Location B' };
      const mockDrivers = [
        { id: 1, first_name: 'John', last_name: 'Doe', rating: 4.5 },
        { id: 2, first_name: 'Jane', last_name: 'Smith', rating: 4.8 }
      ];

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);
      Trip.getAvailableDriversForTrip.resolves(mockDrivers);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' }
      });

      // Call the controller function
      await companyController.getAvailableDrivers(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Trip.getAvailableDriversForTrip.calledWith('1')).to.be.true;
      expect(res.json.calledWith(mockDrivers)).to.be.true;
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { tripId: '1' }
      });

      // Call the controller function
      await companyController.getAvailableDrivers(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Company not found' })).to.be.true;
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5, company_name: 'Test Company' };
      
      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '999' }
      });

      // Call the controller function
      await companyController.getAvailableDrivers(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Trip not found' })).to.be.true;
    });

    it('should return 403 when trip does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5, company_name: 'Test Company' };
      const mockTrip = { id: 1, company_id: 2, pickup_location: 'Location A', destination: 'Location B' };
      
      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' }
      });

      // Call the controller function
      await companyController.getAvailableDrivers(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Not authorized to access this trip' })).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' }
      });

      // Call the controller function
      await companyController.getAvailableDrivers(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Server error while fetching available drivers.' })).to.be.true;
    });
  });

  describe('rateDriver', () => {
    it('should rate a driver successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 1, driver_id: 2 };
      const mockRating = { id: 10, trip_id: 1, company_id: 1, driver_id: 2, rating: 5, comment: 'Great service' };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);
      Rating.create.resolves(mockRating);
      Driver.updateRating.resolves(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await companyController.rateDriver(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(Rating.create).toHaveBeenCalledWith({
        trip_id: 1,
        company_id: 1,
        driver_id: 2,
        rating: 5,
        comment: 'Great service'
      });
      expect(Driver.updateRating.calledWith(2)).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver rated successfully',
        rating: mockRating
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { tripId: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await companyController.rateDriver(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when trip not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '999' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await companyController.rateDriver(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip not found'
      });
    });

    it('should return 403 when trip does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 2, driver_id: 2 }; // Different company_id

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await companyController.rateDriver(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to rate driver for this trip'
      });
    });

    it('should return 400 when driver is not assigned to trip', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockTrip = { id: 1, company_id: 1, driver_id: null }; // No driver assigned

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await companyController.rateDriver(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Trip.findById.calledWith('1')).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'No driver assigned to this trip'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { tripId: '1' },
        body: { rating: 5, comment: 'Great service' }
      });

      // Call the controller function
      await companyController.rateDriver(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while rating driver'
      });
    });
  });

  describe('getTripRequests', () => {
    it('should return trip requests for a company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockRequests = [
        { id: 1, trip_id: 1, driver_id: 2, status: 'pending' },
        { id: 2, trip_id: 3, driver_id: 4, status: 'accepted' }
      ];

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      TripRequest.getByCompanyId.resolves(mockRequests);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getTripRequests(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.getByCompanyId.calledWith(1)).to.be.true;
      expect(res.json.calledWith(mockRequests)).to.be.true;
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' }
      });

      // Call the controller function
      await companyController.getTripRequests(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getTripRequests(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching trip requests'
      });
    });
  });

  describe('cancelTripRequest', () => {
    it('should cancel a trip request successfully', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, company_id: 1, driver_id: 2 };
      const mockTrip = { id: 1, company_id: 1 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      TripRequest.findById.resolves(mockRequest);
      Trip.findById.resolves(mockTrip);
      TripRequest.updateStatus.resolves(true);
      Trip.unassignDriver.resolves(true);
      Notification.create.resolves(10);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { requestId: '1' }
      });

      // Call the controller function
      await companyController.cancelTripRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(TripRequest.updateStatus.calledWith('1', 'cancelled')).to.be.true;
      expect(Trip.unassignDriver.calledWith(1)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request cancelled successfully'
      });
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { requestId: '1' }
      });

      // Call the controller function
      await companyController.cancelTripRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when trip request not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      TripRequest.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { requestId: '999' }
      });

      // Call the controller function
      await companyController.cancelTripRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Trip request not found'
      });
    });

    it('should return 403 when trip request does not belong to company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockRequest = { id: 1, trip_id: 1, company_id: 2, driver_id: 2 }; // Different company_id
      const mockTrip = { id: 1, company_id: 2 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      TripRequest.findById.resolves(mockRequest);
      Trip.findById.resolves(mockTrip);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { requestId: '1' }
      });

      // Call the controller function
      await companyController.cancelTripRequest(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.findById.calledWith('1')).to.be.true;
      expect(Trip.findById.calledWith(1)).to.be.true;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Not authorized to cancel this trip request'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { requestId: '1' }
      });

      // Call the controller function
      await companyController.cancelTripRequest(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while cancelling trip request'
      });
    });
  });

  describe('getDriverProfile', () => {
    it('should return driver profile when found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockDriver = { 
        id: 1, 
        user_id: 6, 
        first_name: 'John', 
        last_name: 'Doe', 
        phone: '123-456-7890', 
        license_number: 'L123456',
        rating: 4.5
      };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Driver.findById.resolves(mockDriver);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { driverId: '1' }
      });

      // Call the controller function
      await companyController.getDriverProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Driver.findById.calledWith('1')).to.be.true;
      expect(res.json.calledWith(mockDriver)).to.be.true;
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' },
        params: { driverId: '1' }
      });

      // Call the controller function
      await companyController.getDriverProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 404 when driver not found', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      Driver.findById.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { driverId: '999' }
      });

      // Call the controller function
      await companyController.getDriverProfile(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(Driver.findById.calledWith('999')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' },
        params: { driverId: '1' }
      });

      // Call the controller function
      await companyController.getDriverProfile(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching driver profile'
      });
    });
  });

  describe('getTripRequestCount', () => {
    it('should return trip request count for a company', async () => {
      // Mock data
      const mockCompany = { id: 1, user_id: 5 };
      const mockCount = 5;

      // Mock the model functions
      Company.findByUserId.resolves(mockCompany);
      TripRequest.countPendingByCompanyId.resolves(mockCount);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getTripRequestCount(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(5)).to.be.true;
      expect(TripRequest.countPendingByCompanyId.calledWith(1)).to.be.true;
      expect(res.json.calledWith({ count: mockCount })).to.be.true;
    });

    it('should return 404 when company not found', async () => {
      // Mock the model function to return null
      Company.findByUserId.resolves(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'company' }
      });

      // Call the controller function
      await companyController.getTripRequestCount(req, res);

      // Assertions
      expect(Company.findByUserId.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.findByUserId.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 5, role: 'company' }
      });

      // Call the controller function
      await companyController.getTripRequestCount(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching trip request count'
      });
    });
  });

  // Add more test cases for other company controller functions
});
