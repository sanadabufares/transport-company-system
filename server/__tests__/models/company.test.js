const Company = require('../../models/company');
const { pool } = require('../../config/db');

// Mock the database connection
jest.mock('../../config/db', () => ({
  pool: {
    execute: jest.fn()
  }
}));

describe('Company Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should return company data when company exists', async () => {
      // Mock data
      const mockCompany = {
        id: 1,
        user_id: 5,
        company_name: 'Test Company',
        contact_person: 'John Smith',
        phone: '123-456-7890'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([[mockCompany]]);

      // Call the function
      const result = await Company.findByUserId(5);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM companies WHERE user_id = ?'),
        [5]
      );
      expect(result).toEqual(mockCompany);
    });

    it('should return null when company does not exist', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Company.findByUserId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM companies WHERE user_id = ?'),
        [999]
      );
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Company.findByUserId(5)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return company data when company exists', async () => {
      // Mock data
      const mockCompany = {
        id: 1,
        user_id: 5,
        company_name: 'Test Company',
        contact_person: 'John Smith',
        phone: '123-456-7890'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([[mockCompany]]);

      // Call the function
      const result = await Company.findById(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM companies WHERE id = ?'),
        [1]
      );
      expect(result).toEqual(mockCompany);
    });

    it('should return null when company does not exist', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Company.findById(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM companies WHERE id = ?'),
        [999]
      );
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Company.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new company and return the ID', async () => {
      // Mock company data
      const companyData = {
        user_id: 5,
        company_name: 'New Company',
        contact_person: 'Jane Doe',
        phone: '098-765-4321',
        address: '456 New Street'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ insertId: 2 }]);

      // Call the function
      const result = await Company.create(companyData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO companies'),
        expect.arrayContaining([
          5, 'New Company', 'Jane Doe', '098-765-4321', '456 New Street'
        ])
      );
      expect(result).toBe(2);
    });

    it('should throw an error when database query fails', async () => {
      // Mock company data
      const companyData = {
        user_id: 5,
        company_name: 'New Company',
        contact_person: 'Jane Doe',
        phone: '098-765-4321',
        address: '456 New Street'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Company.create(companyData)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update a company and return true', async () => {
      // Mock company data
      const companyId = 1;
      const companyData = {
        company_name: 'Updated Company',
        contact_person: 'Updated Contact',
        phone: '111-222-3333'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await Company.update(companyId, companyData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE companies SET'),
        expect.arrayContaining(['Updated Company', 'Updated Contact', '111-222-3333', 1])
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock company data
      const companyId = 999;
      const companyData = {
        company_name: 'Updated Company'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await Company.update(companyId, companyData);

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock company data
      const companyId = 1;
      const companyData = {
        company_name: 'Updated Company'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Company.update(companyId, companyData)).rejects.toThrow('Database error');
    });
  });

  describe('getAll', () => {
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

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockCompanies]);

      // Call the function
      const result = await Company.getAll();

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM companies'),
        []
      );
      expect(result).toEqual(mockCompanies);
    });

    it('should return empty array when no companies found', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Company.getAll();

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM companies'),
        []
      );
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Company.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('updateRating', () => {
    it('should update company rating and return true', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await Company.updateRating(1, 4.5, 10);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE companies SET rating = ?, rating_count = ? WHERE id = ?'),
        [4.5, 10, 1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await Company.updateRating(999, 4.5, 10);

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Company.updateRating(1, 4.5, 10)).rejects.toThrow('Database error');
    });
  });
});
