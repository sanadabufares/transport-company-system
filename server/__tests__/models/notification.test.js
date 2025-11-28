const Notification = require('../../models/notification');
const { pool } = require('../../config/db');

// Mock the database connection
jest.mock('../../config/db', () => ({
  pool: {
    execute: jest.fn()
  }
}));

describe('Notification Model', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new notification and return the ID', async () => {
      // Mock notification data
      const notificationData = {
        user_id: 1,
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ insertId: 5 }]);

      // Call the function
      const result = await Notification.create(notificationData);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.arrayContaining([1, 'Test Notification', 'This is a test notification'])
      );
      expect(result).toBe(5);
    });

    it('should throw an error when database query fails', async () => {
      // Mock notification data
      const notificationData = {
        user_id: 1,
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Notification.create(notificationData)).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    it('should return notifications for a user', async () => {
      // Mock data
      const mockNotifications = [
        {
          id: 1,
          user_id: 1,
          title: 'Notification 1',
          message: 'Message 1',
          is_read: false
        },
        {
          id: 2,
          user_id: 1,
          title: 'Notification 2',
          message: 'Message 2',
          is_read: true
        }
      ];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockNotifications]);

      // Call the function
      const result = await Notification.findByUserId(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'),
        [1]
      );
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications found', async () => {
      // Mock empty response
      pool.execute.mockResolvedValueOnce([[]]);

      // Call the function
      const result = await Notification.findByUserId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'),
        [999]
      );
      expect(result).toEqual([]);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Notification.findByUserId(1)).rejects.toThrow('Database error');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read and return true', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // Call the function
      const result = await Notification.markAsRead(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications SET is_read = TRUE WHERE id = ?'),
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await Notification.markAsRead(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Notification.markAsRead(1)).rejects.toThrow('Database error');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user and return true', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 3 }]);

      // Call the function
      const result = await Notification.markAllAsRead(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE'),
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no rows affected', async () => {
      // Mock the database response
      pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      // Call the function
      const result = await Notification.markAllAsRead(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Notification.markAllAsRead(1)).rejects.toThrow('Database error');
    });
  });

  describe('countUnreadByUserId', () => {
    it('should return count of unread notifications for a user', async () => {
      // Mock data
      const mockCount = [{ count: 3 }];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockCount]);

      // Call the function
      const result = await Notification.countUnreadByUserId(1);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE'),
        [1]
      );
      expect(result).toBe(3);
    });

    it('should return 0 when no unread notifications found', async () => {
      // Mock data
      const mockCount = [{ count: 0 }];

      // Mock the database response
      pool.execute.mockResolvedValueOnce([mockCount]);

      // Call the function
      const result = await Notification.countUnreadByUserId(999);

      // Assertions
      expect(pool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE'),
        [999]
      );
      expect(result).toBe(0);
    });

    it('should throw an error when database query fails', async () => {
      // Mock database error
      const error = new Error('Database error');
      pool.execute.mockRejectedValueOnce(error);

      // Call the function and expect it to throw
      await expect(Notification.countUnreadByUserId(1)).rejects.toThrow('Database error');
    });
  });
});
