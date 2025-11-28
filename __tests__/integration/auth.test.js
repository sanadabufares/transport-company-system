const request = require('supertest');
const { expect } = require('chai');
const { app, server } = require('../../server/app');
const { pool } = require('../../server/config/db');
const bcrypt = require('bcryptjs');

describe('Authentication Integration Tests', () => {
  let testUserId;
  let authToken;

  // Create a test user before running tests
  before(async () => {
    try {
      // Clear any existing test user
      await pool.execute('DELETE FROM users WHERE username = ?', ['integrationtest']);
      
      // Create a new test user
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['integrationtest', 'integration@test.com', hashedPassword, 'company']
      );
      
      testUserId = result.insertId;
      
      // Create a company profile for the test user
      await pool.execute(
        'INSERT INTO company_profiles (user_id, company_name, contact_person, phone, address) VALUES (?, ?, ?, ?, ?)',
        [testUserId, 'Integration Test Company', 'Test User', '123-456-7890', '123 Test St']
      );
      
      console.log('Test user created with ID:', testUserId);
    } catch (err) {
      console.error('Error setting up test user:', err);
      throw err;
    }
  });

  // Clean up after tests
  after(async () => {
    try {
      // Delete the test user and associated profile
      await pool.execute('DELETE FROM company_profiles WHERE user_id = ?', [testUserId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
      console.log('Test user cleaned up');
      
      // Close the server and database connection
      server.close();
      await pool.end();
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
  });

  describe('Login Flow', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'integrationtest',
          password: 'wrongpassword'
        });
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message').that.includes('Invalid credentials');
    });

    it('should login with valid credentials and return token and user data', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'integrationtest',
          password: 'testpassword'
        });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('username', 'integrationtest');
      expect(res.body.user).to.have.property('role', 'company');
      expect(res.body).to.have.property('profile');
      expect(res.body.profile).to.have.property('company_name', 'Integration Test Company');
      
      // Save token for subsequent tests
      authToken = res.body.token;
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without a token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message').that.includes('No token provided');
    });

    it('should reject requests with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message').that.includes('Invalid token');
    });

    it('should allow access with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('username', 'integrationtest');
      expect(res.body).to.have.property('profile');
      expect(res.body.profile).to.have.property('company_name', 'Integration Test Company');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should deny access to admin routes for non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message').that.includes('Access denied');
    });

    it('should allow access to company routes for company users', async () => {
      const res = await request(app)
        .get('/api/company/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('company_name', 'Integration Test Company');
    });

    it('should deny access to driver routes for company users', async () => {
      const res = await request(app)
        .get('/api/driver/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('message').that.includes('Access denied');
    });
  });
});
