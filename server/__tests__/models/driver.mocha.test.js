const Driver = require('../../models/driver');
const { pool } = require('../../config/db');

// Mock the database connection
// Converted from jest.mock - use sinon.stub instead
// '../../config/db', ( => ({
  pool: {
    execute: sinon.stub()
  }
}));

describe('Driver Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    sinon.restore();
  });

  describe('findByUserId', () => {
    it('should return driver data when driver exists', async () => {
      // Mock data
      const mockDriver = {
        id: 1,
        user_id: 5,
        first_name: 'John',
        last_name: 'Doe'
      };

      // Mock the database response
      pool.execute.resolves([[mockDriver]]);

      // Call the function
      const result = await Driver.findByUserId(5);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM drivers WHERE user_id = ?'),
        [5]
      );
      expect(result).to.deep.equal(mockDriver);
    });

    it('should return null when driver does not exist', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Driver.findByUserId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM drivers WHERE user_id = ?'),
        [999]
      );
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      await expect(Driver.findByUserId(5)).rejects.toThrow('Database error');
    });
  });

  // Add more test cases for other Driver model functions
});
