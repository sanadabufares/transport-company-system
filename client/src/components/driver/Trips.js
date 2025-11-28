import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Tabs, Tab, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faArrowRight, faCalendarAlt, faClock, faUsers, faMoneyBillWave, faInfoCircle, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Trips = () => {
  const { userProfile } = useContext(AuthContext);
  const [trips, setTrips] = useState({
    upcoming: [],
    inProgress: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeKey, setActiveKey] = useState('upcoming');
  
  // Modal state
  const [showTripModal, setShowTripModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [tripNote, setTripNote] = useState('');
  const [companyRating, setCompanyRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchTrips();
    }
  }, [userProfile]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all trips for the driver from API
      const response = await axios.get(`${API_URL}/driver/trips`);
      const allTrips = response.data || [];
      
      // Filter trips by status
      const upcomingTrips = allTrips.filter(trip => 
        trip.status === 'assigned'
      );
      
      const inProgressTrips = allTrips.filter(trip => 
        trip.status === 'in_progress'
      );
      
      const completedTrips = allTrips.filter(trip => 
        trip.status === 'completed'
      );
      
      // Set the trips in state
      setTrips({
        upcoming: upcomingTrips,
        inProgress: inProgressTrips,
        completed: completedTrips
      });
      
      // Auto-select first tab with trips
      if (inProgressTrips.length > 0) {
        setActiveKey('inProgress');
      } else if (upcomingTrips.length > 0) {
        setActiveKey('upcoming');
      } else if (completedTrips.length > 0) {
        setActiveKey('completed');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to load trips. Please try again later.');
      setTrips({
        upcoming: [],
        inProgress: [],
        completed: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setShowTripModal(true);
    setActionType(null);
    setActionError(null);
    setActionSuccess(null);
    setTripNote('');
  };

  const handleStartTrip = async (trip) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/driver/trips/${trip.id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      const updatedTrip = { 
        ...trip, 
        status: 'in_progress',
        start_time: new Date().toISOString()
      };
      
      setTrips(prev => ({
        upcoming: prev.upcoming.filter(t => t.id !== trip.id),
        inProgress: [...prev.inProgress, updatedTrip],
        completed: prev.completed
      }));
      
    } catch (err) {
      console.error('Error starting trip:', err);
      setError('Failed to start the trip. Please try again.');
    }
  };

  const handleCompleteTrip = (trip) => {
    setSelectedTrip(trip);
    setShowTripModal(true);
    setActionType('complete');
    setActionError(null);
    setActionSuccess(null);
    setCompanyRating(5);
    setRatingComment('');
  };

  const confirmCompleteTrip = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      console.log(`[CLIENT DEBUG] About to complete trip ${selectedTrip.id}`);
      console.log(`[CLIENT DEBUG] Company rating:`, companyRating, 'Type:', typeof companyRating);
      console.log(`[CLIENT DEBUG] Rating comment:`, ratingComment);
      
      const requestData = {
        rating: companyRating,
        comment: ratingComment
      };
      console.log(`[CLIENT DEBUG] Full request data:`, requestData);
      
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/driver/trips/${selectedTrip.id}/complete`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`[CLIENT DEBUG] Server response:`, response.data);
      
      // Update local state
      const updatedTrip = { 
        ...selectedTrip, 
        status: 'completed', 
        end_time: new Date().toISOString(),
        company_rating: companyRating,
        rating_comment: ratingComment
      };
      
      setTrips(prev => ({
        upcoming: prev.upcoming,
        inProgress: prev.inProgress.filter(t => t.id !== selectedTrip.id),
        completed: [...prev.completed, updatedTrip]
      }));
      
      setActionSuccess('Trip completed and company rated successfully!');
      
      // Close modal after a delay
      setTimeout(() => {
        setShowTripModal(false);
        setSelectedTrip(null);
        setActionType(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error completing trip:', err);
      setActionError('Failed to complete the trip. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };


  const formatDateTime = (date, time) => {
    return new Date(`${date}T${time}`).toLocaleString();
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

  const renderTripTable = (tripsArray) => {
    if (tripsArray.length === 0) {
      return (
        <Alert variant="info">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          No trips found in this category.
        </Alert>
      );
    }

    return (
      <Table responsive hover>
        <thead>
          <tr>
            <th>Company</th>
            <th>Visa Number</th>
            <th>From</th>
            <th>To</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tripsArray.map(trip => (
            <tr key={trip.id}>
              <td>{trip.company_name}</td>
              <td>{trip.visa_number || 'N/A'}</td>
              <td>{trip.pickup_location}</td>
              <td>{trip.destination}</td>
              <td>{formatDateTime(trip.trip_date, trip.departure_time)}</td>
              <td>{getStatusBadge(trip.status)}</td>
              <td>
                <Button 
                  variant="info" 
                  size="sm" 
                  className="me-2"
                  onClick={() => handleViewTrip(trip)}
                >
                  Details
                </Button>
                
                {trip.status === 'assigned' && (
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleStartTrip(trip)}
                  >
                    Start Trip
                  </Button>
                )}
                
                {trip.status === 'in_progress' && (
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleCompleteTrip(trip)}
                  >
                    Complete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <div>
      <h2 className="mb-4">My Trips</h2>
      
      <div className="alert alert-light border-start border-4 border-primary mb-4" dir="rtl">
        <strong>🚗 הנסיעות שלי</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות את כל הנסיעות שאושרו לך, לעדכן סטטוס נסיעה, ולסמן נסיעות כהושלמו.</p>
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
          <p className="mt-3">Loading trips...</p>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <Tabs
              activeKey={activeKey}
              onSelect={(k) => setActiveKey(k)}
              className="mb-4"
            >
              <Tab 
                eventKey="upcoming" 
                title={
                  <span>
                    Upcoming 
                    {trips.upcoming.length > 0 && (
                      <Badge bg="primary" pill className="ms-2">
                        {trips.upcoming.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                {renderTripTable(trips.upcoming)}
              </Tab>
              <Tab 
                eventKey="inProgress" 
                title={
                  <span>
                    In Progress
                    {trips.inProgress.length > 0 && (
                      <Badge bg="info" pill className="ms-2">
                        {trips.inProgress.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                {renderTripTable(trips.inProgress)}
              </Tab>
              <Tab 
                eventKey="completed" 
                title="Completed"
              >
                {renderTripTable(trips.completed)}
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      )}

      {/* Trip Details Modal */}
      <Modal
        show={showTripModal}
        onHide={() => setShowTripModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'start' ? 'Start Trip' : 
             actionType === 'complete' ? 'Complete Trip' : 
             'Trip Details'}
          </Modal.Title>
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
              
              <div className="d-flex justify-content-between mb-4 pb-3 border-bottom">
                <div>
                  <h5 className="mb-1">Trip #{selectedTrip.id}</h5>
                  <div>{getStatusBadge(selectedTrip.status)}</div>
                </div>
                <div className="text-end">
                  <div className="mb-1">
                    <strong>Company:</strong> {selectedTrip.company_name}
                  </div>
                  <div>
                    <strong>Contact:</strong> {selectedTrip.contact_person}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedTrip.contact_phone}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
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
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="text-muted mb-1">Destination</div>
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-success me-2" />
                      <strong>{selectedTrip.destination}</strong>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">Estimated Arrival</div>
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faClock} className="text-primary me-2" />
                      <strong>{formatDateTime(selectedTrip.trip_date, selectedTrip.arrival_time)}</strong>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-muted mb-1">Price</div>
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary me-2" />
                      <strong>₪{selectedTrip.price}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTrip.special_instructions && (
                <div className="alert alert-info mb-4">
                  <strong>Special Instructions:</strong>
                  <div>{selectedTrip.special_instructions}</div>
                </div>
              )}
              
              {selectedTrip.driver_notes && (
                <div className="mb-4">
                  <h6>Your Notes:</h6>
                  <div className="p-3 bg-light rounded">
                    {selectedTrip.driver_notes}
                  </div>
                </div>
              )}

              {actionType === 'complete' && (
                <div className="mb-4">
                  <h6>Rate this Company</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Rating</Form.Label>
                    <Form.Select 
                      value={companyRating} 
                      onChange={(e) => setCompanyRating(parseInt(e.target.value))}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ Excellent (5 stars)</option>
                      <option value={4}>⭐⭐⭐⭐ Good (4 stars)</option>
                      <option value={3}>⭐⭐⭐ Average (3 stars)</option>
                      <option value={2}>⭐⭐ Poor (2 stars)</option>
                      <option value={1}>⭐ Very Poor (1 star)</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Comment (optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Share your experience with this company..."
                    />
                  </Form.Group>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTripModal(false)}>
            Close
          </Button>
          
          {actionType === 'complete' && (
            <Button
              variant="success"
              onClick={confirmCompleteTrip}
              disabled={actionLoading || actionSuccess}
            >
              {actionLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Completing...
                </>
              ) : (
                'Complete Trip & Rate Company'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Trips;
