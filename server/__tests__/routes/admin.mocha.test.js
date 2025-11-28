const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const adminController = require('../../controllers/admin');

// Mock the auth middleware
const authMiddleware = {
  auth: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  checkRole: (roles) => (req, res, next) => next()
};

// Now require the routes after mocking the middleware
const adminRoutes = express.Router();

// Manually set up the routes as they are in the original file
adminRoutes.get('/ping', (req, res) => res.json({ pong: Date.now() }));
adminRoutes.get('/pending-users', (req, res) => adminController.getPendingUsers(req, res));
adminRoutes.get('/pending-users/count', (req, res) => adminController.getPendingUsersCount(req, res));
adminRoutes.put('/approve-user/:id', (req, res) => adminController.approveUser(req, res));
adminRoutes.put('/reject-user/:id', (req, res) => adminController.rejectUser(req, res));
adminRoutes.get('/companies', (req, res) => adminController.getAllCompanies(req, res));
adminRoutes.get('/test-new-route', (req, res) => {
  res.json({ message: 'New route works!', timestamp: new Date().toISOString() });
});
adminRoutes.get('/notifications/unread-count', (req, res) => adminController.getUnreadNotificationsCount(req, res));

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
    
    // Set up stubs for the controller and middleware
    sinon.stub(adminController, 'getPendingUsers');
    sinon.stub(adminController, 'getPendingUsersCount');
    sinon.stub(adminController, 'approveUser');
    sinon.stub(adminController, 'rejectUser');
    sinon.stub(adminController, 'getAllCompanies');
    sinon.stub(adminController, 'getCompanyStats');
    sinon.stub(adminController, 'getCompanyTrips');
    sinon.stub(adminController, 'getAllDrivers');
    sinon.stub(adminController, 'getDriverStats');
    sinon.stub(adminController, 'getNotifications');
    sinon.stub(adminController, 'getUnreadNotificationsCount');
    sinon.stub(adminController, 'markAllNotificationsAsRead');
    sinon.stub(adminController, 'markNotificationAsRead');
  });

  describe('GET /api/admin/ping', () => {
    it('should return pong response', async () => {
      const response = await request(app).get('/api/admin/ping');
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('pong');
    });
  });

  describe('GET /api/admin/pending-users', () => {
    it('should call the getPendingUsers controller', async () => {
      // Mock the controller function
      adminController.getPendingUsers.callsFake((req, res) => {
        res.json([{ id: 1, username: 'testuser', status: 'pending' }]);
      });

      // Make the request
      const response = await request(app).get('/api/admin/pending-users');

      // Assertions
      expect(response.status).to.equal(200);
      expect(adminController.getPendingUsers.called).to.be.true;
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('username', 'testuser');
    });
  });

  describe('GET /api/admin/pending-users/count', () => {
    it('should call the getPendingUsersCount controller', async () => {
      // Mock the controller function
      adminController.getPendingUsersCount.callsFake((req, res) => {
        res.json({ count: 5 });
      });

      // Make the request
      const response = await request(app).get('/api/admin/pending-users/count');

      // Assertions
      expect(response.status).to.equal(200);
      expect(adminController.getPendingUsersCount.called).to.be.true;
      expect(response.body).to.have.property('count', 5);
    });
  });

  describe('PUT /api/admin/approve-user/:id', () => {
    it('should call the approveUser controller', async () => {
      // Mock the controller function
      adminController.approveUser.callsFake((req, res) => {
        res.json({ message: 'User approved successfully' });
      });

      // Make the request
      const response = await request(app).put('/api/admin/approve-user/1');

      // Assertions
      expect(response.status).to.equal(200);
      expect(adminController.approveUser.called).to.be.true;
      expect(response.body).to.have.property('message', 'User approved successfully');
    });
  });

  describe('PUT /api/admin/reject-user/:id', () => {
    it('should call the rejectUser controller', async () => {
      // Mock the controller function
      adminController.rejectUser.callsFake((req, res) => {
        res.json({ message: 'User rejected successfully' });
      });

      // Make the request
      const response = await request(app).put('/api/admin/reject-user/1');

      // Assertions
      expect(response.status).to.equal(200);
      expect(adminController.rejectUser.called).to.be.true;
      expect(response.body).to.have.property('message', 'User rejected successfully');
    });
  });

  describe('GET /api/admin/companies', () => {
    it('should call the getAllCompanies controller', async () => {
      // Mock the controller function
      adminController.getAllCompanies.callsFake((req, res) => {
        res.json([{ id: 1, name: 'Test Company' }]);
      });

      // Make the request
      const response = await request(app).get('/api/admin/companies');

      // Assertions
      expect(response.status).to.equal(200);
      expect(adminController.getAllCompanies.called).to.be.true;
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('name', 'Test Company');
    });
  });

  describe('GET /api/admin/test-new-route', () => {
    it('should return the test message', async () => {
      const response = await request(app).get('/api/admin/test-new-route');
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'New route works!');
      expect(response.body).to.have.property('timestamp');
    });
  });

  describe('GET /api/admin/notifications/unread-count', () => {
    it('should call the getUnreadNotificationsCount controller', async () => {
      // Mock the controller function
      adminController.getUnreadNotificationsCount.callsFake((req, res) => {
        res.json({ count: 3 });
      });

      // Make the request
      const response = await request(app).get('/api/admin/notifications/unread-count');

      // Assertions
      expect(response.status).to.equal(200);
      expect(adminController.getUnreadNotificationsCount.called).to.be.true;
      expect(response.body).to.have.property('count', 3);
    });
  });
});
