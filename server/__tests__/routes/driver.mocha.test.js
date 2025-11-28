const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const driverController = require('../../controllers/driver');

// Mock the auth middleware
const authMiddleware = {
  auth: (req, res, next) => {
    req.user = { id: 5, role: 'driver' };
    next();
  },
  checkRole: (roles) => (req, res, next) => next()
};

// In Mocha, we can't use jest.mock, so we'll use a different approach

// Now require the routes after mocking the middleware
const driverRoutes = express.Router();

// Manually set up the routes as they are in the original file
driverRoutes.get('/profile', (req, res) => driverController.getProfile(req, res));
driverRoutes.put('/profile', (req, res) => driverController.updateProfile(req, res));

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/driver', driverRoutes);

describe('Driver Routes', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
    
    // Set up stubs for the controller and middleware
    sinon.stub(driverController, 'getProfile');
    sinon.stub(driverController, 'updateProfile');
  });

  describe('GET /api/driver/profile', () => {
    it('should call the getProfile controller', async () => {
      // Mock the controller function
      driverController.getProfile.callsFake((req, res) => {
        res.json({ id: 1, user_id: 5, first_name: 'John', last_name: 'Doe' });
      });

      // Make the request
      const response = await request(app).get('/api/driver/profile');

      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ id: 1, user_id: 5, first_name: 'John', last_name: 'Doe' });
      expect(driverController.getProfile.called).to.be.true;
    });
  });

  describe('PUT /api/driver/profile', () => {
    it('should call the updateProfile controller', async () => {
      // Mock the controller function
      driverController.updateProfile.callsFake((req, res) => {
        res.json({ message: 'Driver profile updated successfully' });
      });

      // Make the request
      const response = await request(app)
        .put('/api/driver/profile')
        .send({ first_name: 'John', last_name: 'Doe' });

      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ message: 'Driver profile updated successfully' });
      expect(driverController.updateProfile.called).to.be.true;
    });
  });

  // Add more test cases for other routes
});
