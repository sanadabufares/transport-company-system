import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Row, Col, Alert, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faInfoCircle, faStar, faCar } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://localhost:5000/api';

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [driverStats, setDriverStats] = useState({ activeTrips: 0, completedTrips: 0, pendingRequests: 0 });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/drivers`);
      setDrivers(res.data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverStats = async (driverId) => {
    try {
      setDetailsError(null);
      setDetailsLoading(true);
      const res = await axios.get(`${API_URL}/admin/drivers/${driverId}/stats`);
      setDriverStats(res.data);
    } catch (err) {
      console.error('Error fetching driver stats:', err);
      setDetailsError('Failed to load driver stats.');
      setDriverStats({ activeTrips: 0, completedTrips: 0, pendingRequests: 0 });
    } finally {
      setDetailsLoading(false);
    }
  };

  const openDetailsModal = (driver) => {
    console.log('Opening details for driver:', driver);
    setSelectedDriver(driver);
    setDriverStats({ activeTrips: 0, completedTrips: 0, pendingRequests: 0 });
    setShowDetailsModal(true);
    fetchDriverStats(driver.id);
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVehicleType = filterVehicleType ? driver.vehicle_type === filterVehicleType : true;
    
    return matchesSearch && matchesVehicleType;
  });

  const renderRatingStars = (rating) => {
    const ratingValue = typeof rating === 'number' ? rating : (rating ? parseFloat(rating) : 0);
    const safeRating = isNaN(ratingValue) ? 0 : ratingValue;
    
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    
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
        {stars} <small>({safeRating.toFixed(1)})</small>
      </span>
    );
  };

  return (
    <div>
      <h2 className="mb-4">Drivers</h2>
      
      <div className="alert alert-light border-start border-4 border-success mb-4" dir="rtl">
        <strong>🚗 רשימת נהגים</strong>
        <p className="mb-0 mt-1">כאן תוכל לצפות בכל הנהגים הרשומים במערכת, לראות את פרטיהם, סוג הרכב, רישיון נהיגה, ודירוגים.</p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, email, or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterVehicleType}
                onChange={(e) => setFilterVehicleType(e.target.value)}
                aria-label="Filter by vehicle type"
              >
                <option value="">All Vehicle Types</option>
                <option value="8">8 Seater</option>
                <option value="14">14 Seater</option>
                <option value="19">19 Seater</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              No drivers found matching your criteria.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Vehicle Type</th>
                  <th>License Expiry</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map(driver => (
                  <tr key={driver.id}>
                    <td>{driver.first_name} {driver.last_name}</td>
                    <td>{driver.email}</td>
                    <td>{driver.phone}</td>
                    <td>
                      <Badge bg="secondary">
                        {driver.vehicle_type} Seater
                      </Badge>
                    </td>
                    <td>
                      {new Date(driver.license_expiry).toLocaleDateString()}
                      {new Date(driver.license_expiry) < new Date() && (
                        <Badge bg="danger" className="ms-2">Expired</Badge>
                      )}
                    </td>
                    <td>
                      {renderRatingStars(driver.rating)}
                    </td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        onClick={() => openDetailsModal(driver)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Driver Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDriver && (
            <div>
              <Row>
                <Col md={6}>
                  <p><strong>Name:</strong> {selectedDriver.first_name} {selectedDriver.last_name}</p>
                  <p><strong>Email:</strong> {selectedDriver.email}</p>
                  <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                  <p><strong>Username:</strong> {selectedDriver.username}</p>
                </Col>
                <Col md={6}>
                  <p><strong>License Number:</strong> {selectedDriver.license_number}</p>
                  <p>
                    <strong>License Expiry:</strong> {new Date(selectedDriver.license_expiry).toLocaleDateString()}
                    {new Date(selectedDriver.license_expiry) < new Date() && (
                      <Badge bg="danger" className="ms-2">Expired</Badge>
                    )}
                  </p>
                  <p>
                    <strong>Rating:</strong> {renderRatingStars(selectedDriver.rating)}
                    <small className="ms-2">({selectedDriver.rating_count} reviews)</small>
                  </p>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6>Vehicle Information</h6>
                <Row>
                  <Col md={6}>
                    <p>
                      <FontAwesomeIcon icon={faCar} className="me-2" />
                      <strong>Vehicle Type:</strong> {selectedDriver.vehicle_type} Seater
                    </p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Vehicle Plate:</strong> {selectedDriver.vehicle_plate}</p>
                  </Col>
                </Row>
              </div>

              <div className="mt-4">
                <h6>Activity Summary</h6>
                {detailsError && (
                  <Alert variant="danger" className="mt-2">{detailsError}</Alert>
                )}
                {detailsLoading ? (
                  <div className="text-center my-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Row>
                    <Col md={4} className="text-center">
                      <h3 className="mb-0">{driverStats.activeTrips}</h3>
                      <p className="text-muted">Active Trips</p>
                    </Col>
                    <Col md={4} className="text-center">
                      <h3 className="mb-0">{driverStats.completedTrips}</h3>
                      <p className="text-muted">Completed Trips</p>
                    </Col>
                    <Col md={4} className="text-center">
                      <h3 className="mb-0">{driverStats.pendingRequests}</h3>
                      <p className="text-muted">Trip Requests</p>
                    </Col>
                  </Row>
                )}
              </div>

              {selectedDriver.current_location && (
                <div className="mt-3">
                  <h6>Current Availability</h6>
                  <p><strong>Current Location:</strong> {selectedDriver.current_location}</p>
                  {selectedDriver.available_from && selectedDriver.available_to && (
                    <p>
                      <strong>Available:</strong> {new Date(selectedDriver.available_from).toLocaleString()} - {new Date(selectedDriver.available_to).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDetailsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DriverList;
