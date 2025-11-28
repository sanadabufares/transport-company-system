const sinon = require('sinon');
const { expect } = require('chai');
const Trip = require('../../models/trip');
const { pool } = require('../../config/db');

describe('Trip Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    sinon.restore();
    
    // Mock the database connection
    sinon.stub(pool, 'execute');
  });

  describe('create', () => {
    it('should create a new trip and return the ID', async () => {
      // Mock trip data
      const tripData = {
        company_id: 1,
        pickup_location: 'Location A',
        destination: 'Location B',
        trip_date: '2025-10-25',
        departure_time: '14:00:00',
        passenger_count: 4,
        vehicle_type: 8,
        company_price: 500,
        driver_price: 400,
        special_instructions: 'Some instructions'
      };

      // Mock the database response
      pool.execute.resolves([{ insertId: 5 }]);

      // Call the function
      const result = await Trip.create(tripData);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('INSERT INTO trips');
      expect(pool.execute.firstCall.args[1]).to.include(1);
      expect(pool.execute.firstCall.args[1]).to.include('Location A');
      expect(pool.execute.firstCall.args[1]).to.include('Location B');
      expect(pool.execute.firstCall.args[1]).to.include('2025-10-25');
      expect(result).to.equal(5);
    });

    it('should throw an error when database query fails', async () => {
      // Mock trip data
      const tripData = {
        company_id: 1,
        pickup_location: 'Location A',
        destination: 'Location B',
        trip_date: '2025-10-25',
        departure_time: '14:00:00',
        passenger_count: 4,
        vehicle_type: 8,
        company_price: 500,
        driver_price: 400
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Trip.create(tripData);
        // Should not reach here
        expect.fail('Expected function to throw');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
    });
  });

  describe('findById', () => {
    it('should return trip data when trip exists', async () => {
      // Mock data
      const mockTrip = {
        id: 5,
        company_id: 1,
        driver_id: 3,
        pickup_location: 'Location A',
        destination: 'Location B',
        status: 'pending'
      };

      // Mock the database response
      pool.execute.resolves([[mockTrip]]);

      // Call the function
      const result = await Trip.findById(5);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT');
      expect(pool.execute.firstCall.args[0]).to.include('FROM trips');
      expect(pool.execute.firstCall.args[0]).to.include('WHERE id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([5]);
      expect(result).to.deep.equal(mockTrip);
    });

    it('should return null when trip does not exist', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Trip.findById(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trips WHERE id = ?'),
        [999]
      );
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.findById(5)).rejects.toThrow('Database error');
    });
  });

  describe('findByCompanyId', () => {
    it('should return trips for a company', async () => {
      // Mock data
      const mockTrips = [
        {
          id: 1,
          company_id: 2,
          pickup_location: 'Location A',
          destination: 'Location B'
        },
        {
          id: 2,
          company_id: 2,
          pickup_location: 'Location C',
          destination: 'Location D'
        }
      ];

      // Mock the database response
      pool.execute.resolves([mockTrips]);

      // Call the function
      const result = await Trip.findByCompanyId(2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trips WHERE company_id = ?'),
        [2]
      );
      expect(result).to.deep.equal(mockTrips);
    });

    it('should return empty array when no trips found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Trip.findByCompanyId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trips WHERE company_id = ?'),
        [999]
      );
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.findByCompanyId(2)).rejects.toThrow('Database error');
    });
  });

  describe('findByDriverId', () => {
    it('should return trips for a driver', async () => {
      // Mock data
      const mockTrips = [
        {
          id: 1,
          driver_id: 3,
          pickup_location: 'Location A',
          destination: 'Location B'
        },
        {
          id: 2,
          driver_id: 3,
          pickup_location: 'Location C',
          destination: 'Location D'
        }
      ];

      // Mock the database response
      pool.execute.resolves([mockTrips]);

      // Call the function
      const result = await Trip.findByDriverId(3);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trips WHERE driver_id = ?'),
        [3]
      );
      expect(result).to.deep.equal(mockTrips);
    });

    it('should return empty array when no trips found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Trip.findByDriverId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trips WHERE driver_id = ?'),
        [999]
      );
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.findByDriverId(3)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update a trip and return true', async () => {
      // Mock trip data
      const tripId = 5;
      const tripData = {
        pickup_location: 'Updated Location',
        destination: 'Updated Destination',
        passenger_count: 6
      };

      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Trip.update(tripId, tripData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trips SET'),
        expect.arrayContaining(['Updated Location', 'Updated Destination', 6, 5])
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock trip data
      const tripId = 999;
      const tripData = {
        pickup_location: 'Updated Location'
      };

      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Trip.update(tripId, tripData);

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock trip data
      const tripId = 5;
      const tripData = {
        pickup_location: 'Updated Location'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.update(tripId, tripData)).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should delete a trip and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Trip.delete(5);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM trips WHERE id = ?'),
        [5]
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Trip.delete(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM trips WHERE id = ?'),
        [999]
      );
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.delete(5)).rejects.toThrow('Database error');
    });
  });

  describe('assignDriver', () => {
    it('should assign a driver to a trip and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Trip.assignDriver(5, 3);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trips SET driver_id = ?, status = ? WHERE id = ?'),
        [3, 'assigned', 5]
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Trip.assignDriver(999, 3);

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.assignDriver(5, 3)).rejects.toThrow('Database error');
    });
  });

  describe('unassignDriver', () => {
    it('should unassign a driver from a trip and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Trip.unassignDriver(5);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trips SET driver_id = NULL, status = ? WHERE id = ?'),
        ['pending', 5]
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Trip.unassignDriver(999);

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.unassignDriver(5)).rejects.toThrow('Database error');
    });
  });

  describe('updateStatus', () => {
    it('should update trip status and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Trip.updateStatus(5, 'completed');

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trips SET status = ? WHERE id = ?'),
        ['completed', 5]
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Trip.updateStatus(999, 'completed');

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.updateStatus(5, 'completed')).rejects.toThrow('Database error');
    });
  });

  describe('getAvailableDriversForTrip', () => {
    it('should return available drivers for a trip', async () => {
      // Mock trip data
      const mockTrip = {
        id: 1,
        pickup_location: 'Location A',
        trip_date: '2025-10-25',
        departure_time: '14:00:00',
        vehicle_type: 8
      };

      // Mock available drivers
      const mockDrivers = [
        { id: 1, first_name: 'John', last_name: 'Doe' },
        { id: 2, first_name: 'Jane', last_name: 'Smith' }
      ];

      // Mock the database responses
      pool.execute.resolves([[mockTrip]]);
      pool.execute.resolves([mockDrivers]);

      // Call the function
      const result = await Trip.getAvailableDriversForTrip(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledTimes(2);
      expect(result).to.deep.equal(mockDrivers);
    });

    it('should return empty array when no trip found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Trip.getAvailableDriversForTrip(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledTimes(1);
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.getAvailableDriversForTrip(1)).rejects.toThrow('Database error');
    });
  });

  describe('getAvailableTripsForDriver', () => {
    it('should return available trips for a driver', async () => {
      // Mock driver data
      const mockDriver = {
        id: 3,
        current_location: 'Location A',
        vehicle_type: 8
      };

      // Mock available trips
      const mockTrips = [
        { id: 1, pickup_location: 'Location A', destination: 'Location B' },
        { id: 2, pickup_location: 'Location A', destination: 'Location C' }
      ];

      // Mock the database responses
      pool.execute.resolves([[mockDriver]]);
      pool.execute.resolves([mockTrips]);

      // Call the function
      const result = await Trip.getAvailableTripsForDriver(3);

      // Assertions
      expect(pool.execute).toHaveBeenCalledTimes(2);
      expect(result).to.deep.equal(mockTrips);
    });

    it('should return empty array when no driver found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Trip.getAvailableTripsForDriver(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledTimes(1);
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Trip.getAvailableTripsForDriver(3)).rejects.toThrow('Database error');
    });
  });
});
