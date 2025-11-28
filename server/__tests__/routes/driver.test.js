const request = require('supertest');
const express = require('express');
const driverRoutes = require('../../routes/driver');
const driverController = require('../../controllers/driver');
const authMiddleware = require('../../middleware/auth');

// Mock the controller and middleware
jest.mock('../../controllers/driver');
jest.mock('../../middleware/auth');

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/driver', driverRoutes);

describe('Driver Routes', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the auth middleware to pass through
    authMiddleware.protect.mockImplementation((req, res, next) => {
      req.user = { id: 5, role: 'driver' };
      next();
    });
    
    authMiddleware.restrictTo.mockImplementation(() => (req, res, next) => next());
  });

  describe('GET /api/driver/profile', () => {
    it('should call the getProfile controller', async () => {
      // Mock the controller function
      driverController.getProfile.mockImplementation((req, res) => {
        res.json({ id: 1, user_id: 5, first_name: 'John', last_name: 'Doe' });
      });

      // Make the request
      const response = await request(app).get('/api/driver/profile');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, user_id: 5, first_name: 'John', last_name: 'Doe' });
      expect(driverController.getProfile).toHaveBeenCalled();
    });
  });

  describe('PUT /api/driver/profile', () => {
    it('should call the updateProfile controller', async () => {
      // Mock the controller function
      driverController.updateProfile.mockImplementation((req, res) => {
        res.json({ message: 'Driver profile updated successfully' });
      });

      // Make the request
      const response = await request(app)
        .put('/api/driver/profile')
        .send({ first_name: 'John', last_name: 'Doe' });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Driver profile updated successfully' });
      expect(driverController.updateProfile).toHaveBeenCalled();
    });
  });

  // Add more test cases for other routes
});
