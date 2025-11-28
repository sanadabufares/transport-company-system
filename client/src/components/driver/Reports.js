import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Alert, Row, Col, Form, Table } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartLine, faDownload, faTimes, faInfoCircle, faMoneyBillWave, faRoute, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Reports = () => {
  const { userProfile } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalEarnings: 0,
    completionRate: 0
  });
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Report filter state for trips table only
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    visaNumber: '',
    companyName: '',
    reportType: 'earnings'
  });
  
  // Fetch stats on component mount (all completed rides)
  useEffect(() => {
    if (userProfile) {
      fetchStatsData();
      fetchTripsData();
    }
  }, [userProfile]);
  
  // Fetch trips when filters change (excluding search)
  useEffect(() => {
    if (userProfile) {
      fetchTripsData();
    }
  }, [filters]);
  

  // Fetch stats for all completed rides (no filters)
  const fetchStatsData = async () => {
    try {
      const statsEndpoint = `${API_URL}/driver/reports/stats`;
      const statsRes = await axios.get(statsEndpoint);
      
      const statsData = statsRes.data || {};
      setStats({
        totalTrips: statsData.totalTrips || 0,
        totalEarnings: statsData.totalEarnings || 0,
        completionRate: statsData.completionRate || 0
      });
    } catch (error) {
      console.error('Error fetching stats data:', error);
      setError('Failed to load statistics. Please try again later.');
    }
  };

  // Fetch trips with filters applied
  const fetchTripsData = async () => {
    try {
      setLoading(true);
      const tripsEndpoint = `${API_URL}/driver/reports/trips`;
      
      // Build query parameters only for non-empty filters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.visaNumber) params.append('visaNumber', filters.visaNumber);
      if (filters.companyName) params.append('companyName', filters.companyName);
      if (filters.reportType) params.append('reportType', filters.reportType);
      
      const tripsRes = await axios.get(`${tripsEndpoint}?${params}`);
      const tripsData = tripsRes.data || [];
      setTrips(tripsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trips data:', error);
      setError('Failed to load trips data. Please try again later.');
      setTrips([]);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleExportReport = () => {
    if (trips.length === 0) {
      alert('No data to export. Please select filters to generate a report.');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Company', 'Visa Number', 'From', 'To', 'Earnings', 'Status'];
    const csvContent = [
      headers.join(','),
      ...trips.map(trip => [
        `"${new Date(trip.trip_date || trip.date).toLocaleDateString()}"`,
        `"${trip.company_name || trip.company || ''}"`,
        `"${trip.visa_number || 'N/A'}"`,
        `"${trip.pickup_location || ''}"`,
        `"${trip.destination || ''}"`,
        `"₪${trip.driver_price || trip.price || 0}"`,
        `"${trip.status === 'completed' ? 'Completed' : 'Pending'}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `driver-report-${today}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMonthlyData = () => {
    // If we don't have trips data yet, return empty array
    if (!trips || trips.length === 0) {
      return [];
    }
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based (0 = January)
    const currentYear = now.getFullYear();
    
    // Filter trips for current month only
    const currentMonthTrips = trips.filter(trip => {
      const dateField = trip.trip_date || trip.date;
      const date = new Date(dateField);
      
      // Skip if date is invalid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for trip:', trip);
        return false;
      }
      
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // Calculate current month summary
    if (currentMonthTrips.length === 0) {
      return [{
        month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        tripCount: 0,
        totalEarnings: 0
      }];
    }
    
    const totalEarnings = currentMonthTrips.reduce((sum, trip) => {
      return sum + parseFloat(trip.driver_price || trip.price || 0);
    }, 0);
    
    return [{
      month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      tripCount: currentMonthTrips.length,
      totalEarnings: totalEarnings
    }];
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Driver Reports</h2>
        <Button 
          variant="success" 
          onClick={handleExportReport}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faDownload} className="me-2" />
          Export Report
        </Button>
      </div>
      
      <div className="alert alert-light border-start border-4 border-secondary mb-4" dir="rtl">
        <strong>📈 דוחות נהג</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות סטטיסטיקות מפורטות על הנסיעות והרווחים שלך: סה"כ נסיעות, הכנסות, ואחוז השלמה. ניתן לייצא את הדוחות לקובץ.</p>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Card.Title>
            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
            Report Filters
          </Card.Title>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="startDate">
                <Form.Label>Start Date (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="endDate">
                <Form.Label>End Date (Optional)</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="visaNumber">
                <Form.Label>Visa Number</Form.Label>
                <Form.Control
                  type="text"
                  name="visaNumber"
                  value={filters.visaNumber}
                  onChange={handleFilterChange}
                  placeholder="Enter visa number"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="companyName">
                <Form.Label>Company Name</Form.Label>
                <Form.Control
                  type="text"
                  name="companyName"
                  value={filters.companyName}
                  onChange={handleFilterChange}
                  placeholder="Enter company name"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading report data...</p>
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100 shadow-sm bg-primary text-white">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faRoute} size="3x" className="mb-3" />
                  <h5>Total Trips</h5>
                  <h2>{stats.totalTrips}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm bg-success text-white">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faMoneyBillWave} size="3x" className="mb-3" />
                  <h5>Total Earnings</h5>
                  <h2>₪{stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm bg-warning text-white">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-3" />
                  <h5>Completion Rate</h5>
                  <h2>{stats.completionRate}%</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {filters.reportType === 'earnings' ? (
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Card.Title>Monthly Earnings Summary</Card.Title>
                
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Total Trips</th>
                      <th>Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMonthlyData().map((monthData, index) => (
                      <tr key={index}>
                        <td>{monthData.month}</td>
                        <td>{monthData.tripCount}</td>
                        <td>₪{monthData.totalEarnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : null}
          
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Trip Details</Card.Title>
              
              {trips.length === 0 ? (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  No trips found for the selected date range.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Company</th>
                      <th>Visa Number</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Earnings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(trip => (
                      <tr key={trip.id}>
                        <td>{new Date(trip.trip_date || trip.date).toLocaleDateString()}</td>
                        <td>{trip.company_name || trip.company}</td>
                        <td>{trip.visa_number || 'N/A'}</td>
                        <td>{trip.pickup_location}</td>
                        <td>{trip.destination}</td>
                        <td>₪{trip.driver_price || trip.price}</td>
                        <td>
                          <span className={`badge bg-${trip.status === 'completed' ? 'success' : 'warning'}`}>
                            {trip.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
