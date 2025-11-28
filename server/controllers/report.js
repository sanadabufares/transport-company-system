const Trip = require('../models/trip');
const Company = require('../models/company');
const Driver = require('../models/driver');

// Get company trips by date range
exports.getCompanyTripsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Please provide start_date and end_date' });
    }
    
    const trips = await Trip.getByDateRange(userId, 'company', start_date, end_date);
    
    res.json({
      reportTitle: `Trips Report (${start_date} to ${end_date})`,
      trips,
      totalTrips: trips.length,
      totalRevenue: trips.reduce((sum, trip) => sum + parseFloat(trip.price), 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get company trips by driver
exports.getCompanyTripsByDriver = async (req, res) => {
  try {
    const userId = req.user.id;
    const { driver_id } = req.query;
    
    if (!driver_id) {
      return res.status(400).json({ message: 'Please provide driver_id' });
    }
    
    const company = await Company.findByUserId(userId);
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }
    
    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const [rows] = await db.execute(
      `SELECT t.*, 
       CONCAT(d.first_name, ' ', d.last_name) AS driver_name 
       FROM trips t 
       JOIN drivers d ON t.driver_id = d.id 
       WHERE t.company_id = ? 
       AND t.driver_id = ? 
       ORDER BY t.trip_date DESC`,
      [company.id, driver_id]
    );
    
    const driverName = `${driver.first_name} ${driver.last_name}`;
    
    res.json({
      reportTitle: `Trips Report for Driver: ${driverName}`,
      driverInfo: {
        name: driverName,
        phone: driver.phone,
        vehicle: `${driver.vehicle_type} seats, plate: ${driver.vehicle_plate}`,
        rating: driver.rating
      },
      trips: rows,
      totalTrips: rows.length,
      totalRevenue: rows.reduce((sum, trip) => sum + parseFloat(trip.price), 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get driver trips by date range
exports.getDriverTripsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Please provide start_date and end_date' });
    }
    
    const trips = await Trip.getByDateRange(userId, 'driver', start_date, end_date);
    
    res.json({
      reportTitle: `Trips Report (${start_date} to ${end_date})`,
      trips,
      totalTrips: trips.length,
      totalEarnings: trips.reduce((sum, trip) => sum + parseFloat(trip.price), 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get driver trips by company
exports.getDriverTripsByCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company_id } = req.query;
    
    if (!company_id) {
      return res.status(400).json({ message: 'Please provide company_id' });
    }
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    const [rows] = await db.execute(
      `SELECT t.*, c.company_name
       FROM trips t 
       JOIN companies c ON t.company_id = c.id 
       WHERE t.driver_id = ? 
       AND t.company_id = ? 
       ORDER BY t.trip_date DESC`,
      [driver.id, company_id]
    );
    
    res.json({
      reportTitle: `Trips Report for Company: ${company.company_name}`,
      companyInfo: {
        name: company.company_name,
        contact: company.contact_person,
        phone: company.phone,
        rating: company.rating
      },
      trips: rows,
      totalTrips: rows.length,
      totalEarnings: rows.reduce((sum, trip) => sum + parseFloat(trip.price), 0)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get trips by visa number
exports.getTripsByVisaNumber = async (req, res) => {
  try {
    const { visa_number } = req.query;
    
    if (!visa_number) {
      return res.status(400).json({ message: 'Please provide visa_number' });
    }
    
    const trips = await Trip.getByVisaNumber(visa_number);
    
    if (trips.length === 0) {
      return res.status(404).json({ message: 'No trips found with this visa number' });
    }
    
    // Check authorization based on role
    if (req.user.role === 'company') {
      const company = await Company.findByUserId(req.user.id);
      if (!company || trips[0].company_id !== company.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findByUserId(req.user.id);
      if (!driver || trips[0].driver_id !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    
    res.json({
      reportTitle: `Trip Report for Visa Number: ${visa_number}`,
      trips,
      totalTrips: trips.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
