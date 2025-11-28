import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Badge, Form, InputGroup, Row, Col, Modal, Alert, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faUserFriends, faPlus } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:5000/api';

// Utility function to format date and time safely
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) {
    return 'Not scheduled';
  }

  try {
    // dateStr is expected to be in YYYY-MM-DD format from the server
    const [year, month, day] = dateStr.split('-').map(Number);
    const formattedDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
    return `${formattedDate}, ${timeStr}`;
  } catch (error) {
    console.error('Error formatting date/time:', error);
    // Fallback for unexpected formats
    return `${dateStr} ${timeStr}`;
  }
};

const Trips = () => {
  const { userProfile } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
      fetchTrips();
    }
  }, [userProfile]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch trips from the real API
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/company/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const companyTrips = response.data || [];
      
      // Sort trips by date and time (most recent first)
      companyTrips.sort((a, b) => {
        // Combine date and time for accurate sorting
        const dateTimeA = new Date(`${a.trip_date}T${a.departure_time}`);
        const dateTimeB = new Date(`${b.trip_date}T${b.departure_time}`);
        return dateTimeA - dateTimeB;
      });
      
      setTrips(companyTrips);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to load trips. Please try again later.');
      setTrips([]);
      setLoading(false);
    }
  };

  const handleDeleteClick = (trip) => {
    setTripToDelete(trip);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/company/trips/${tripToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update state after successful deletion
      setTrips(trips.filter(trip => trip.id !== tripToDelete.id));
      setShowDeleteModal(false);
      setTripToDelete(null);
    } catch (err) {
      console.error('Error deleting trip:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete trip. Please try again.';
      setError(errorMessage);
      setDeleteLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.driver_name && trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (trip.visa_number && trip.visa_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterStatus === 'all') {
      return matchesSearch;
    }
    
    return matchesSearch && trip.status === filterStatus;
  });

  const canEdit = (trip) => {
    return ['pending', 'assigned', 'in_progress'].includes(trip.status);
  };

  const canDelete = (trip) => {
    return trip.status === 'pending';
  };

  const pendingTrips = trips.filter(trip => trip.status === 'pending');
  const activeTrips = trips.filter(trip => trip.status === 'assigned' || trip.status === 'in_progress');
  const completedTrips = trips.filter(trip => trip.status === 'completed');

  const renderTripTable = (tripsToRender) => (
    <Table responsive hover>
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Date & Time</th>
          <th>Passengers</th>
          <th>Vehicle Type</th>
          <th>Company Price</th>
          <th>Driver Price</th>
          <th>Driver</th>
          <th>Visa Number</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tripsToRender.length === 0 ? (
          <tr>
            <td colSpan="10" className="text-center">No trips found</td>
          </tr>
        ) : (
          tripsToRender.map(trip => (
            <tr key={trip.id}>
              <td>{trip.pickup_location}</td>
              <td>{trip.destination}</td>
              <td>{formatDateTime(trip.trip_date, trip.departure_time)}</td>
              <td>{trip.passenger_count}</td>
              <td>{trip.vehicle_type} Seater</td>
              <td>₪{trip.company_price}</td>
              <td>₪{trip.driver_price}</td>
              <td>{trip.driver_name || 'Not assigned'}</td>
              <td>{trip.visa_number || 'N/A'}</td>
              <td>
                <div className="d-flex">
                  {canEdit(trip) && (
                    <Button
                      as={Link}
                      to={`/company/trips/edit/${trip.id}`}
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      title="Edit Trip"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                  )}
                  
                  {canDelete(trip) && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="me-2"
                      onClick={() => handleDeleteClick(trip)}
                      title="Delete Trip"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  )}
                  
                  {['pending', 'assigned', 'in_progress'].includes(trip.status) && (
                    <Button
                      as={Link}
                      to={`/company/available-drivers/${trip.id}`}
                      variant="outline-success"
                      size="sm"
                      title="Find Drivers"
                    >
                      <FontAwesomeIcon icon={faUserFriends} />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Trip Management</h2>
        <Button as={Link} to="/company/trips/create" variant="primary">
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Trip
        </Button>
      </div>
      
      <div className="alert alert-light border-start border-4 border-info mb-4" dir="rtl">
        <strong>🚐 ניהול נסיעות</strong>
        <p className="mb-0 mt-1">כאן תוכל לנהל את כל הנסיעות שלך: לצפות, לערוך, למחוק, ולחפש נהגים זמינים. השתמש בלשוניות לסינון לפי סטטוס.</p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={12}>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by location or driver name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Tabs
              defaultActiveKey="all"
              id="trip-tabs"
              className="mb-3"
              onSelect={(k) => setFilterStatus(k)}
            >
              <Tab eventKey="all" title={`All (${trips.length})`}>
                {renderTripTable(filteredTrips)}
              </Tab>
              <Tab eventKey="pending" title={`Pending (${pendingTrips.length})`}>
                {renderTripTable(filterStatus === 'pending' ? pendingTrips : filteredTrips.filter(trip => trip.status === 'pending'))}
              </Tab>
              <Tab eventKey="assigned" title={`Active (${activeTrips.length})`}>
                {renderTripTable(
                  filterStatus === 'assigned' || filterStatus === 'in_progress' 
                    ? activeTrips 
                    : filteredTrips.filter(trip => trip.status === 'assigned' || trip.status === 'in_progress')
                )}
              </Tab>
              <Tab eventKey="completed" title={`Completed (${completedTrips.length})`}>
                {renderTripTable(filterStatus === 'completed' ? completedTrips : filteredTrips.filter(trip => trip.status === 'completed'))}
              </Tab>
            </Tabs>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tripToDelete && (
            <div>
              <p>Are you sure you want to delete this trip?</p>
              <p><strong>From:</strong> {tripToDelete.pickup_location}</p>
              <p><strong>To:</strong> {tripToDelete.destination}</p>
              <p><strong>Date & Time:</strong> {formatDateTime(tripToDelete.trip_date, tripToDelete.departure_time)}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Trip'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Trips;
