const User = require('../../models/user');
const { pool } = require('../../config/db');
const sinon = require('sinon');
const { expect } = require('chai');

describe('User Model', () => {
  beforeEach(() => {
    // Set up the stub for database connection
    sinon.restore();
    sinon.stub(pool, 'execute');
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('findById', () => {
    it('should return user data when user exists', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'driver',
        is_approved: true
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([[mockUser]]);

      // Call the function
      const result = await User.findById(1);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT id, username, email, role, is_approved FROM users WHERE id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([1]);
      expect(result).to.deep.equal(mockUser);
    });

    it('should return null when user does not exist', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await User.findById(999);

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT id, username, email, role, is_approved FROM users WHERE id = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal([999]);
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await User.findById(1);
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
    });
  });

  describe('findByUsername', () => {
    it('should return user data when user exists', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'driver',
        is_approved: true
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([[mockUser]]);

      // Call the function
      const result = await User.findByUsername('testuser');

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM users WHERE username = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal(['testuser']);
      expect(result).to.deep.equal(mockUser);
    });

    it('should return null when user does not exist', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await User.findByUsername('nonexistentuser');

      // Assertions
      expect(pool.execute.calledOnce).to.be.true;
      expect(pool.execute.firstCall.args[0]).to.include('SELECT * FROM users WHERE username = ?');
      expect(pool.execute.firstCall.args[1]).to.deep.equal(['nonexistentuser']);
      expect(result).to.be.null;
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.rejects(error);

      // Call the function and expect it to throw
      try {
        await User.findByUsername('testuser');
        // Should not reach here
        expect.fail('Expected an error but none was thrown');
      } catch (err) {
        expect(err.message).to.equal('Database error');
      }
    });
  });

  describe('findByEmail', () => {
    it('should return user data when user exists', async () => {
      // Mock data
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'driver',
        is_approved: true
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([[mockUser]]);

      // Call the function
      const result = await User.findByEmail('test@example.com');

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = ?'),
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await User.findByEmail('nonexistent@example.com');

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = ?'),
        ['nonexistent@example.com']
      );
      expect(result).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.findByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new user and return the ID', async () => {
      // Mock user data
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'hashedpassword',
        role: 'driver'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ insertId: 5 }]);

      // Call the function
      const result = await User.create(userData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          'newuser', 'newuser@example.com', 'hashedpassword', 'driver', false
        ])
      );
      expect(result).toBe(5);
    });

    it('should throw an error when database query fails', async () => {
      // Mock user data
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'hashedpassword',
        role: 'driver'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.create(userData)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update a user and return true', async () => {
      // Mock user data
      const userId = 1;
      const userData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await User.update(userId, userData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['updateduser', 'updated@example.com', 1])
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock user data
      const userId = 999;
      const userData = {
        username: 'updateduser'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await User.update(userId, userData);

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock user data
      const userId = 1;
      const userData = {
        username: 'updateduser'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.update(userId, userData)).rejects.toThrow('Database error');
    });
  });

  describe('updatePassword', () => {
    it('should update user password and return true', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await User.updatePassword(1, 'newhashedpassword');

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password = ? WHERE id = ?'),
        ['newhashedpassword', 1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await User.updatePassword(999, 'newhashedpassword');

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.updatePassword(1, 'newhashedpassword')).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should delete a user and return true', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await User.delete(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = ?'),
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await User.delete(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = ?'),
        [999]
      );
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.delete(1)).rejects.toThrow('Database error');
    });
  });

  describe('getAllPending', () => {
    it('should return all pending users', async () => {
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

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockUsers]);

      // Call the function
      const result = await User.getAllPending();

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE is_approved = FALSE'),
        []
      );
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no pending users found', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await User.getAllPending();

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE is_approved = FALSE'),
        []
      );
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.getAllPending()).rejects.toThrow('Database error');
    });
  });

  describe('approve', () => {
    it('should approve a user and return true', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await User.approve(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_approved = TRUE WHERE id = ?'),
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await User.approve(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(User.approve(1)).rejects.toThrow('Database error');
    });
  });
});
