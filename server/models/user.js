const { pool, withTransaction } = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
  // Create a new user
  create: async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [user.username, user.email, hashedPassword, user.role]
    );
    return result.insertId;
  },

  // Update user email
  updateEmail: async (id, email) => {
    return withTransaction(async (connection) => {
      const [result] = await connection.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [email, id]
      );
      return result.affectedRows > 0;
    });
  },

  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // Find user by username
  findByUsername: async (username) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },

  // Find user by id
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  // Get all pending users for admin approval
  getPendingUsers: async () => {
    const [rows] = await pool.execute(
      'SELECT u.id, u.username, u.email, u.role, u.created_at FROM users u WHERE u.is_approved = FALSE AND u.role != "admin"'
    );
    return rows;
  },

  // Approve a user
  approveUser: async (userId) => {
    const [result] = await pool.execute(
      'UPDATE users SET is_approved = TRUE WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Reject a user
  rejectUser: async (userId) => {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  },

  // Compare password for login
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  }
};

module.exports = User;
