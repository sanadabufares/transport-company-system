const Rating = require('../../models/rating');
const { pool } = require('../../config/db');

// Mock the database connection
jest.mock('../../config/db', () => ({
  pool: {
    execute: jest.fn()
  }
}));

describe('Rating Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new rating and return the ID', async () => {
      // Mock rating data
      const ratingData = {
        trip_id: 1,
        company_id: 1,
        driver_id: 2,
        rated_by: 'company',
        rating: 5,
        comment: 'Great service!'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ insertId: 5 }]);

      // Call the function
      const result = await Rating.create(ratingData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ratings'),
        expect.arrayContaining([1, 1, 2, 'company', 5, 'Great service!'])
      );
      expect(result).toBe(5);
    });

    it('should throw an error when database query fails', async () => {
      // Mock rating data
      const ratingData = {
        trip_id: 1,
        company_id: 1,
        driver_id: 2,
        rated_by: 'company',
        rating: 5,
        comment: 'Great service!'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Rating.create(ratingData)).rejects.toThrow('Database error');
    });
  });

  describe('findByTripId', () => {
    it('should return ratings for a trip', async () => {
      // Mock data
      const mockRatings = [
        {
          id: 1,
          trip_id: 1,
          company_id: 1,
          driver_id: 2,
          rated_by: 'company',
          rating: 5,
          comment: 'Great service!'
        },
        {
          id: 2,
          trip_id: 1,
          company_id: 1,
          driver_id: 2,
          rated_by: 'driver',
          rating: 4,
          comment: 'Good company to work with'
        }
      ];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockRatings]);

      // Call the function
      const result = await Rating.findByTripId(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ratings WHERE trip_id = ?'),
        [1]
      );
      expect(result).toEqual(mockRatings);
    });

    it('should return empty array when no ratings found', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Rating.findByTripId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ratings WHERE trip_id = ?'),
        [999]
      );
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Rating.findByTripId(1)).rejects.toThrow('Database error');
    });
  });

  describe('getCompanyRatings', () => {
    it('should return ratings for a company', async () => {
      // Mock data
      const mockRatings = [
        {
          id: 1,
          trip_id: 1,
          company_id: 1,
          driver_id: 2,
          rated_by: 'driver',
          rating: 5,
          comment: 'Great company to work with'
        },
        {
          id: 2,
          trip_id: 3,
          company_id: 1,
          driver_id: 4,
          rated_by: 'driver',
          rating: 4,
          comment: 'Good company'
        }
      ];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockRatings]);

      // Call the function
      const result = await Rating.getCompanyRatings(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ratings WHERE company_id = ? AND rated_by = ?'),
        [1, 'driver']
      );
      expect(result).toEqual(mockRatings);
    });

    it('should return empty array when no ratings found', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Rating.getCompanyRatings(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ratings WHERE company_id = ? AND rated_by = ?'),
        [999, 'driver']
      );
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Rating.getCompanyRatings(1)).rejects.toThrow('Database error');
    });
  });

  describe('getDriverRatings', () => {
    it('should return ratings for a driver', async () => {
      // Mock data
      const mockRatings = [
        {
          id: 1,
          trip_id: 1,
          company_id: 1,
          driver_id: 2,
          rated_by: 'company',
          rating: 5,
          comment: 'Great service!'
        },
        {
          id: 2,
          trip_id: 3,
          company_id: 2,
          driver_id: 2,
          rated_by: 'company',
          rating: 4,
          comment: 'Good driver'
        }
      ];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockRatings]);

      // Call the function
      const result = await Rating.getDriverRatings(2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ratings WHERE driver_id = ? AND rated_by = ?'),
        [2, 'company']
      );
      expect(result).toEqual(mockRatings);
    });

    it('should return empty array when no ratings found', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Rating.getDriverRatings(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ratings WHERE driver_id = ? AND rated_by = ?'),
        [999, 'company']
      );
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Rating.getDriverRatings(2)).rejects.toThrow('Database error');
    });
  });

  describe('getAverageCompanyRating', () => {
    it('should return average rating for a company', async () => {
      // Mock data
      const mockAvgRating = [{ avg_rating: 4.5 }];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockAvgRating]);

      // Call the function
      const result = await Rating.getAverageCompanyRating(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT AVG(rating) as avg_rating FROM ratings WHERE company_id = ? AND rated_by = ?'),
        [1, 'driver']
      );
      expect(result).toBe(4.5);
    });

    it('should return null when no ratings found', async () => {
      // Mock data
      const mockAvgRating = [{ avg_rating: null }];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockAvgRating]);

      // Call the function
      const result = await Rating.getAverageCompanyRating(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT AVG(rating) as avg_rating FROM ratings WHERE company_id = ? AND rated_by = ?'),
        [999, 'driver']
      );
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Rating.getAverageCompanyRating(1)).rejects.toThrow('Database error');
    });
  });

  describe('getAverageDriverRating', () => {
    it('should return average rating for a driver', async () => {
      // Mock data
      const mockAvgRating = [{ avg_rating: 4.8 }];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockAvgRating]);

      // Call the function
      const result = await Rating.getAverageDriverRating(2);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT AVG(rating) as avg_rating FROM ratings WHERE driver_id = ? AND rated_by = ?'),
        [2, 'company']
      );
      expect(result).toBe(4.8);
    });

    it('should return null when no ratings found', async () => {
      // Mock data
      const mockAvgRating = [{ avg_rating: null }];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockAvgRating]);

      // Call the function
      const result = await Rating.getAverageDriverRating(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT AVG(rating) as avg_rating FROM ratings WHERE driver_id = ? AND rated_by = ?'),
        [999, 'company']
      );
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Rating.getAverageDriverRating(2)).rejects.toThrow('Database error');
    });
  });
});
