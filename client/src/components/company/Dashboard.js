import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoute, faCar, faBell, faUsers, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    return 'Not scheduled';
  }
  try {
    const dateObj = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleString();
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return `${dateStr} ${timeStr}`;
  }
};

const Dashboard = () => {
  const { currentUser, userProfile, refreshDashboard } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeTrips: 0,
    pendingTrips: 0,
    completedTrips: 0,
    tripRequests: 0,
    totalRevenue: 0,
    unreadNotifications: 0,
    availableDrivers: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile, refreshDashboard]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResponse, tripsResponse, driversResponse] = await Promise.all([
        axios.get(`${API_URL}/company/dashboard-stats`),
        axios.get(`${API_URL}/company/trips?status=active`),
        axios.get(`${API_URL}/company/drivers`) // Fetch the list of approved drivers
      ]);

      // Update the availableDrivers count from the new endpoint
      const updatedStats = { ...statsResponse.data, availableDrivers: driversResponse.data.length };
      setStats(updatedStats);
      setRecentTrips(
        tripsResponse.data.map(trip => ({
          ...trip,
          driver_name: trip.driver_name || 'Unassigned'
        })).slice(0, 5)
      );

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Company Dashboard</h2>
        <Button as={Link} to="/company/trips/create" variant="primary">
          Create New Trip
        </Button>
      </div>
      
      <div className="alert alert-light border-start border-4 border-primary mb-4" dir="rtl">
        <strong>📊 לוח בקרה - חברה</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות סיכום של הנסיעות שלך, בקשות מנהגים, הכנסות, והתראות. לחץ על "צור נסיעה חדשה" כדי להוסיף נסיעה.</p>
      </div>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <DashboardCard 
                title="Active Trips"
                value={stats.activeTrips}
                icon={faRoute}
                color="primary"
                link="/company/trips?status=active"
                linkText="View"
              />
            </Col>
            <Col md={3}>
              <DashboardCard 
                title="Pending Trips"
                value={stats.pendingTrips}
                icon={faExclamationCircle}
                color="secondary"
                link="/company/trips?status=pending"
                linkText="View"
              />
            </Col>
            <Col md={3}>
              <DashboardCard 
                title="Driver Requests"
                value={
                  <span>
                    {stats.tripRequests}{' '}
                    {stats.tripRequests > 0 && (
                      <Badge bg="danger" pill>New</Badge>
                    )}
                  </span>
                }
                icon={faUsers}
                color="warning"
                link="/company/trip-requests"
                linkText="Review"
              />
            </Col>
            <Col md={3}>
              <DashboardCard 
                title="Completed Trips"
                value={stats.completedTrips}
                icon={faCheckCircle}
                color="success"
                link="/company/trips?status=completed"
                linkText="View"
              />
            </Col>
          </Row>

          <Row className="mb-4">
             <Col md={3}>
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
                link="/company/notifications"
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
                    <Button as={Link} to="/company/trips" variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </Card.Title>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>To</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrips.map(trip => (
                          <tr key={trip.id}>
                            <td>{trip.pickup_location}</td>
                            <td>{trip.destination}</td>
                            <td>{formatDateTime(trip.trip_date, trip.departure_time)}</td>
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
                  <Card.Title>Business Summary</Card.Title>
                  <div className="my-4">
                    <Row className="mb-4">
                      <Col md={6} className="text-center">
                        <h3 className="text-primary mb-0">₪{(stats.totalRevenue || 0).toLocaleString()}</h3>
                        <p className="text-muted">Total Revenue</p>
                      </Col>
                      <Col md={6} className="text-center">
                        <h3 className="text-success mb-0">{stats.completedTrips + stats.activeTrips + stats.pendingTrips}</h3>
                        <p className="text-muted">Total Trips</p>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6} className="text-center">
                        <h3 className="text-warning mb-0">{stats.averageRating ? parseFloat(stats.averageRating).toFixed(1) : '0.0'}</h3>
                        <p className="text-muted">Average Rating</p>
                      </Col>
                    </Row>
                  </div>
                  <div className="d-grid">
                    <Button as={Link} to="/company/reports" variant="outline-secondary">
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
                      Create trips in advance to find more available drivers
                    </li>
                    <li className="list-group-item">
                      <FontAwesomeIcon icon={faUsers} className="text-primary me-2" />
                      Check the available drivers section to find drivers for your trips
                    </li>
                    <li className="list-group-item">
                      <FontAwesomeIcon icon={faCar} className="text-success me-2" />
                      Rate your drivers to help improve the community
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
