const TripRequest = require('../../models/tripRequest');
const { pool } = require('../../config/db');

// Mock the database connection
// Converted from jest.mock - use sinon.stub instead
// '../../config/db', ( => ({
  pool: {
    execute: sinon.stub()
  }
}));

describe('TripRequest Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    sinon.restore();
  });

  describe('create', () => {
    it('should create a new trip request and return the ID', async () => {
      // Mock trip request data
      const requestData = {
        trip_id: 1,
        driver_id: 2,
        request_type: 'company_to_driver'
      };

      // Mock the database response
      pool.execute.resolves([{ insertId: 5 }]);

      // Call the function
      const result = await TripRequest.create(requestData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO trip_requests'),
        expect.arrayContaining([1, 2, 'company_to_driver'])
      );
      expect(result).to.equal(5);
    });

    it('should throw an error when database query fails', async () => {
      // Mock trip request data
      const requestData = {
        trip_id: 1,
        driver_id: 2,
        request_type: 'company_to_driver'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.create(requestData)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return trip request data when request exists', async () => {
      // Mock data
      const mockRequest = {
        id: 5,
        trip_id: 1,
        driver_id: 2,
        request_type: 'company_to_driver',
        status: 'pending'
      };

      // Mock the database response
      pool.execute.resolves([[mockRequest]]);

      // Call the function
      const result = await TripRequest.findById(5);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE id = ?'),
        [5]
      );
      expect(result).to.deep.equal(mockRequest);
    });

    it('should return null when trip request does not exist', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await TripRequest.findById(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE id = ?'),
        [999]
      );
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.findById(5)).rejects.toThrow('Database error');
    });
  });

  describe('findByTripAndDriver', () => {
    it('should return trip request when found', async () => {
      // Mock data
      const mockRequest = {
        id: 5,
        trip_id: 1,
        driver_id: 2,
        request_type: 'driver_to_company',
        status: 'pending'
      };

      // Mock the database response
      pool.execute.resolves([[mockRequest]]);

      // Call the function
      const result = await TripRequest.findByTripAndDriver(1, 2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE trip_id = ? AND driver_id = ?'),
        [1, 2]
      );
      expect(result).to.deep.equal(mockRequest);
    });

    it('should return null when trip request does not exist', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await TripRequest.findByTripAndDriver(999, 2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE trip_id = ? AND driver_id = ?'),
        [999, 2]
      );
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.findByTripAndDriver(1, 2)).rejects.toThrow('Database error');
    });
  });

  describe('getByDriverId', () => {
    it('should return trip requests for a driver', async () => {
      // Mock data
      const mockRequests = [
        {
          id: 1,
          trip_id: 1,
          driver_id: 2,
          request_type: 'driver_to_company'
        },
        {
          id: 2,
          trip_id: 3,
          driver_id: 2,
          request_type: 'driver_to_company'
        }
      ];

      // Mock the database response
      pool.execute.resolves([mockRequests]);

      // Call the function
      const result = await TripRequest.getByDriverId(2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE driver_id = ?'),
        [2]
      );
      expect(result).to.deep.equal(mockRequests);
    });

    it('should return empty array when no requests found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await TripRequest.getByDriverId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE driver_id = ?'),
        [999]
      );
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.getByDriverId(2)).rejects.toThrow('Database error');
    });
  });

  describe('getByCompanyId', () => {
    it('should return trip requests for a company', async () => {
      // Mock data
      const mockRequests = [
        {
          id: 1,
          trip_id: 1,
          driver_id: 2,
          request_type: 'company_to_driver'
        },
        {
          id: 2,
          trip_id: 3,
          driver_id: 4,
          request_type: 'company_to_driver'
        }
      ];

      // Mock the database response
      pool.execute.resolves([mockRequests]);

      // Call the function
      const result = await TripRequest.getByCompanyId(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT tr.* FROM trip_requests tr JOIN trips t ON tr.trip_id = t.id WHERE t.company_id = ?'),
        [1]
      );
      expect(result).to.deep.equal(mockRequests);
    });

    it('should return empty array when no requests found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await TripRequest.getByCompanyId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT tr.* FROM trip_requests tr JOIN trips t ON tr.trip_id = t.id WHERE t.company_id = ?'),
        [999]
      );
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.getByCompanyId(1)).rejects.toThrow('Database error');
    });
  });

  describe('updateStatus', () => {
    it('should update trip request status and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await TripRequest.updateStatus(5, 'accepted');

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE trip_requests SET status = ? WHERE id = ?'),
        ['accepted', 5]
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await TripRequest.updateStatus(999, 'accepted');

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.updateStatus(5, 'accepted')).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should delete a trip request and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await TripRequest.delete(5);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM trip_requests WHERE id = ?'),
        [5]
      );
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await TripRequest.delete(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM trip_requests WHERE id = ?'),
        [999]
      );
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.delete(5)).rejects.toThrow('Database error');
    });
  });

  describe('countPendingByDriverId', () => {
    it('should return count of pending trip requests for a driver', async () => {
      // Mock data
      const mockCount = [{ count: 3 }];

      // Mock the database response
      pool.execute.resolves([mockCount]);

      // Call the function
      const result = await TripRequest.countPendingByDriverId(2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM trip_requests WHERE driver_id = ? AND status = ?'),
        [2, 'pending']
      );
      expect(result).to.equal(3);
    });

    it('should return 0 when no pending requests found', async () => {
      // Mock data
      const mockCount = [{ count: 0 }];

      // Mock the database response
      pool.execute.resolves([mockCount]);

      // Call the function
      const result = await TripRequest.countPendingByDriverId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM trip_requests WHERE driver_id = ? AND status = ?'),
        [999, 'pending']
      );
      expect(result).to.equal(0);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.countPendingByDriverId(2)).rejects.toThrow('Database error');
    });
  });

  describe('getCompanyRequestsForDriver', () => {
    it('should return company requests for a driver', async () => {
      // Mock data
      const mockRequests = [
        {
          id: 1,
          trip_id: 1,
          driver_id: 2,
          request_type: 'company_to_driver',
          status: 'pending'
        },
        {
          id: 2,
          trip_id: 3,
          driver_id: 2,
          request_type: 'company_to_driver',
          status: 'pending'
        }
      ];

      // Mock the database response
      pool.execute.resolves([mockRequests]);

      // Call the function
      const result = await TripRequest.getCompanyRequestsForDriver(2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE driver_id = ? AND request_type = ?'),
        [2, 'company_to_driver']
      );
      expect(result).to.deep.equal(mockRequests);
    });

    it('should return empty array when no company requests found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await TripRequest.getCompanyRequestsForDriver(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM trip_requests WHERE driver_id = ? AND request_type = ?'),
        [999, 'company_to_driver']
      );
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(TripRequest.getCompanyRequestsForDriver(2)).rejects.toThrow('Database error');
    });
  });
});
