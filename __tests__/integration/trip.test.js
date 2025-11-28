const request = require('supertest');
const { expect } = require('chai');
const { app, server } = require('../../server/app');
const { pool } = require('../../server/config/db');
const bcrypt = require('bcryptjs');

describe('Trip Integration Tests', () => {
  let companyUserId;
  let driverUserId;
  let companyToken;
  let driverToken;
  let tripId;

  // Create test users before running tests
  before(async () => {
    try {
      // Clear any existing test users
      await pool.execute('DELETE FROM users WHERE username IN (?, ?)', ['companytest', 'drivertest']);
      
      // Create a company test user
      const companyPassword = await bcrypt.hash('testpassword', 10);
      const [companyResult] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['companytest', 'company@test.com', companyPassword, 'company']
      );
      
      companyUserId = companyResult.insertId;
      
      // Create a company profile
      await pool.execute(
        'INSERT INTO company_profiles (user_id, company_name, contact_person, phone, address) VALUES (?, ?, ?, ?, ?)',
        [companyUserId, 'Test Company', 'Company User', '123-456-7890', '123 Company St']
      );
      
      // Create a driver test user
      const driverPassword = await bcrypt.hash('testpassword', 10);
      const [driverResult] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['drivertest', 'driver@test.com', driverPassword, 'driver']
      );
      
      driverUserId = driverResult.insertId;
      
      // Create a driver profile
      await pool.execute(
        'INSERT INTO driver_profiles (user_id, first_name, last_name, phone, address, license_number, license_expiry, vehicle_type, vehicle_plate, current_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [driverUserId, 'Test', 'Driver', '987-654-3210', '456 Driver St', 'DL12345', '2025-12-31', 8, 'ABC123', 'Test City']
      );
      
      console.log('Test users created with IDs:', { companyUserId, driverUserId });
      
      // Get tokens for both users
      const companyLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'companytest',
          password: 'testpassword'
        });
      
      companyToken = companyLoginRes.body.token;
      
      const driverLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'drivertest',
          password: 'testpassword'
        });
      
      driverToken = driverLoginRes.body.token;
      
    } catch (err) {
      console.error('Error setting up test users:', err);
      throw err;
    }
  });

  // Clean up after tests
  after(async () => {
    try {
      // Delete test data
      if (tripId) {
        await pool.execute('DELETE FROM trips WHERE id = ?', [tripId]);
      }
      
      await pool.execute('DELETE FROM driver_profiles WHERE user_id = ?', [driverUserId]);
      await pool.execute('DELETE FROM company_profiles WHERE user_id = ?', [companyUserId]);
      await pool.execute('DELETE FROM users WHERE id IN (?, ?)', [companyUserId, driverUserId]);
      
      console.log('Test data cleaned up');
      
      // Close the server and database connection
      server.close();
      await pool.end();
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
  });

  describe('Trip Creation and Management', () => {
    it('should allow a company to create a trip', async () => {
      const tripData = {
        pickup_location: 'Test Pickup',
        dropoff_location: 'Test Dropoff',
        pickup_date: '2025-12-01',
        pickup_time: '10:00:00',
        passenger_count: 2,
        special_requirements: 'None',
        status: 'pending',
        price: 100.50,
        visa_number: 'V12345678'
      };
      
      const res = await request(app)
        .post('/api/trip')
        .set('Authorization', `Bearer ${companyToken}`)
        .send(tripData);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('message').that.includes('Trip created');
      expect(res.body).to.have.property('tripId');
      
      tripId = res.body.tripId;
    });

    it('should allow retrieving trip details', async () => {
      const res = await request(app)
        .get(`/api/trip/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', tripId);
      expect(res.body).to.have.property('pickup_location', 'Test Pickup');
      expect(res.body).to.have.property('dropoff_location', 'Test Dropoff');
      expect(res.body).to.have.property('status', 'pending');
    });

    it('should allow a company to update a trip', async () => {
      const updateData = {
        pickup_location: 'Updated Pickup',
        special_requirements: 'Updated requirements'
      };
      
      const res = await request(app)
        .put(`/api/trip/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send(updateData);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message').that.includes('Trip updated');
    });

    it('should reflect the updated trip details', async () => {
      const res = await request(app)
        .get(`/api/trip/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('pickup_location', 'Updated Pickup');
      expect(res.body).to.have.property('special_requirements', 'Updated requirements');
    });
  });

  describe('Trip Assignment Flow', () => {
    it('should allow a driver to view available trips', async () => {
      const res = await request(app)
        .get('/api/trip/available')
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      // The created trip should be in the available trips
      const createdTrip = res.body.find(trip => trip.id === tripId);
      expect(createdTrip).to.exist;
    });

    it('should allow a driver to request a trip', async () => {
      const res = await request(app)
        .post(`/api/trip/${tripId}/request`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message').that.includes('Trip request submitted');
    });

    it('should allow a company to view trip requests', async () => {
      const res = await request(app)
        .get(`/api/trip/${tripId}/requests`)
        .set('Authorization', `Bearer ${companyToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      
      const driverRequest = res.body.find(req => req.driver_id === driverUserId);
      expect(driverRequest).to.exist;
    });

    it('should allow a company to assign a driver to a trip', async () => {
      const res = await request(app)
        .post(`/api/trip/${tripId}/assign/${driverUserId}`)
        .set('Authorization', `Bearer ${companyToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message').that.includes('Driver assigned');
    });

    it('should update the trip status to assigned', async () => {
      const res = await request(app)
        .get(`/api/trip/${tripId}`)
        .set('Authorization', `Bearer ${companyToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'assigned');
      expect(res.body).to.have.property('driver_id', driverUserId);
    });
  });

  describe('Trip Execution Flow', () => {
    it('should allow a driver to start the trip', async () => {
      const res = await request(app)
        .post(`/api/trip/${tripId}/start`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message').that.includes('Trip started');
    });

    it('should update the trip status to active', async () => {
      const res = await request(app)
        .get(`/api/trip/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'active');
    });

    it('should allow a driver to complete the trip', async () => {
      const res = await request(app)
        .post(`/api/trip/${tripId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message').that.includes('Trip completed');
    });

    it('should update the trip status to completed', async () => {
      const res = await request(app)
        .get(`/api/trip/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'completed');
    });
  });
});
