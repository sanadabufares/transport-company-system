const adminController = require('../../controllers/admin');
const User = require('../../models/user');
const Company = require('../../models/company');
const Driver = require('../../models/driver');
const { createMockReqRes } = require('../testUtils');

// Mock the models
// Converted from jest.mock - use sinon.stub instead
// '../../models/user';
// Converted from jest.mock - use sinon.stub instead
// '../../models/company';
// Converted from jest.mock - use sinon.stub instead
// '../../models/driver';

describe('Admin Controller', () => {
  beforeEach(() => {
    // Reset mocks
    sinon.restore();
  });

  describe('getPendingApprovals', () => {
    it('should return pending users', async () => {
      // Mock data
      const mockUsers = [
        {
          id: 1,
          username: 'pendinguser1',
          email: 'pending1@example.com',
          role: 'driver',
          is_approved: false
        },
        {
          id: 2,
          username: 'pendinguser2',
          email: 'pending2@example.com',
          role: 'company',
          is_approved: false
        }
      ];

      // Mock the model function
      User.getAllPending.resolves(mockUsers);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getPendingApprovals(req, res);

      // Assertions
      expect(User.getAllPending.called).to.be.true;
      expect(res.json.calledWith(mockUsers)).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.getAllPending.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getPendingApprovals(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching pending approvals'
      });
    });
  });

  describe('approveUser', () => {
    it('should approve a user successfully', async () => {
      // Mock the model functions
      User.approve.resolves(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.approveUser(req, res);

      // Assertions
      expect(User.approve.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'User approved successfully'
      });
    });

    it('should return 404 when user not found', async () => {
      // Mock the model function to return false
      User.approve.resolves(false);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '999' }
      });

      // Call the controller function
      await adminController.approveUser(req, res);

      // Assertions
      expect(User.approve.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found or already approved'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.approve.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.approveUser(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while approving user'
      });
    });
  });

  describe('rejectUser', () => {
    it('should reject a user successfully', async () => {
      // Mock the model functions
      User.delete.resolves(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.rejectUser(req, res);

      // Assertions
      expect(User.delete.calledWith(5)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'User rejected and deleted successfully'
      });
    });

    it('should return 404 when user not found', async () => {
      // Mock the model function to return false
      User.delete.resolves(false);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '999' }
      });

      // Call the controller function
      await adminController.rejectUser(req, res);

      // Assertions
      expect(User.delete.calledWith(999)).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.delete.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.rejectUser(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while rejecting user'
      });
    });
  });

  describe('getAllCompanies', () => {
    it('should return all companies', async () => {
      // Mock data
      const mockCompanies = [
        {
          id: 1,
          user_id: 5,
          company_name: 'Company A',
          contact_person: 'John Smith'
        },
        {
          id: 2,
          user_id: 6,
          company_name: 'Company B',
          contact_person: 'Jane Doe'
        }
      ];

      // Mock the model function
      Company.getAll.resolves(mockCompanies);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllCompanies(req, res);

      // Assertions
      expect(Company.getAll.called).to.be.true;
      expect(res.json.calledWith(mockCompanies)).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.getAll.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllCompanies(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching companies'
      });
    });
  });

  describe('getAllDrivers', () => {
    it('should return all drivers', async () => {
      // Mock data
      const mockDrivers = [
        {
          id: 1,
          user_id: 5,
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          id: 2,
          user_id: 6,
          first_name: 'Jane',
          last_name: 'Smith'
        }
      ];

      // Mock the model function
      Driver.getAll.resolves(mockDrivers);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllDrivers(req, res);

      // Assertions
      expect(Driver.getAll.called).to.be.true;
      expect(res.json.calledWith(mockDrivers)).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.getAll.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllDrivers(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching drivers'
      });
    });
  });

  describe('getStats', () => {
    it('should return admin statistics', async () => {
      // Mock data
      const mockStats = {
        totalCompanies: 10,
        totalDrivers: 15,
        pendingApprovals: 3,
        totalTrips: 50
      };

      // Mock the model functions
      Company.getAll.resolves(Array(mockStats.totalCompanies).fill({}));
      Driver.getAll.resolves(Array(mockStats.totalDrivers).fill({}));
      User.getAllPending.resolves(Array(mockStats.pendingApprovals).fill({}));

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getStats(req, res);

      // Assertions
      expect(Company.getAll.called).to.be.true;
      expect(Driver.getAll.called).to.be.true;
      expect(User.getAllPending.called).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        totalCompanies: mockStats.totalCompanies,
        totalDrivers: mockStats.totalDrivers,
        pendingApprovals: mockStats.pendingApprovals
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.getAll.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getStats(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching stats'
      });
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('should return unread notifications count', async () => {
      // Mock data
      const mockCount = 5;

      // Mock the model function
      User.countUnreadNotifications.resolves(mockCount);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getUnreadNotificationsCount(req, res);

      // Assertions
      expect(User.countUnreadNotifications.calledWith(1)).to.be.true;
      expect(res.json.calledWith({ count: mockCount })).to.be.true;
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.countUnreadNotifications.rejects(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getUnreadNotificationsCount(req, res);

      // Assertions
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });
});
