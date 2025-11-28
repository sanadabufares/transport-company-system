const { pool } = require('../config/db');

const Notification = {
  // Create a new notification
  create: async (notification) => {
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [notification.user_id, notification.title, notification.message]
    );
    return result.insertId;
  },

  // Find notifications for a user
  findByUserId: async (userId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  // Mark notification as read
  markAsRead: async (id, userId) => {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Get unread notifications count
  getUnreadCount: async (userId) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  },
  
  // Alias for getUnreadCount - used by the dashboard API
  countUnreadByUserId: async (userId) => {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  }
};

module.exports = Notification;
