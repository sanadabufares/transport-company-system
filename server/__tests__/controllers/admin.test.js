const adminController = require('../../controllers/admin');
const User = require('../../models/user');
const Company = require('../../models/company');
const Driver = require('../../models/driver');
const { createMockReqRes } = require('../testUtils');

// Mock the models
jest.mock('../../models/user');
jest.mock('../../models/company');
jest.mock('../../models/driver');

describe('Admin Controller', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
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
      User.getAllPending.mockResolvedValueOnce(mockUsers);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getPendingApprovals(req, res);

      // Assertions
      expect(User.getAllPending).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.getAllPending.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getPendingApprovals(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching pending approvals'
      });
    });
  });

  describe('approveUser', () => {
    it('should approve a user successfully', async () => {
      // Mock the model functions
      User.approve.mockResolvedValueOnce(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.approveUser(req, res);

      // Assertions
      expect(User.approve).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User approved successfully'
      });
    });

    it('should return 404 when user not found', async () => {
      // Mock the model function to return false
      User.approve.mockResolvedValueOnce(false);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '999' }
      });

      // Call the controller function
      await adminController.approveUser(req, res);

      // Assertions
      expect(User.approve).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found or already approved'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.approve.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.approveUser(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while approving user'
      });
    });
  });

  describe('rejectUser', () => {
    it('should reject a user successfully', async () => {
      // Mock the model functions
      User.delete.mockResolvedValueOnce(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.rejectUser(req, res);

      // Assertions
      expect(User.delete).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User rejected and deleted successfully'
      });
    });

    it('should return 404 when user not found', async () => {
      // Mock the model function to return false
      User.delete.mockResolvedValueOnce(false);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '999' }
      });

      // Call the controller function
      await adminController.rejectUser(req, res);

      // Assertions
      expect(User.delete).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.delete.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' },
        params: { userId: '5' }
      });

      // Call the controller function
      await adminController.rejectUser(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
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
      Company.getAll.mockResolvedValueOnce(mockCompanies);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllCompanies(req, res);

      // Assertions
      expect(Company.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockCompanies);
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.getAll.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllCompanies(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
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
      Driver.getAll.mockResolvedValueOnce(mockDrivers);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllDrivers(req, res);

      // Assertions
      expect(Driver.getAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockDrivers);
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Driver.getAll.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getAllDrivers(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
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
      Company.getAll.mockResolvedValueOnce(Array(mockStats.totalCompanies).fill({}));
      Driver.getAll.mockResolvedValueOnce(Array(mockStats.totalDrivers).fill({}));
      User.getAllPending.mockResolvedValueOnce(Array(mockStats.pendingApprovals).fill({}));

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getStats(req, res);

      // Assertions
      expect(Company.getAll).toHaveBeenCalled();
      expect(Driver.getAll).toHaveBeenCalled();
      expect(User.getAllPending).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        totalCompanies: mockStats.totalCompanies,
        totalDrivers: mockStats.totalDrivers,
        pendingApprovals: mockStats.pendingApprovals
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      Company.getAll.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getStats(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
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
      User.countUnreadNotifications.mockResolvedValueOnce(mockCount);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getUnreadNotificationsCount(req, res);

      // Assertions
      expect(User.countUnreadNotifications).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ count: mockCount });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.countUnreadNotifications.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'admin' }
      });

      // Call the controller function
      await adminController.getUnreadNotificationsCount(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });
});
