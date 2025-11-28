import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoute, faBell, faCheckCircle, faExclamationCircle, faClock, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext.jsx';

const API_URL = 'http://localhost:5000/api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Parse the date string and format as DD.MM.YYYY, HH:MM:SS
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
};

const Dashboard = () => {
  const { userProfile } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeTrips: 0,
    completedTrips: 0,
    tripRequests: 0,
    totalEarnings: 0,
    unreadNotifications: 0,
    availableTrips: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState({
    isAvailable: false,
    location: '',
    availableFrom: '',
    availableTo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
      
      // Initial fetch of trip requests count
      fetchTripRequestsCount();
      
      // Set up polling for trip requests count
      const interval = setInterval(() => {
        fetchTripRequestsCount();
      }, 3000); // Poll every 3 seconds for more responsiveness
      
      console.log('[Dashboard] Started polling for trip requests count');
      
      return () => {
        console.log('[Dashboard] Stopped polling for trip requests count');
        clearInterval(interval);
      };
    }
  }, [userProfile]);

  // Fetch only trip requests count for frequent updates
  const fetchTripRequestsCount = async () => {
    try {
      // Get trip requests count
      const tripRequestsResponse = await axios.get(`${API_URL}/driver/trip-requests/count`);
      const count = tripRequestsResponse.data.count || 0;
      
      console.log(`[Dashboard] Fetched trip requests count: ${count}`);
      
      // Update only the trip requests count in the stats
      setStats(prevStats => {
        // Only update if the count has changed to avoid unnecessary re-renders
        if (prevStats.tripRequests !== count) {
          console.log(`[Dashboard] Updating trip requests count from ${prevStats.tripRequests} to ${count}`);
          return {
            ...prevStats,
            tripRequests: count
          };
        }
        return prevStats;
      });
      
    } catch (error) {
      console.error('Error fetching trip requests count:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get the driver's ID from the current user
      // Make parallel API calls for efficiency
      const [statsResponse, tripsResponse, availabilityResponse, notificationsResponse] = await Promise.all([
        axios.get(`${API_URL}/driver/stats`),
        axios.get(`${API_URL}/driver/trips/recent`),
        axios.get(`${API_URL}/driver/availability/current`),
        axios.get(`${API_URL}/driver/notifications/unread-count`)
      ]);
      
      // Set statistics from real data
      setStats({
        activeTrips: statsResponse.data.activeTrips || 0,
        completedTrips: statsResponse.data.completedTrips || 0,
        tripRequests: statsResponse.data.tripRequests || 0,
        totalEarnings: statsResponse.data.totalEarnings || 0,
        unreadNotifications: notificationsResponse.data.count || 0,
        availableTrips: statsResponse.data.availableTrips || 0
      });
      
      // Set recent trips from real data
      setRecentTrips(tripsResponse.data || []);
      
      // Set availability status from real data
      const availData = availabilityResponse.data || {};
      setAvailabilityStatus({
        isAvailable: availData.isAvailable || false,
        location: availData.location || availData.current_location || '',
        availableFrom: availData.availableFrom || availData.available_from || '',
        availableTo: availData.availableTo || availData.available_to || ''
      });
      
      // Debug output to console
      console.log('Availability data received:', availData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // If API calls fail, show error but don't crash the dashboard
      // You can set default values here if needed
      setStats({
        activeTrips: 0,
        completedTrips: 0,
        tripRequests: 0,
        totalEarnings: 0,
        unreadNotifications: 0,
        availableTrips: 0
      });
      
      setRecentTrips([]);

      setAvailabilityStatus({
        isAvailable: false,
        location: 'Error fetching data',
        availableFrom: '',
        availableTo: ''
      });
      
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'assigned':
        return <Badge bg="info">Assigned</Badge>;
      case 'in_progress':
        return <Badge bg="primary">In Progress</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const DashboardCard = ({ title, value, icon, color, link, linkText }) => (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Row>
          <Col xs={8}>
            <h4 className="mb-0">{value}</h4>
            <p className="text-muted">{title}</p>
          </Col>
          <Col xs={4} className="text-end">
            <FontAwesomeIcon icon={icon} size="3x" className={`text-${color}`} />
          </Col>
        </Row>
        {link && (
          <div className="mt-3">
            <Button as={Link} to={link} variant={color} size="sm">
              {linkText}
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div>
      <div className="mb-4">
        <h2>Driver Dashboard</h2>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Availability Status Card */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h5>
                    <FontAwesomeIcon 
                      icon={faClock} 
                      className={`me-2 ${availabilityStatus.isAvailable ? 'text-success' : 'text-danger'}`} 
                    />
                    Current Availability
                  </h5>
                  <div>
                    <p className="mb-1">
                      <strong>Location:</strong> {availabilityStatus.location || 'Not specified'}
                    </p>
                    <p className="mb-0">
                      <strong>Available:</strong> {availabilityStatus.availableFrom && availabilityStatus.availableTo ? 
                        `${formatDate(availabilityStatus.availableFrom)} - ${formatDate(availabilityStatus.availableTo)}` : 
                        'Not specified'}
                    </p>
                  </div>
                </Col>
                <Col md={4} className="text-end d-flex align-items-center justify-content-end">
                  <Button as={Link} to="/driver/availability" variant="outline-primary">
                    Update Availability
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row className="mb-4">
            <Col md={4}>
              <DashboardCard 
                title="Trip Requests"
                value={
                  <span>
                    {stats.tripRequests}{' '}
                    {stats.tripRequests > 0 && (
                      <Badge bg="danger" pill>New</Badge>
                    )}
                  </span>
                }
                icon={faCheckCircle}
                color="warning"
                link="/driver/trip-requests"
                linkText="Review"
              />
            </Col>
            <Col md={4}>
              <DashboardCard 
                title="Available Trips"
                value={stats.availableTrips}
                icon={faMapMarkerAlt}
                color="success"
                link="/driver/available-trips"
                linkText="View"
              />
            </Col>
            <Col md={4}>
              <DashboardCard 
                title="Notifications"
                value={
                  <span>
                    {stats.unreadNotifications}{' '}
                    {stats.unreadNotifications > 0 && (
                      <Badge bg="danger" pill>New</Badge>
                    )}
                  </span>
                }
                icon={faBell}
                color="info"
                link="/driver/notifications"
                linkText="Check"
              />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between">
                    <span>Recent Trips</span>
                    <Button as={Link} to="/driver/trips" variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </Card.Title>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrips.slice(0, 4).map(trip => (
                          <tr key={trip.id}>
                            <td>{trip.company_name}</td>
                            <td>{trip.pickup_location}</td>
                            <td>{trip.destination}</td>
                            <td>{getStatusBadge(trip.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>Your Summary</Card.Title>
                  <div className="my-4">
                    <Row className="mb-4">
                      <Col md={6} className="text-center">
                        <h3 className="text-primary mb-0">₪{stats.totalEarnings.toLocaleString()}</h3>
                        <p className="text-muted">Total Earnings</p>
                      </Col>
                      <Col md={6} className="text-center">
                        <h3 className="text-success mb-0">{stats.completedTrips}</h3>
                        <p className="text-muted">Completed Trips</p>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12} className="text-center">
                        <h3 className="text-warning mb-0">{stats.averageRating ? parseFloat(stats.averageRating).toFixed(1) : '0.0'}</h3>
                        <p className="text-muted">Average Rating</p>
                      </Col>
                    </Row>
                  </div>
                  <div className="d-grid">
                    <Button as={Link} to="/driver/reports" variant="outline-secondary">
                      Generate Reports
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Quick Tips</Card.Title>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <FontAwesomeIcon icon={faExclamationCircle} className="text-warning me-2" />
                      Keep your availability status up to date to receive trip requests
                    </li>
                    <li className="list-group-item">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-2" />
                      Check available trips frequently to find new opportunities
                    </li>
                    <li className="list-group-item">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                      Respond quickly to trip requests to increase your booking rate
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
