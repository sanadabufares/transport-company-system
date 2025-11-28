const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const companyController = require('../../controllers/company');

// Mock the auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, role: 'company' };
  next();
};

// Mock the checkRole middleware
const mockCheckRole = (roles) => (req, res, next) => {
  next();
};

// Now require the routes after mocking the middleware
const companyRoutes = express.Router();

// Manually set up the routes as they are in the original file
companyRoutes.get('/dashboard-stats', (req, res) => companyController.getDashboardStats(req, res));
companyRoutes.get('/profile', (req, res) => companyController.getProfile(req, res));
companyRoutes.put('/profile', (req, res) => companyController.updateProfile(req, res));
companyRoutes.post('/trips', (req, res) => companyController.createTrip(req, res));
companyRoutes.get('/trips', (req, res) => companyController.getTrips(req, res));
companyRoutes.get('/trips/:tripId', (req, res) => companyController.getTripById(req, res));
companyRoutes.put('/trips/:tripId', (req, res) => companyController.updateTrip(req, res));
companyRoutes.post('/trips/:tripId/cancel', (req, res) => companyController.cancelTrip(req, res));
companyRoutes.get('/trips/:tripId/available-drivers', (req, res) => companyController.getAvailableDrivers(req, res));
companyRoutes.get('/trips/:tripId/all-drivers', (req, res) => companyController.getAllDriversForTrip(req, res));
companyRoutes.get('/trips/:tripId/requesting-drivers', (req, res) => companyController.getRequestingDrivers(req, res));
companyRoutes.post('/driver-request', (req, res) => companyController.sendDriverRequest(req, res));
companyRoutes.post('/trips/:tripId/request-reassignment', (req, res) => companyController.requestDriverReassignment(req, res));
companyRoutes.get('/trip-requests', (req, res) => companyController.getTripRequests(req, res));
companyRoutes.post('/trip-requests', (req, res) => companyController.sendDriverRequest(req, res));
companyRoutes.get('/driver-requests', (req, res) => companyController.getDriverRequests(req, res));
companyRoutes.get('/drivers', (req, res) => companyController.getAllDrivers(req, res));
companyRoutes.post('/respond-to-request', (req, res) => companyController.respondToTripRequest(req, res));
companyRoutes.post('/cancel-request', (req, res) => companyController.cancelTripRequest(req, res));
companyRoutes.post('/trips/:tripId/rate-driver', (req, res) => companyController.rateDriver(req, res));
companyRoutes.get('/reports/stats', (req, res) => companyController.getReports(req, res));
companyRoutes.get('/reports/trips', (req, res) => companyController.getReports(req, res));
companyRoutes.get('/reports/drivers', (req, res) => companyController.getReports(req, res));
companyRoutes.get('/notifications', (req, res) => companyController.getNotifications(req, res));
companyRoutes.get('/notifications/unread-count', (req, res) => companyController.getUnreadNotificationsCount(req, res));
companyRoutes.put('/notifications/read-all', (req, res) => companyController.markAllNotificationsAsRead(req, res));
companyRoutes.put('/notifications/:id/read', (req, res) => companyController.markNotificationAsRead(req, res));
companyRoutes.get('/trip-requests/count', (req, res) => companyController.getTripRequestsCount(req, res));

// Apply middleware to all routes
companyRoutes.use(mockAuth);
companyRoutes.use(mockCheckRole(['company']));

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/company', companyRoutes);

