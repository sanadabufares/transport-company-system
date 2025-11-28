const axios = require('axios');
require('dotenv').config();

// Facebook Graph API base URL
const FB_API_URL = 'https://graph.facebook.com/v18.0'; // Using a recent version
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

// Validate Facebook configuration
const validateFacebookConfig = () => {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
    throw new Error('Missing Facebook configuration. Please set FB_PAGE_ID and FB_ACCESS_TOKEN in .env file');
  }
};

// Post simple text message to Facebook Page
exports.postMessage = async (req, res) => {
  try {
    validateFacebookConfig();
    
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const response = await axios.post(
      `${FB_API_URL}/${FB_PAGE_ID}/feed`,
      {
        message: message,
        access_token: FB_ACCESS_TOKEN
      }
    );
    
    return res.status(200).json({
      success: true,
      postId: response.data.id,
      message: 'Posted successfully to Facebook'
    });
  } catch (error) {
    console.error('Facebook post error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// Post with image to Facebook Page
exports.postWithImage = async (req, res) => {
  try {
    validateFacebookConfig();
    
    const { message, imageUrl } = req.body;
    
    if (!message || !imageUrl) {
      return res.status(400).json({ error: 'Message and image URL are required' });
    }
    
    const response = await axios.post(
      `${FB_API_URL}/${FB_PAGE_ID}/photos`,
      {
        message: message,
        url: imageUrl,
        access_token: FB_ACCESS_TOKEN
      }
    );
    
    return res.status(200).json({
      success: true,
      postId: response.data.id,
      message: 'Image posted successfully to Facebook'
    });
  } catch (error) {
    console.error('Facebook image post error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// Post trip information to Facebook
exports.postTrip = async (req, res) => {
  try {
    validateFacebookConfig();
    
    const { tripId } = req.body;
    
    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    // Get trip details from database
    // This is a placeholder - you'll need to implement the actual database query
    const tripDetails = await getTripDetails(tripId);
    
    const message = `New Trip Available!
🚍 From: ${tripDetails.origin}
🏙️ To: ${tripDetails.destination}
🗓️ Date: ${new Date(tripDetails.departureTime).toLocaleDateString()}
⏰ Time: ${new Date(tripDetails.departureTime).toLocaleTimeString()}
💰 Price: $${tripDetails.price}
📞 Book now at our website!`;
    
    const response = await axios.post(
      `${FB_API_URL}/${FB_PAGE_ID}/feed`,
      {
        message: message,
        access_token: FB_ACCESS_TOKEN
      }
    );
    
    return res.status(200).json({
      success: true,
      postId: response.data.id,
      message: 'Trip posted successfully to Facebook'
    });
  } catch (error) {
    console.error('Facebook trip post error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// Mock function to get trip details - replace with actual implementation
async function getTripDetails(tripId) {
  // This is a placeholder - connect to your database to get actual trip details
  const db = require('../models/db');
  
  try {
    const [rows] = await db.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    if (rows.length === 0) {
      throw new Error('Trip not found');
    }
    return rows[0];
  } catch (err) {
    console.error('Error fetching trip details:', err);
    throw new Error('Failed to fetch trip details');
  }
}
