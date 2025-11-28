const authController = require('../../controllers/auth');
const User = require('../../models/user');
const Driver = require('../../models/driver');
const Company = require('../../models/company');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createMockReqRes } = require('../testUtils');

// Mock the models and libraries
jest.mock('../../models/user');
jest.mock('../../models/driver');
jest.mock('../../models/company');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a company user successfully', async () => {
      // Mock data
      const mockUser = {
        id: 5,
        username: 'testcompany',
        email: 'testcompany@example.com',
        role: 'company',
        is_approved: false
      };

      const mockCompany = {
        id: 1,
        user_id: 5,
        company_name: 'Test Company',
        contact_person: 'John Smith',
        phone: '123-456-7890',
        address: '123 Main St'
      };

      // Mock the model functions
      User.findByUsername.mockResolvedValueOnce(null);
      User.findByEmail.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce('hashedpassword');
      User.create.mockResolvedValueOnce(5);
      Company.create.mockResolvedValueOnce(1);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testcompany',
          email: 'testcompany@example.com',
          password: 'password123',
          role: 'company',
          company_name: 'Test Company',
          contact_person: 'John Smith',
          phone: '123-456-7890',
          address: '123 Main St'
        }
      });

      // Call the controller function
      await authController.register(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('testcompany');
      expect(User.findByEmail).toHaveBeenCalledWith('testcompany@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(User.create).toHaveBeenCalledWith({
        username: 'testcompany',
        email: 'testcompany@example.com',
        password: 'hashedpassword',
        role: 'company',
        is_approved: false
      });
      expect(Company.create).toHaveBeenCalledWith({
        user_id: 5,
        company_name: 'Test Company',
        contact_person: 'John Smith',
        phone: '123-456-7890',
        address: '123 Main St'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Company registered successfully. Awaiting admin approval.'
      });
    });

    it('should register a driver user successfully', async () => {
      // Mock data
      const mockUser = {
        id: 5,
        username: 'testdriver',
        email: 'testdriver@example.com',
        role: 'driver',
        is_approved: false
      };

      const mockDriver = {
        id: 1,
        user_id: 5,
        first_name: 'John',
        last_name: 'Doe',
        phone: '123-456-7890',
        address: '123 Main St',
        license_number: 'DL12345',
        license_expiry: '2025-12-31',
        vehicle_type: 8,
        vehicle_plate: 'ABC123'
      };

      // Mock the model functions
      User.findByUsername.mockResolvedValueOnce(null);
      User.findByEmail.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce('hashedpassword');
      User.create.mockResolvedValueOnce(5);
      Driver.create.mockResolvedValueOnce(1);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testdriver',
          email: 'testdriver@example.com',
          password: 'password123',
          role: 'driver',
          first_name: 'John',
          last_name: 'Doe',
          phone: '123-456-7890',
          address: '123 Main St',
          license_number: 'DL12345',
          license_expiry: '2025-12-31',
          vehicle_type: 8,
          vehicle_plate: 'ABC123'
        }
      });

      // Call the controller function
      await authController.register(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('testdriver');
      expect(User.findByEmail).toHaveBeenCalledWith('testdriver@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(User.create).toHaveBeenCalledWith({
        username: 'testdriver',
        email: 'testdriver@example.com',
        password: 'hashedpassword',
        role: 'driver',
        is_approved: false
      });
      expect(Driver.create).toHaveBeenCalledWith({
        user_id: 5,
        first_name: 'John',
        last_name: 'Doe',
        phone: '123-456-7890',
        address: '123 Main St',
        license_number: 'DL12345',
        license_expiry: '2025-12-31',
        vehicle_type: 8,
        vehicle_plate: 'ABC123'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Driver registered successfully. Awaiting admin approval.'
      });
    });

    it('should return 400 when username already exists', async () => {
      // Mock the model function to return existing user
      User.findByUsername.mockResolvedValueOnce({ id: 1, username: 'existinguser' });

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'existinguser',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'driver'
        }
      });

      // Call the controller function
      await authController.register(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('existinguser');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username already exists'
      });
    });

    it('should return 400 when email already exists', async () => {
      // Mock the model functions
      User.findByUsername.mockResolvedValueOnce(null);
      User.findByEmail.mockResolvedValueOnce({ id: 1, email: 'existing@example.com' });

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123',
          role: 'driver'
        }
      });

      // Call the controller function
      await authController.register(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('newuser');
      expect(User.findByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email already exists'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.findByUsername.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'driver'
        }
      });

      // Call the controller function
      await authController.register(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error during registration'
      });
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'driver',
        is_approved: true
      };

      // Mock the model functions and libraries
      User.findByUsername.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValueOnce('fake-jwt-token');

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testuser',
          password: 'password123'
        }
      });

      // Call the controller function
      await authController.login(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, role: 'driver' },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: 'fake-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'driver',
          is_approved: true
        }
      });
    });

    it('should return 401 when user not found', async () => {
      // Mock the model function to return null
      User.findByUsername.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'nonexistentuser',
          password: 'password123'
        }
      });

      // Call the controller function
      await authController.login(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('nonexistentuser');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('should return 401 when password is incorrect', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'driver'
      };

      // Mock the model functions and libraries
      User.findByUsername.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(false);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testuser',
          password: 'wrongpassword'
        }
      });

      // Call the controller function
      await authController.login(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    it('should return 401 when user is not approved', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'driver',
        is_approved: false
      };

      // Mock the model functions and libraries
      User.findByUsername.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testuser',
          password: 'password123'
        }
      });

      // Call the controller function
      await authController.login(req, res);

      // Assertions
      expect(User.findByUsername).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account not approved yet'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.findByUsername.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        body: {
          username: 'testuser',
          password: 'password123'
        }
      });

      // Call the controller function
      await authController.login(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error during login'
      });
    });
  });

  describe('getMe', () => {
    it('should return user data successfully', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'driver',
        is_approved: true
      };

      // Mock the model function
      User.findById.mockResolvedValueOnce(mockUser);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'driver' }
      });

      // Call the controller function
      await authController.getMe(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        user: mockUser
      });
    });

    it('should return 404 when user not found', async () => {
      // Mock the model function to return null
      User.findById.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'driver' }
      });

      // Call the controller function
      await authController.getMe(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.findById.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'driver' }
      });

      // Call the controller function
      await authController.getMe(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldhashedpassword',
        role: 'driver'
      };

      // Mock the model functions and libraries
      User.findById.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(true);
      bcrypt.hash.mockResolvedValueOnce('newhashedpassword');
      User.updatePassword.mockResolvedValueOnce(true);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'driver' },
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        }
      });

      // Call the controller function
      await authController.updatePassword(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'oldhashedpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(User.updatePassword).toHaveBeenCalledWith(1, 'newhashedpassword');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password updated successfully'
      });
    });

    it('should return 401 when current password is incorrect', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldhashedpassword',
        role: 'driver'
      };

      // Mock the model functions and libraries
      User.findById.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(false);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'driver' },
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        }
      });

      // Call the controller function
      await authController.updatePassword(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'oldhashedpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Current password is incorrect'
      });
    });

    it('should return 404 when user not found', async () => {
      // Mock the model function to return null
      User.findById.mockResolvedValueOnce(null);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 999, role: 'driver' },
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        }
      });

      // Call the controller function
      await authController.updatePassword(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should return 500 when an error occurs', async () => {
      // Mock the model function to throw an error
      const error = new Error('Database error');
      User.findById.mockRejectedValueOnce(error);

      // Create mock request and response
      const { req, res } = createMockReqRes({
        user: { id: 1, role: 'driver' },
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        }
      });

      // Call the controller function
      await authController.updatePassword(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });
  });
});
