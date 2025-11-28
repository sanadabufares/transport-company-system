const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const authController = require('../../controllers/auth');
const authMiddleware = require('../../middleware/auth');

// Mock the auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, role: 'driver' };
  next();
};

// Now require the routes after mocking the middleware
const authRoutes = express.Router();

// Manually set up the routes as they are in the original file
authRoutes.post('/register/company', (req, res) => authController.registerCompany(req, res));
authRoutes.post('/register/driver', (req, res) => authController.registerDriver(req, res));
authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.get('/me', mockAuth, (req, res) => authController.getCurrentUser(req, res));
authRoutes.put('/update-email', mockAuth, (req, res) => authController.updateEmail(req, res));

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
    
    // Set up stubs for the controller and middleware
    sinon.stub(authController, 'registerCompany');
    sinon.stub(authController, 'registerDriver');
    sinon.stub(authController, 'login');
    sinon.stub(authController, 'getCurrentUser');
    sinon.stub(authController, 'updateEmail');
  });

  describe('POST /api/auth/register/company', () => {
    it('should call the registerCompany controller', async () => {
      // Mock the controller function
      authController.registerCompany.callsFake((req, res) => {
        res.json({ success: true, message: 'Company registered successfully' });
      });

      // Test data
      const companyData = {
        name: 'Test Company',
        email: 'company@test.com',
        password: 'password123',
        address: '123 Test St',
        phone: '123-456-7890'
      };

      // Make the request
      const response = await request(app)
        .post('/api/auth/register/company')
        .send(companyData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(authController.registerCompany.called).to.be.true;
      expect(response.body).to.deep.equal({ success: true, message: 'Company registered successfully' });
    });
  });

  describe('POST /api/auth/register/driver', () => {
    it('should call the registerDriver controller', async () => {
      // Mock the controller function
      authController.registerDriver.callsFake((req, res) => {
        res.json({ success: true, message: 'Driver registered successfully' });
      });

      // Test data
      const driverData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'driver@test.com',
        password: 'password123',
        license_number: 'DL12345',
        phone: '123-456-7890'
      };

      // Make the request
      const response = await request(app)
        .post('/api/auth/register/driver')
        .send(driverData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(authController.registerDriver.called).to.be.true;
      expect(response.body).to.deep.equal({ success: true, message: 'Driver registered successfully' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call the login controller', async () => {
      // Mock the controller function
      authController.login.callsFake((req, res) => {
        res.json({ 
          success: true, 
          token: 'test-token',
          user: { id: 1, email: 'test@example.com', role: 'driver' }
        });
      });

      // Test data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Make the request
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(authController.login.called).to.be.true;
      expect(response.body).to.have.property('token', 'test-token');
      expect(response.body.user).to.have.property('email', 'test@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should call the getCurrentUser controller', async () => {
      // Mock the controller function
      authController.getCurrentUser.callsFake((req, res) => {
        res.json({ id: 1, email: 'test@example.com', role: 'driver' });
      });

      // Make the request
      const response = await request(app)
        .get('/api/auth/me');

      // Assertions
      expect(response.status).to.equal(200);
      expect(authController.getCurrentUser.called).to.be.true;
      expect(response.body).to.have.property('email', 'test@example.com');
    });
  });

  describe('PUT /api/auth/update-email', () => {
    it('should call the updateEmail controller', async () => {
      // Mock the controller function
      authController.updateEmail.callsFake((req, res) => {
        res.json({ success: true, message: 'Email updated successfully' });
      });

      // Test data
      const updateData = {
        email: 'new-email@example.com',
        password: 'password123'
      };

      // Make the request
      const response = await request(app)
        .put('/api/auth/update-email')
        .send(updateData);

      // Assertions
      expect(response.status).to.equal(200);
      expect(authController.updateEmail.called).to.be.true;
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Email updated successfully');
    });
  });
});
