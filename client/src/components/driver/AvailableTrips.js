import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Alert, Modal, Form, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendarAlt, faClock, faUsers, faMoneyBillWave, 
  faInfoCircle, faCheckCircle, faTimes, faBuilding, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const AvailableTrips = () => {
  const { userProfile } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showTripModal, setShowTripModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchAvailableTrips();
      fetchPendingRequests();
      
      let interval;
      
      const startPolling = () => {
        interval = setInterval(() => {
          // Only poll if page is visible
          if (document.visibilityState === 'visible') {
            fetchAvailableTrips();
            fetchPendingRequests();
          }
        }, 20000); // Increased to 20 seconds
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Refresh immediately when tab becomes visible
          fetchAvailableTrips();
          fetchPendingRequests();
          startPolling();
        } else {
          // Stop polling when tab is hidden
          clearInterval(interval);
        }
      };
      
      // Start initial polling
      startPolling();
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterDate, trips]);

  const fetchPendingRequests = async () => {
    try {
      // Get driver's pending trip requests
      const response = await axios.get(`${API_URL}/driver/trip-requests`);
      const tripRequests = response.data || [];
      
      // Filter only pending requests
      const pending = tripRequests.filter(req => req.status === 'pending');
      setPendingRequests(pending);
      
      console.log('Pending requests:', pending);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    }
  };

  const fetchAvailableTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get driver profile to check availability
      const profileResponse = await axios.get(`${API_URL}/driver/profile`);
      const driverProfile = profileResponse.data;
      
      // Check if driver has set availability
      if (!driverProfile.current_location) {
        setError('You need to set your availability status before viewing available trips.');
        setTrips([]);
        setLoading(false);
        return;
      }
      
      // Make real API call to get available trips
      const response = await axios.get(`${API_URL}/driver/available-trips`);
      const availableTrips = response.data || [];
      console.log('Available trips from API:', availableTrips);
      
      // Sort trips by date (most recent first)
      availableTrips.sort((a, b) => {
        const dateA = new Date(`${a.trip_date}T${a.departure_time}`);
        const dateB = new Date(`${b.trip_date}T${b.departure_time}`);
        return dateA - dateB; // ascending order (upcoming trips first)
      });
      
      // Get all pending requests to filter out trips that the driver has already requested
      await fetchPendingRequests();
      
      // Process trips - mark those that were previously rejected
      const processedTrips = availableTrips.map(trip => ({
        ...trip,
        previously_rejected: trip.last_request_status === 'rejected'
      }));
      
      setTrips(processedTrips);
      setFilteredTrips(processedTrips);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching available trips:', error);
      setError('Failed to load available trips. Please try again later.');
      setTrips([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...trips];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(trip => 
        trip.pickup_location.toLowerCase().includes(search) ||
        trip.destination.toLowerCase().includes(search) ||
        trip.company_name.toLowerCase().includes(search)
      );
    }
    
    // Apply date filter
    if (filterDate) {
      result = result.filter(trip => trip.trip_date === filterDate);
    }
    
    setFilteredTrips(result);
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setShowTripModal(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleRequestTrip = async () => {
    try {
      // Check if driver already has a pending request
      if (pendingRequests.length > 0) {
        setActionError('You already have a pending trip request. Please wait for a response before requesting another trip.');
        return;
      }

      setActionLoading(true);
      setActionError(null);
      
      // Make the actual API call to request the trip
      await axios.post(`${API_URL}/driver/trip-requests`, {
        trip_id: selectedTrip.id
      });
      
      // Add this request to pending requests
      setPendingRequests([...pendingRequests, {
        trip_id: selectedTrip.id,
        status: 'pending'
      }]);
      
      // Update local state - remove the trip from the list
      setTrips(trips.filter(t => t.id !== selectedTrip.id));
      setFilteredTrips(filteredTrips.filter(t => t.id !== selectedTrip.id));
      
      setActionSuccess('Trip request sent successfully! You will be notified when the company responds.');
      
      // Close modal after a delay
      setTimeout(() => {
        setShowTripModal(false);
        setSelectedTrip(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error requesting trip:', err);
      setActionError('Failed to send trip request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    return new Date(`${date}T${time}`).toLocaleString();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
  };

  return (
    <div>
      <h2 className="mb-4">Available Trips</h2>
      
      <div className="alert alert-light border-start border-4 border-info mb-4" dir="rtl">
        <strong>🚐 נסיעות זמינות</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות את כל הנסיעות הזמינות שמתאימות לסוג הרכב שלך. לחץ על "בקש נסיעה" כדי לשלוח בקשה לחברה.</p>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading available trips...</p>
        </div>
      ) : (
        <>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title>
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                Filter Trips
              </Card.Title>
              <Row>
                <Col md={6} className="mb-3 mb-md-0">
                  <InputGroup>
                    <InputGroup.Text>
                      <FontAwesomeIcon icon={faSearch} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search by location or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Control
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Available Trips</Card.Title>
              
              {filteredTrips.length === 0 ? (
                <Alert variant="info">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  No available trips found matching your criteria.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Visa Number</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Date & Time</th>
                      <th>Passengers</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map(trip => (
                      <tr key={trip.id}>
                        <td>{trip.company_name}</td>
                        <td>{trip.visa_number || 'N/A'}</td>
                        <td>{trip.pickup_location}</td>
                        <td>{trip.destination}</td>
                        <td>{formatDateTime(trip.trip_date, trip.departure_time)}</td>
                        <td>{trip.passenger_count}</td>
                        <td>₪{trip.price}</td>
                        <td>
                          {trip.previously_rejected && (
                            <Badge bg="warning" text="dark">
                              Previously Rejected
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm" 
                            onClick={() => handleViewTrip(trip)}
                          >
                            View Details
                          </Button>
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

      {/* Trip Details Modal */}
      <Modal
        show={showTripModal}
        onHide={() => setShowTripModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Trip Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTrip && (
            <>
              {actionSuccess && (
                <Alert variant="success" className="mb-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  {actionSuccess}
                </Alert>
              )}
              
              {actionError && (
                <Alert variant="danger" className="mb-4">
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  {actionError}
                </Alert>
              )}
              
              <div className="mb-4 pb-3 border-bottom">
                <h6>
                  <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                  Company Information
                </h6>
                <Row>
                  <Col md={6}>
                    <p><strong>Name:</strong> {selectedTrip.company_name}</p>
                    <p><strong>Contact:</strong> {selectedTrip.contact_person || 'Not provided'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Phone:</strong> {selectedTrip.phone || 'Not provided'}</p>
                    <p><strong>Rating:</strong> {selectedTrip.rating || '0.0'} / 5</p>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <h6>Trip Details</h6>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1">Pickup Location</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-2" />
                        <strong>{selectedTrip.pickup_location}</strong>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-muted mb-1">Date & Time</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                        <strong>{formatDateTime(selectedTrip.trip_date, selectedTrip.departure_time)}</strong>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-muted mb-1">Passengers</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faUsers} className="text-success me-2" />
                        <strong>{selectedTrip.passenger_count}</strong>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1">Destination</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-success me-2" />
                        <strong>{selectedTrip.destination}</strong>
                      </div>
                    </div>
                    
                    
                    <div className="mb-3">
                      <div className="text-muted mb-1">Price</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary me-2" />
                        <strong>₪{selectedTrip.price}</strong>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {selectedTrip.special_instructions && (
                <div className="alert alert-info mb-4">
                  <strong>Special Instructions:</strong>
                  <div>{selectedTrip.special_instructions}</div>
                </div>
              )}
              
              {pendingRequests.length > 0 ? (
                <Alert variant="warning">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  You already have a pending trip request. You can only have one pending request at a time.
                </Alert>
              ) : selectedTrip.previously_rejected ? (
                <Alert variant="warning">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  <strong>Note:</strong> Your previous request for this trip was rejected by the company. 
                  You may request it again if you're still interested.
                </Alert>
              ) : (
                <Alert variant="warning">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  By requesting this trip, you're expressing interest in providing transportation services. 
                  The company will review your request and may contact you for further details.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTripModal(false)}>
            Close
          </Button>
          
          {selectedTrip && !actionSuccess && (
            <Button
              variant="success"
              onClick={handleRequestTrip}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending Request...
                </>
              ) : (
                'Request Trip'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AvailableTrips;
