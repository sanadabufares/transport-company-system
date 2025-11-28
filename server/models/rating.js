const { pool } = require('../config/db');

const Rating = {
  // Create a new rating
  create: async (rating) => {
    const [result] = await pool.execute(
      'INSERT INTO ratings (trip_id, rater_id, rater_type, rated_id, rated_type, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [rating.trip_id, rating.rater_id, rating.rater_type, rating.rated_id, rating.rated_type, rating.rating, rating.comment]
    );
    return result.insertId;
  },

  // Find rating by ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM ratings WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Find rating by trip, rater and rated
  findByTripRaterAndRated: async (tripId, raterId, raterType, ratedId, ratedType) => {
    const [rows] = await pool.execute(
      'SELECT * FROM ratings WHERE trip_id = ? AND rater_id = ? AND rater_type = ? AND rated_id = ? AND rated_type = ?',
      [tripId, raterId, raterType, ratedId, ratedType]
    );
    return rows[0];
  },

  // Get ratings for a driver
  getDriverRatings: async (driverId) => {
    const [rows] = await pool.execute(
      `SELECT r.*, t.pickup_location, t.destination, t.trip_date, c.company_name  
       FROM ratings r
       JOIN trips t ON r.trip_id = t.id
       JOIN companies c ON r.rated_id = c.id
       WHERE r.rater_id = ? AND r.rater_type = 'driver'`,
      [driverId]
    );
    return rows;
  },

  // Get ratings for a company
  getCompanyRatings: async (companyId) => {
    const [rows] = await pool.execute(
      `SELECT r.*, t.pickup_location, t.destination, t.trip_date, 
       CONCAT(d.first_name, ' ', d.last_name) as driver_name
       FROM ratings r
       JOIN trips t ON r.trip_id = t.id
       JOIN drivers d ON r.rater_id = d.id
       WHERE r.rated_id = ? AND r.rated_type = 'company'`,
      [companyId]
    );
    return rows;
  },

  // Calculate average rating for a company
  getCompanyAverageRating: async (companyId) => {
    const [rows] = await pool.execute(
      `SELECT AVG(rating) as average_rating 
       FROM ratings 
       WHERE rated_id = ? AND rated_type = 'company'`,
      [companyId]
    );
    return rows[0]?.average_rating || 0;
  },

  // Calculate average rating for a driver
  getDriverAverageRating: async (driverId) => {
    const [rows] = await pool.execute(
      `SELECT AVG(rating) as average_rating 
       FROM ratings 
       WHERE rated_id = ? AND rated_type = 'driver'`,
      [driverId]
    );
    return rows[0]?.average_rating || 0;
  }
};

module.exports = Rating;
