const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const tripController = require('../../controllers/trip');

// Mock the auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, role: 'company' };
  next();
};

// Mock the checkRole middleware
const mockCheckRole = (roles) => (req, res, next) => {
  next();
};

// Create an Express app for testing
const app = express();
app.use(express.json());

// Apply middleware to all routes
app.use(mockAuth);

// Set up the routes
app.get('/api/trip/:id', (req, res) => tripController.getTripById(req, res));

// Company routes
app.post('/api/trip/company', mockCheckRole(['company']), (req, res) => tripController.createTrip(req, res));
app.put('/api/trip/company/:id', mockCheckRole(['company']), (req, res) => tripController.updateTrip(req, res));
app.delete('/api/trip/company/:id', mockCheckRole(['company']), (req, res) => tripController.deleteTrip(req, res));
app.get('/api/trip/company/all', mockCheckRole(['company']), (req, res) => tripController.getCompanyTrips(req, res));

// Driver routes
app.get('/api/trip/driver/all', mockCheckRole(['driver']), (req, res) => tripController.getDriverTrips(req, res));
app.get('/api/trip/driver/available', mockCheckRole(['driver']), (req, res) => tripController.getAvailableTrips(req, res));
app.put('/api/trip/driver/:id/start', mockCheckRole(['driver']), (req, res) => tripController.startTrip(req, res));
app.put('/api/trip/driver/:id/complete', mockCheckRole(['driver']), (req, res) => tripController.completeTrip(req, res));

