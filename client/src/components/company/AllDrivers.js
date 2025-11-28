import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Alert, Modal, Row, Col, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const AllDrivers = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchTripDetails();
      fetchAllDrivers();
    }
  }, [userProfile, tripId]);

  const fetchTripDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/company/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
    } catch (err) {
      console.error('Error fetching trip details:', err);
      setError('Failed to load trip details. Please try again.');
    }
  };

  const fetchAllDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/company/trips/${tripId}/all-drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(res.data);
    } catch (err) {
      console.error('Error fetching all drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDriver = (driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);
  };

  const handleSendRequest = async (driverId) => {
    try {
      setRequestLoading(true);
      
      // Send actual trip request to backend
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/company/trip-requests`, {
        trip_id: tripId,
        driver_id: driverId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(true);
      
      // Close modal if open
      setShowDriverModal(false);
      
      // Reset after a delay
      setTimeout(() => {
        setSuccess(false);
        setSelectedDriver(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error sending trip request:', err);
      setError('Failed to send trip request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

  const renderRatingStars = (rating) => {
    const numericRating = parseFloat(rating);
    if (isNaN(numericRating)) {
      return <small className="text-muted">No rating</small>;
    }

    const stars = [];
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <FontAwesomeIcon 
            key={i} 
            icon={faStar} 
            className="text-warning" 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-warning">
            <FontAwesomeIcon icon={faStar} style={{ opacity: '0.5' }} />
          </span>
        );
      } else {
        stars.push(
          <FontAwesomeIcon 
            key={i} 
            icon={faStar} 
            className="text-secondary" 
            style={{ opacity: '0.3' }}
          />
        );
      }
    }

    return (
      <span>
        {stars} <small>({numericRating.toFixed(1)})</small>
      </span>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Drivers (Debug)</h2>
        <Button as={Link} to="/company/trips" variant="secondary">
          Back to Trips
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Trip request sent successfully!</Alert>}
      
      {trip && (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Card.Title>Trip Details</Card.Title>
            <Row>
              <Col md={6}>
                <p><strong>From:</strong> {trip.pickup_location}</p>
                <p><strong>To:</strong> {trip.destination}</p>
                <p><strong>Date & Time:</strong> {new Date(trip.trip_date).toLocaleDateString()} {trip.departure_time}</p>
              </Col>
              <Col md={6}>
                <p><strong>Passengers:</strong> {trip.passenger_count}</p>
                <p><strong>Vehicle Type:</strong> {trip.vehicle_type}</p>
                <p><strong>Price:</strong> ₪{trip.company_price}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>All Drivers (Debug)</Card.Title>
          
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : drivers.length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              No drivers found.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Rating</th>
                  <th>Current Location</th>
                  <th>Vehicle</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id}>
                    <td>{driver.first_name} {driver.last_name}</td>
                    <td>{renderRatingStars(driver.rating)}</td>
                    <td>{driver.current_location}</td>
                    <td>
                      <div>{driver.vehicle_type} Seater</div>
                      <div className="text-muted">Plate: {driver.vehicle_plate}</div>
                    </td>
                    <td>
                      <div>From: {new Date(driver.available_from).toLocaleString()}</div>
                      <div>To: {new Date(driver.available_to).toLocaleString()}</div>
                    </td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleViewDriver(driver)}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleSendRequest(driver.id)}
                        disabled={requestLoading}
                      >
                        {requestLoading ? 'Sending...' : 'Request'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Driver Details Modal */}
      <Modal show={showDriverModal} onHide={() => setShowDriverModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Driver Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDriver && (
            <div>
              <div className="text-center mb-3">
                <div className="bg-light p-3 rounded-circle d-inline-block mb-2">
                  <FontAwesomeIcon icon={faUser} size="3x" />
                </div>
                <h4>{selectedDriver.first_name} {selectedDriver.last_name}</h4>
                <div>{renderRatingStars(selectedDriver.rating)}</div>
                <small className="text-muted">{selectedDriver.rating_count} ratings</small>
              </div>
              
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                  <p><strong>Current Location:</strong> {selectedDriver.current_location}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Vehicle Type:</strong> {selectedDriver.vehicle_type} Seater</p>
                  <p><strong>Vehicle Plate:</strong> {selectedDriver.vehicle_plate}</p>
                </Col>
              </Row>
              
              <Alert variant="info" className="mb-0">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Sending a request to this driver will notify them about your trip. They can then accept or reject the request.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDriverModal(false)}>
            Close
          </Button>
          {selectedDriver && (
            <Button 
              variant="success" 
              onClick={() => handleSendRequest(selectedDriver.id)}
              disabled={requestLoading}
            >
              {requestLoading ? 'Sending...' : 'Send Request'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AllDrivers;
