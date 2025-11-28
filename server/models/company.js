const { pool, withTransaction } = require('../config/db');
const User = require('./user'); // Import User model

const Company = {
  // Create a new company
  create: async (company) => {
    return withTransaction(async (connection) => {
      const [result] = await connection.execute(
        'INSERT INTO companies (user_id, company_name, contact_person, phone, address, description) VALUES (?, ?, ?, ?, ?, ?)',
        [company.user_id, company.company_name, company.contact_person, company.phone, company.address, company.description]
      );
      return result.insertId;
    });
  },

  // Find company by user_id with better error handling
  findByUserId: async (userId) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM companies WHERE user_id = ?', [userId]);
      if (!rows || rows.length === 0) {
        console.log(`No company found for userId: ${userId}`);
        return null;
      }
      console.log(`Company found for userId: ${userId}`, rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Database error in findByUserId:', error);
      throw new Error('Failed to fetch company profile due to a database error.');
    }
  },

  // Find company by id
  findById: async (id) => {
    return withTransaction(async (connection) => {
      const [rows] = await connection.execute('SELECT * FROM companies WHERE id = ?', [id]);
      return rows[0];
    });
  },

  // Get all companies
  getAll: async () => {
    return withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        'SELECT c.*, u.username, u.email FROM companies c JOIN users u ON c.user_id = u.id WHERE u.is_approved = TRUE'
      );
      return rows;
    });
  },


  // Update company rating
  updateRating: async (id, rating) => {
    return withTransaction(async (connection) => {
      // Get current rating and count
      const [currentCompanyRows] = await connection.execute('SELECT rating, rating_count FROM companies WHERE id = ?', [id]);
      if (!currentCompanyRows || currentCompanyRows.length === 0) {
        throw new Error('Company not found');
      }

      const currentCompany = currentCompanyRows[0];
      const newRatingCount = currentCompany.rating_count + 1;
      const newRating = ((currentCompany.rating * currentCompany.rating_count) + rating) / newRatingCount;

      const [result] = await connection.execute(
        'UPDATE companies SET rating = ?, rating_count = ? WHERE id = ?',
        [newRating, newRatingCount, id]
      );
      return result.affectedRows > 0;
    });
  },

  // Update company profile
  updateProfile: async (userId, updates = {}) => {
    return withTransaction(async (connection) => {
      // Get current company data
      const [rows] = await connection.execute('SELECT * FROM companies WHERE user_id = ?', [userId]);
      if (!rows || rows.length === 0) {
        throw new Error('Company not found');
      }

      // Only update fields that are provided and not null/undefined
      const fieldsToUpdate = [];
      const values = [];
      const updateFields = ['company_name', 'contact_person', 'phone', 'address'];

      updateFields.forEach(field => {
        if (updates[field] !== undefined && updates[field] !== null) {
          fieldsToUpdate.push(`${field} = ?`);
          values.push(updates[field]);

          // Validate field lengths
          if (field === 'company_name' && updates[field].length > 100) {
            throw new Error('Company name too long (max 100 characters)');
          }
          if (field === 'contact_person' && updates[field].length > 100) {
            throw new Error('Contact person name too long (max 100 characters)');
          }
          if (field === 'phone' && updates[field].length > 20) {
            throw new Error('Phone number too long (max 20 characters)');
          }
          if (field === 'address' && updates[field].length > 255) {
            throw new Error('Address too long (max 255 characters)');
          }
        }
      });

      if (fieldsToUpdate.length === 0) {
        return true; // No fields to update
      }

      values.push(userId);

      const query = `UPDATE companies SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`;
      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error('Failed to update company profile');
      }

      return true;
    }).catch(error => {
      console.error('Database error in updateProfile:', error);
      if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        throw new Error('Database connection was lost. Please try again.');
      }
      throw error;
    });
  },
};

module.exports = Company;
