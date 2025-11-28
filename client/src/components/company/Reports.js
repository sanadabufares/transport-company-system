import React, { useState, useEffect, useContext } from 'react';
import Papa from 'papaparse';
import { Card, Button, Alert, Row, Col, Form, Table, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartLine, faDownload, faTimes, faInfoCircle, 
  faMoneyBillWave, faRoute, faUsers, faMapMarkerAlt, faCarSide, faUser, faStar, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Reports = () => {
  const { userProfile } = useContext(AuthContext);
  const [overallStats, setOverallStats] = useState({ totalTrips: 0, totalRevenue: 0 });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Report filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    visaNumber: '',
    driverEmail: ''
  });

  useEffect(() => {
    const fetchOverallStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/company/dashboard-stats`);
        setOverallStats({
          totalTrips: res.data.totalTrips || 0,
          totalRevenue: res.data.totalRevenue || 0,
        });
      } catch (err) {
        console.error('Failed to fetch overall stats', err);
      }
    };
    fetchOverallStats();
  }, []);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tripsEndpoint = `${API_URL}/company/reports/trips`;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.visaNumber) params.append('visaNumber', filters.visaNumber);
      if (filters.driverEmail) params.append('driverEmail', filters.driverEmail);
      
      // Fetch only the filtered trips data
      const tripsRes = await axios.get(`${tripsEndpoint}?${params}`);
      
      // Process trips data - extract trips array from response object
      setTrips(tripsRes.data.trips || []);
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load report data. Please try again.';
      setError(errorMessage);
      setTrips([]);
    } finally {
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
      alert('No data to export. Please run a search first.');
      return;
    }

    const dataToExport = trips.map(trip => ({
      'Date': new Date(trip.trip_date).toLocaleDateString(),
      'Driver': trip.driverName || 'N/A',
      'From': trip.pickup_location,
      'To': trip.destination,
      'Passengers': trip.passenger_count,
      'Company Price': trip.company_price,
      'Driver Price': trip.driver_price,
      'Profit': trip.company_price - trip.driver_price,
      'Status': trip.status,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'trip_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Company Reports</h2>
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
        <strong>📈 דוחות חברה</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות סטטיסטיקות מפורטות על הנסיעות שלך: סה"כ נסיעות, הכנסות, ודוחות חודשיים. ניתן לייצא את הדוחות לקובץ.</p>
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
                <Form.Label>Start Date</Form.Label>
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
                <Form.Label>End Date</Form.Label>
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
                  placeholder="Enter visa number"
                  value={filters.visaNumber}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3" controlId="driverEmail">
                <Form.Label>Driver Email</Form.Label>
                <Form.Control
                  type="email"
                  name="driverEmail"
                  placeholder="Enter driver's email"
                  value={filters.driverEmail}
                  onChange={handleFilterChange}
                />
              </Form.Group>
            </Col>
            <Col md={12} className="d-flex justify-content-end">
                <Button variant="primary" onClick={fetchReportData} disabled={loading}>
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
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
            <Col md={4}>
              <Card className="h-100 shadow-sm bg-primary text-white">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faRoute} size="3x" className="mb-3" />
                  <h5>Total Trips</h5>
                  <h2>{overallStats.totalTrips}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm bg-success text-white">
                <Card.Body className="text-center">
                  <FontAwesomeIcon icon={faMoneyBillWave} size="3x" className="mb-3" />
                  <h5>Total Revenue</h5>
                  <h2>₪{overallStats.totalRevenue}</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Trip Details</Card.Title>
              
              {trips.length === 0 ? (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  No trips found for the selected criteria. Please start a search.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Driver</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Passengers</th>
                      <th>Company Price</th>
                      <th>Driver Price</th>
                      <th>Profit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(trip => (
                      <tr key={trip.id}>
                        <td>{new Date(trip.trip_date).toLocaleDateString()}</td>
                        <td>{trip.driverName || 'N/A'}</td>
                        <td>{trip.pickup_location}</td>
                        <td>{trip.destination}</td>
                        <td>{trip.passenger_count}</td>
                        <td>₪{trip.company_price}</td>
                        <td>₪{trip.driver_price}</td>
                        <td>₪{trip.company_price - trip.driver_price}</td>
                        <td>
                          <span className={`badge bg-${trip.status === 'completed' ? 'success' : trip.status === 'in_progress' ? 'primary' : 'warning'}`}>
                            {trip.status}
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