describe('Trip Routes', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
    
    // Set up stubs for the controller methods
    sinon.stub(tripController, 'getTripById');
    sinon.stub(tripController, 'createTrip');
    sinon.stub(tripController, 'updateTrip');
    sinon.stub(tripController, 'deleteTrip');
    sinon.stub(tripController, 'getCompanyTrips');
    sinon.stub(tripController, 'getDriverTrips');
    sinon.stub(tripController, 'getAvailableTrips');
    sinon.stub(tripController, 'startTrip');
    sinon.stub(tripController, 'completeTrip');
  });

  describe('GET /api/trip/:id', () => {
    it('should call the getTripById controller', async () => {
      // Mock the controller function
      tripController.getTripById.callsFake((req, res) => {
        res.json({
          id: 1,
          company_id: 1,
          driver_id: 2,
          pickup_location: 'Location A',
          destination: 'Location B',
          status: 'completed'
        });
      });

      // Make the request
      const response = await request(app).get('/api/trip/1');

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.getTripById.called).to.be.true;
      expect(response.body).to.have.property('id', 1);
      expect(response.body).to.have.property('pickup_location', 'Location A');
    });
  });

  describe('POST /api/trip/company', () => {
    it('should call the createTrip controller', async () => {
      // Mock the controller function
      tripController.createTrip.callsFake((req, res) => {
        res.json({
          id: 1,
          company_id: 1,
          pickup_location: req.body.pickup_location,
          destination: req.body.destination,
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
        .post('/api/trip/company')
        .send(tripData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.createTrip.called).to.be.true;
      expect(response.body).to.have.property('pickup_location', 'Location A');
      expect(response.body).to.have.property('destination', 'Location B');
    });
  });

  describe('PUT /api/trip/company/:id', () => {
    it('should call the updateTrip controller', async () => {
      // Mock the controller function
      tripController.updateTrip.callsFake((req, res) => {
        res.json({
          id: 1,
          company_id: 1,
          pickup_location: req.body.pickup_location,
          destination: req.body.destination,
          status: 'updated'
        });
      });

      // Test data
      const tripData = {
        pickup_location: 'Updated Location A',
        destination: 'Updated Location B',
        pickup_time: '2025-01-02 11:00:00'
      };

      // Make the request
      const response = await request(app)
        .put('/api/trip/company/1')
        .send(tripData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.updateTrip.called).to.be.true;
      expect(response.body).to.have.property('pickup_location', 'Updated Location A');
      expect(response.body).to.have.property('destination', 'Updated Location B');
    });
  });

  describe('DELETE /api/trip/company/:id', () => {
    it('should call the deleteTrip controller', async () => {
      // Mock the controller function
      tripController.deleteTrip.callsFake((req, res) => {
        res.json({
          success: true,
          message: 'Trip deleted successfully'
        });
      });

      // Make the request
      const response = await request(app).delete('/api/trip/company/1');

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.deleteTrip.called).to.be.true;
      expect(response.body).to.have.property('success', true);
    });
  });

  describe('GET /api/trip/company/all', () => {
    it('should call the getCompanyTrips controller', async () => {
      // Mock the controller function
      tripController.getCompanyTrips.callsFake((req, res) => {
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
      const response = await request(app).get('/api/trip/company/all');

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.getCompanyTrips.called).to.be.true;
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(2);
    });
  });

  describe('GET /api/trip/driver/all', () => {
    it('should call the getDriverTrips controller', async () => {
      // Mock the auth middleware for this test to use driver role
      const driverAuthMiddleware = (req, res, next) => {
        req.user = { id: 2, role: 'driver' };
        next();
      };
      
      // Create a separate app instance for driver tests
      const driverApp = express();
      driverApp.use(express.json());
      driverApp.use(driverAuthMiddleware);
      driverApp.get('/api/trip/driver/all', mockCheckRole(['driver']), (req, res) => tripController.getDriverTrips(req, res));
      
      // Mock the controller function
      tripController.getDriverTrips.callsFake((req, res) => {
        res.json([
          {
            id: 1,
            company_name: 'Test Company',
            pickup_location: 'Location A',
            destination: 'Location B',
            status: 'completed'
          },
          {
            id: 3,
            company_name: 'Test Company',
            pickup_location: 'Location E',
            destination: 'Location F',
            status: 'in_progress'
          }
        ]);
      });

      // Make the request
      const response = await request(driverApp).get('/api/trip/driver/all');

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.getDriverTrips.called).to.be.true;
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(2);
    });
  });

  describe('PUT /api/trip/driver/:id/start', () => {
    it('should call the startTrip controller', async () => {
      // Mock the auth middleware for this test to use driver role
      const driverAuthMiddleware = (req, res, next) => {
        req.user = { id: 2, role: 'driver' };
        next();
      };
      
      // Create a separate app instance for driver tests
      const driverApp = express();
      driverApp.use(express.json());
      driverApp.use(driverAuthMiddleware);
      driverApp.put('/api/trip/driver/:id/start', mockCheckRole(['driver']), (req, res) => tripController.startTrip(req, res));
      
      // Mock the controller function
      tripController.startTrip.callsFake((req, res) => {
        res.json({
          id: 1,
          status: 'in_progress',
          start_time: new Date().toISOString(),
          message: 'Trip started successfully'
        });
      });

      // Make the request
      const response = await request(driverApp).put('/api/trip/driver/1/start');

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.startTrip.called).to.be.true;
      expect(response.body).to.have.property('status', 'in_progress');
      expect(response.body).to.have.property('start_time');
    });
  });

  describe('PUT /api/trip/driver/:id/complete', () => {
    it('should call the completeTrip controller', async () => {
      // Mock the auth middleware for this test to use driver role
      const driverAuthMiddleware = (req, res, next) => {
        req.user = { id: 2, role: 'driver' };
        next();
      };
      
      // Create a separate app instance for driver tests
      const driverApp = express();
      driverApp.use(express.json());
      driverApp.use(driverAuthMiddleware);
      driverApp.put('/api/trip/driver/:id/complete', mockCheckRole(['driver']), (req, res) => tripController.completeTrip(req, res));
      
      // Mock the controller function
      tripController.completeTrip.callsFake((req, res) => {
        res.json({
          id: 1,
          status: 'completed',
          completion_time: new Date().toISOString(),
          message: 'Trip completed successfully'
        });
      });

      // Make the request
      const response = await request(driverApp).put('/api/trip/driver/1/complete');

      // Assertions
      expect(response.status).to.equal(200);
      expect(tripController.completeTrip.called).to.be.true;
      expect(response.body).to.have.property('status', 'completed');
      expect(response.body).to.have.property('completion_time');
    });
  });
});