describe('Company Routes', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
    
    // Set up stubs for the controller methods
    sinon.stub(companyController, 'getDashboardStats');
    sinon.stub(companyController, 'getProfile');
    sinon.stub(companyController, 'updateProfile');
    sinon.stub(companyController, 'createTrip');
    sinon.stub(companyController, 'getTrips');
    sinon.stub(companyController, 'getTripById');
    sinon.stub(companyController, 'updateTrip');
    sinon.stub(companyController, 'cancelTrip');
    sinon.stub(companyController, 'getAvailableDrivers');
    sinon.stub(companyController, 'getAllDriversForTrip');
    sinon.stub(companyController, 'getRequestingDrivers');
    sinon.stub(companyController, 'sendDriverRequest');
    sinon.stub(companyController, 'requestDriverReassignment');
    sinon.stub(companyController, 'getTripRequests');
    sinon.stub(companyController, 'getDriverRequests');
    sinon.stub(companyController, 'getAllDrivers');
    sinon.stub(companyController, 'respondToTripRequest');
    sinon.stub(companyController, 'cancelTripRequest');
    sinon.stub(companyController, 'rateDriver');
    sinon.stub(companyController, 'getReports');
    sinon.stub(companyController, 'getNotifications');
    sinon.stub(companyController, 'getUnreadNotificationsCount');
    sinon.stub(companyController, 'markAllNotificationsAsRead');
    sinon.stub(companyController, 'markNotificationAsRead');
    sinon.stub(companyController, 'getTripRequestsCount');
  });

  describe('GET /api/company/dashboard-stats', () => {
    it('should call the getDashboardStats controller', async () => {
      // Mock the controller function
      companyController.getDashboardStats.callsFake((req, res) => {
        res.json({
          activeTrips: 5,
          completedTrips: 10,
          pendingRequests: 3,
          totalDrivers: 20
        });
      });

      // Make the request
      const response = await request(app).get('/api/company/dashboard-stats');

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.getDashboardStats.called).to.be.true;
      expect(response.body).to.have.property('activeTrips', 5);
      expect(response.body).to.have.property('completedTrips', 10);
    });
  });

  describe('GET /api/company/profile', () => {
    it('should call the getProfile controller', async () => {
      // Mock the controller function
      companyController.getProfile.callsFake((req, res) => {
        res.json({
          id: 1,
          name: 'Test Company',
          email: 'test@company.com',
          address: '123 Test St',
          phone: '123-456-7890'
        });
      });

      // Make the request
      const response = await request(app).get('/api/company/profile');

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.getProfile.called).to.be.true;
      expect(response.body).to.have.property('name', 'Test Company');
      expect(response.body).to.have.property('email', 'test@company.com');
    });
  });

  describe('PUT /api/company/profile', () => {
    it('should call the updateProfile controller', async () => {
      // Mock the controller function
      companyController.updateProfile.callsFake((req, res) => {
        res.json({
          success: true,
          message: 'Profile updated successfully'
        });
      });

      // Test data
      const profileData = {
        name: 'Updated Company',
        address: '456 New St',
        phone: '987-654-3210'
      };

      // Make the request
      const response = await request(app)
        .put('/api/company/profile')
        .send(profileData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.updateProfile.called).to.be.true;
      expect(response.body).to.have.property('success', true);
    });
  });

  describe('POST /api/company/trips', () => {
    it('should call the createTrip controller', async () => {
      // Mock the controller function
      companyController.createTrip.callsFake((req, res) => {
        res.json({
          id: 1,
          pickup_location: 'Location A',
          destination: 'Location B',
          status: 'pending'
        });
      });

      // Test data
      const tripData = {
        pickup_location: 'Location A',
        destination: 'Location B',
        pickup_time: '2025-01-01 10:00:00',
        estimated_duration: 120,
        vehicle_type: 'sedan'
      };

      // Make the request
      const response = await request(app)
        .post('/api/company/trips')
        .send(tripData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.createTrip.called).to.be.true;
      expect(response.body).to.have.property('pickup_location', 'Location A');
      expect(response.body).to.have.property('destination', 'Location B');
    });
  });

  describe('GET /api/company/trips', () => {
    it('should call the getTrips controller', async () => {
      // Mock the controller function
      companyController.getTrips.callsFake((req, res) => {
        res.json([
          {
            id: 1,
            pickup_location: 'Location A',
            destination: 'Location B',
            status: 'completed'
          },
          {
            id: 2,
            pickup_location: 'Location C',
            destination: 'Location D',
            status: 'pending'
          }
        ]);
      });

      // Make the request
      const response = await request(app).get('/api/company/trips');

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.getTrips.called).to.be.true;
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(2);
    });
  });

  describe('GET /api/company/notifications/unread-count', () => {
    it('should call the getUnreadNotificationsCount controller', async () => {
      // Mock the controller function
      companyController.getUnreadNotificationsCount.callsFake((req, res) => {
        res.json({ count: 5 });
      });

      // Make the request
      const response = await request(app).get('/api/company/notifications/unread-count');

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.getUnreadNotificationsCount.called).to.be.true;
      expect(response.body).to.have.property('count', 5);
    });
  });

  describe('GET /api/company/trip-requests/count', () => {
    it('should call the getTripRequestsCount controller', async () => {
      // Mock the controller function
      companyController.getTripRequestsCount.callsFake((req, res) => {
        res.json({ count: 3 });
      });

      // Make the request
      const response = await request(app).get('/api/company/trip-requests/count');

      // Assertions
      expect(response.status).to.equal(200);
      expect(companyController.getTripRequestsCount.called).to.be.true;
      expect(response.body).to.have.property('count', 3);
    });
  });
});
