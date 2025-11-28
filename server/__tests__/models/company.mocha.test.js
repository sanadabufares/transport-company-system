const Company = require('../../models/company');
const { pool } = require('../../config/db');
const sinon = require('sinon');
const { expect } = require('chai');

// Set up stub for database connection
const dbStub = sinon.stub(pool, 'execute');

describe('Company Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    sinon.restore();
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
      pool.execute.resolves([[mockCompany]]);

      // Call the function
      const result = await Company.findByUserId(5);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM companies WHERE user_id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([5]);
      expect(result).to.deep.equal(mockCompany);
    });

    it('should return null when company does not exist', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Company.findByUserId(999);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM companies WHERE user_id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([999]);
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Company.findByUserId(5);
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
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
      pool.execute.resolves([[mockCompany]]);

      // Call the function
      const result = await Company.findById(1);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM companies WHERE id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([1]);
      expect(result).to.deep.equal(mockCompany);
    });

    it('should return null when company does not exist', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Company.findById(999);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM companies WHERE id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([999]);
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Company.findById(1);
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
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
      pool.execute.resolves([{ insertId: 2 }]);

      // Call the function
      const result = await Company.create(companyData);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('INSERT INTO companies');
      expect(pool.execute.firstCall.args[1]).to.include(5);
      expect(pool.execute.firstCall.args[1]).to.include('New Company');
      expect(pool.execute.firstCall.args[1]).to.include('Jane Doe');
      expect(pool.execute.firstCall.args[1]).to.include('098-765-4321');
      expect(pool.execute.firstCall.args[1]).to.include('456 New Street');
      expect(result).to.equal(2);
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
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Company.create(companyData);
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
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
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Company.update(companyId, companyData);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('UPDATE companies SET');
      expect(pool.execute.firstCall.args[1]).to.include('Updated Company');
      expect(pool.execute.firstCall.args[1]).to.include('Updated Contact');
      expect(pool.execute.firstCall.args[1]).to.include('111-222-3333');
      expect(pool.execute.firstCall.args[1]).to.include(1);
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock company data
      const companyId = 999;
      const companyData = {
        company_name: 'Updated Company'
      };

      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Company.update(companyId, companyData);

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock company data
      const companyId = 1;
      const companyData = {
        company_name: 'Updated Company'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Company.update(companyId, companyData);
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
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
      pool.execute.resolves([mockCompanies]);

      // Call the function
      const result = await Company.getAll();

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM companies');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([]);
      expect(result).to.deep.equal(mockCompanies);
    });

    it('should return empty array when no companies found', async () => {
      // Mock empty response
      pool.execute.resolves([[]]);

      // Call the function
      const result = await Company.getAll();

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM companies');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([]);
      expect(result).to.deep.equal([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Company.getAll();
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
    });
  });

  describe('updateRating', () => {
    it('should update company rating and return true', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 1 }]);

      // Call the function
      const result = await Company.updateRating(1, 4.5, 10);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('UPDATE companies SET rating = ?, rating_count = ? WHERE id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([4.5, 10, 1]);
      expect(result).to.equal(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.resolves([{ affectedRows: 0 }]);

      // Call the function
      const result = await Company.updateRating(999, 4.5, 10);

      // Assertions
      expect(pool.execute.called).to.be.true;
      expect(result).to.equal(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await Company.updateRating(1, 4.5, 10);
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
    });
  });
});
