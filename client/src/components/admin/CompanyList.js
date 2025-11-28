import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Row, Col, Alert, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faInfoCircle, faStar } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://localhost:5000/api';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTripsModal, setShowTripsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [companyStats, setCompanyStats] = useState({ activeTrips: 0, completedTrips: 0, pendingRequests: 0 });
  const [companyTrips, setCompanyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsFilter, setTripsFilter] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/companies`);
      setCompanies(res.data);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyStats = async (companyId) => {
    try {
      setDetailsError(null);
      setDetailsLoading(true);
      const res = await axios.get(`${API_URL}/admin/companies/${companyId}/stats`);
      setCompanyStats(res.data);
    } catch (err) {
      console.error('Error fetching company stats:', err);
      setDetailsError('Failed to load company stats.');
      setCompanyStats({ activeTrips: 0, completedTrips: 0, pendingRequests: 0 });
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchCompanyTrips = async (companyId, filter = 'all') => {
    try {
      setTripsLoading(true);
      const params = filter !== 'all' ? `?filter=${filter}` : '';
      const res = await axios.get(`${API_URL}/admin/companies/${companyId}/trips${params}`);
      setCompanyTrips(res.data.trips);
    } catch (err) {
      console.error('Error fetching company trips:', err);
      setCompanyTrips([]);
    } finally {
      setTripsLoading(false);
    }
  };

  const openDetailsModal = (company) => {
    setSelectedCompany(company);
    setCompanyStats({ activeTrips: 0, completedTrips: 0, pendingRequests: 0 });
    setShowDetailsModal(true);
    fetchCompanyStats(company.id);
  };

  const openTripsModal = (company) => {
    setSelectedCompany(company);
    setCompanyTrips([]);
    setTripsFilter('all');
    setShowTripsModal(true);
    fetchCompanyTrips(company.id, 'all');
  };

  const handleFilterChange = (filter) => {
    setTripsFilter(filter);
    if (selectedCompany) {
      fetchCompanyTrips(selectedCompany.id, filter);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRatingStars = (rating) => {
    const ratingValue = typeof rating === 'number' ? rating : 
                        (rating ? parseFloat(rating) : 0);
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
      <h2 className="mb-4">Companies</h2>
      
      <div className="alert alert-light border-start border-4 border-primary mb-4" dir="rtl">
        <strong>🏢 רשימת חברות</strong>
        <p className="mb-0 mt-1">כאן תוכל לצפות בכל החברות הרשומות במערכת, לראות את פרטיהן, דירוגים, וסטטיסטיקות הנסיעות שלהן.</p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form>
            <InputGroup className="mb-3">
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by company name, contact person, or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form>

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              No companies found.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(company => (
                  <tr key={company.id}>
                    <td>{company.company_name}</td>
                    <td>{company.contact_person}</td>
                    <td>{company.email}</td>
                    <td>{company.phone}</td>
                    <td>
                      {renderRatingStars(company.rating)}
                    </td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        onClick={() => openDetailsModal(company)}
                        className="me-2"
                      >
                        Details
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => openTripsModal(company)}
                      >
                        View Trips
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
            Company Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompany && (
            <div>
              <Row>
                <Col md={6}>
                  <p><strong>Company Name:</strong> {selectedCompany.company_name}</p>
                  <p><strong>Contact Person:</strong> {selectedCompany.contact_person}</p>
                  <p><strong>Email:</strong> {selectedCompany.email}</p>
                  <p><strong>Phone:</strong> {selectedCompany.phone}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Address:</strong> {selectedCompany.address}</p>
                  <p>
                    <strong>Rating:</strong> {renderRatingStars(selectedCompany.rating)}
                    <small className="ms-2">({selectedCompany.rating_count} reviews)</small>
                  </p>
                  <p><strong>Username:</strong> {selectedCompany.username}</p>
                </Col>
              </Row>
              
              {selectedCompany.description && (
                <div className="mt-3">
                  <h6>Description</h6>
                  <p>{selectedCompany.description}</p>
                </div>
              )}

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
                      <h3 className="mb-0">{companyStats.activeTrips}</h3>
                      <p className="text-muted">Active Trips</p>
                    </Col>
                    <Col md={4} className="text-center">
                      <h3 className="mb-0">{companyStats.completedTrips}</h3>
                      <p className="text-muted">Completed Trips</p>
                    </Col>
                    <Col md={4} className="text-center">
                      <h3 className="mb-0">{companyStats.pendingRequests}</h3>
                      <p className="text-muted">Trip Requests</p>
                    </Col>
                  </Row>
                )}
              </div>
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

      {/* Trips Modal */}
      <Modal show={showTripsModal} onHide={() => setShowTripsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Company Trips - {selectedCompany?.company_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompany && (
            <div>
              {/* Filter Buttons */}
              <div className="mb-3">
                <Button
                  variant={tripsFilter === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="me-2"
                  onClick={() => handleFilterChange('all')}
                >
                  All Trips
                </Button>
                <Button
                  variant={tripsFilter === 'active' ? 'success' : 'outline-success'}
                  size="sm"
                  className="me-2"
                  onClick={() => handleFilterChange('active')}
                >
                  Active Trips
                </Button>
                <Button
                  variant={tripsFilter === 'completed' ? 'info' : 'outline-info'}
                  size="sm"
                  className="me-2"
                  onClick={() => handleFilterChange('completed')}
                >
                  Completed Trips
                </Button>
                <Button
                  variant={tripsFilter === 'requested' ? 'warning' : 'outline-warning'}
                  size="sm"
                  onClick={() => handleFilterChange('requested')}
                >
                  Requested Trips
                </Button>
              </div>

              {tripsLoading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading trips...</span>
                  </div>
                </div>
              ) : companyTrips.length === 0 ? (
                <Alert variant="info">No trips found for this filter.</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Route</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Passengers</th>
                      <th>Driver</th>
                      <th>Status</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyTrips.map(trip => (
                      <tr key={trip.id}>
                        <td>{trip.id}</td>
                        <td>{trip.pickup_location} → {trip.destination}</td>
                        <td>{new Date(trip.trip_date).toLocaleDateString()}</td>
                        <td>{trip.departure_time?.substring(0, 5) || 'N/A'}</td>
                        <td>{trip.passenger_count}</td>
                        <td>
                          {trip.driver_name ? (
                            <Badge bg="success">{trip.driver_name}</Badge>
                          ) : (
                            <Badge bg="secondary">No Driver</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={
                            trip.status === 'completed' ? 'success' :
                            trip.status === 'in_progress' ? 'primary' :
                            trip.status === 'assigned' ? 'info' : 'warning'
                          }>
                            {trip.status}
                          </Badge>
                        </td>
                        <td>₪{trip.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowTripsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CompanyList;
