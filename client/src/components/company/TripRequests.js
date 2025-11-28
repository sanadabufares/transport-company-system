import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Badge, Modal, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faUser, faStar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const TripRequests = () => {
  const { userProfile, triggerDashboardRefresh } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'driver', 'company'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchTripRequests();
    }
  }, [userProfile]);

  const fetchTripRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch trip requests from the API - use a more resilient approach
      let allTripRequests = [];
      let driverTripRequests = [];
      
      // Get all trip requests (which should include both types)
      try {
        const allRequestsResponse = await axios.get(`${API_URL}/company/trip-requests`);
        allTripRequests = allRequestsResponse.data || [];
        console.log('All trip requests:', allTripRequests);
      } catch (err) {
        console.error('Error fetching all trip requests:', err);
      }
      
      // Filter out driver-initiated requests based on request_type in the data
      const companyInitiatedRequests = allTripRequests.filter(req => 
        req.request_type === 'company_to_driver' || !req.request_type
      );
      
      const driverInitiatedRequests = allTripRequests.filter(req => 
        req.request_type === 'driver_to_company'
      );
      
      console.log('Driver-initiated requests found in all requests:', driverInitiatedRequests.length);
      
      // Process the requests
      const processedRequests = [
        ...companyInitiatedRequests.map(req => ({
          ...req,
          request_type: 'company_to_driver' // Default if not specified
        })),
        ...driverInitiatedRequests.map(req => ({
          ...req,
          request_type: 'driver_to_company'
        }))
      ];
      
      // Sort requests by status (pending first) and date (newest first)
      processedRequests.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1; // Pending first
        }
        return new Date(b.created_at) - new Date(a.created_at); // Newest first
      });
      
      setRequests(processedRequests);
      setLoading(false);
    } catch (error) {
      console.error('Error processing trip requests:', error);
      setError('Failed to load trip requests. Please try again later.');
      setRequests([]);
      setLoading(false);
    }
  };

  const handleViewDriver = (driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);
  };

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setActionLoading(true);
      
      if (actionType === 'cancel') {
        // Use cancel endpoint to delete the request
        const requestData = { requestId: selectedRequest.id };
        await axios.post(`${API_URL}/company/cancel-request`, requestData);
      } else {
        // Use respond endpoint for accept/reject
        const requestData = {
          requestId: selectedRequest.id,
          status: actionType === 'accept' ? 'accepted' : 'rejected'
        };
        await axios.post(`${API_URL}/company/respond-to-request`, requestData);
      }
      
      // Update local state
      setShowActionModal(false);
      
      // Refresh data to show updated status
      await fetchTripRequests();
      // Trigger a refresh of the main dashboard stats
      triggerDashboardRefresh();
    
    } catch (error) {
      console.error(`Error ${actionType === 'cancel' ? 'canceling' : actionType + 'ing'} trip request:`, error);
      setError(`Failed to ${actionType === 'cancel' ? 'cancel' : actionType} trip request. Please try again later.`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    // Handle null, undefined, or non-numeric ratings
    const numericRating = Number(rating) || 0;
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
        {stars} {numericRating > 0 && <small>({numericRating.toFixed(1)})</small>}
      </span>
    );
  };

  // Filter requests based on active tab
  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'driver':
        return requests.filter(req => req.request_type === 'driver_to_company');
      case 'company':
        return requests.filter(req => req.request_type === 'company_to_driver');
      default:
        return requests;
    }
  };

  // Get request type badge
  const getRequestTypeBadge = (type) => {
    switch (type) {
      case 'driver_to_company':
        return <Badge bg="info" className="ms-2">Driver Request</Badge>;
      case 'company_to_driver':
        return <Badge bg="primary" className="ms-2">Company Request</Badge>;
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="mb-4">Trip Requests</h2>
      
      <div className="alert alert-light border-start border-4 border-warning mb-4" dir="rtl">
        <strong>📋 בקשות נסיעה</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות בקשות מנהגים שרוצים לקחת את הנסיעות שלך. אשר או דחה בקשות לפי הצורך.</p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="mb-4">
        <Button
          variant={activeTab === 'all' ? 'primary' : 'outline-primary'}
          className="me-2"
          onClick={() => setActiveTab('all')}
        >
          All Requests
        </Button>
        <Button
          variant={activeTab === 'driver' ? 'info' : 'outline-info'}
          className="me-2"
          onClick={() => setActiveTab('driver')}
        >
          Driver Requests
        </Button>
        <Button
          variant={activeTab === 'company' ? 'secondary' : 'outline-secondary'}
          onClick={() => setActiveTab('company')}
        >
          Company Requests
        </Button>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : getFilteredRequests().length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              No pending trip requests at this time.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Trip Details</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Visa Number</th>
                  <th>Request Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredRequests().filter(request => request && request.id).map(request => (
                  <tr key={request.id}>
                    <td>
                      <div><strong>From:</strong> {request.pickup_location || 'N/A'}</div>
                      <div><strong>To:</strong> {request.destination || 'N/A'}</div>
                      <div><strong>Date:</strong> {request.trip_date && request.departure_time ? new Date(`${request.trip_date}T${request.departure_time}`).toLocaleString() : 'N/A'}</div>
                      <div><strong>Passengers:</strong> {request.passenger_count || 0}</div>
                      <div>{getRequestTypeBadge(request.request_type)}</div>
                    </td>
                    <td>
                      <div>{request.driver_name || 'N/A'}</div>
                      <div>{renderRatingStars(request.driver_rating)}</div>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0" 
                        onClick={() => handleViewDriver(request)}
                      >
                        View Details
                      </Button>
                    </td>
                    <td>
                      <div>{request.vehicle_type || 'N/A'} Seater</div>
                      <div>Plate: {request.vehicle_plate || 'N/A'}</div>
                    </td>
                    <td>{request.visa_number || 'N/A'}</td>
                    <td>
                      {request.created_at ? new Date(request.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      {request.request_type === 'driver_to_company' ? (
                        // Driver-to-company requests: company can Accept/Reject
                        <>
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="me-2 mb-2"
                            onClick={() => handleAction(request, 'accept')}
                          >
                            <FontAwesomeIcon icon={faCheck} className="me-1" /> Accept
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleAction(request, 'reject')}
                          >
                            <FontAwesomeIcon icon={faTimes} className="me-1" /> Reject
                          </Button>
                        </>
                      ) : (
                        // Company-to-driver requests: company can only Cancel
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => handleAction(request, 'cancel')}
                        >
                          <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancel
                        </Button>
                      )}
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
                <h4>{selectedDriver.driver_name}</h4>
                <div>{renderRatingStars(selectedDriver.driver_rating)}</div>
              </div>
              
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Phone:</strong> {selectedDriver.driver_phone || 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Vehicle:</strong> {selectedDriver.vehicle_type || 'N/A'} Seater</p>
                </Col>
              </Row>
              
              <p><strong>License Number:</strong> {selectedDriver.driver_license || 'N/A'}</p>
              
              <h5 className="mt-4 mb-3">Trip Information</h5>
              <p><strong>From:</strong> {selectedDriver.pickup_location || 'N/A'}</p>
              <p><strong>To:</strong> {selectedDriver.destination || 'N/A'}</p>
              <p><strong>Date & Time:</strong> {selectedDriver.trip_date && selectedDriver.departure_time ? new Date(`${selectedDriver.trip_date}T${selectedDriver.departure_time}`).toLocaleString() : 'N/A'}</p>
              <p><strong>Passengers:</strong> {selectedDriver.passenger_count || 0}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDriverModal(false)}>
            Close
          </Button>
          {selectedDriver && (
            selectedDriver.request_type === 'driver_to_company' ? (
              // Driver-to-company requests: company can Accept/Reject
              <>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    setShowDriverModal(false);
                    handleAction(selectedDriver, 'reject');
                  }}
                >
                  Reject
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => {
                    setShowDriverModal(false);
                    handleAction(selectedDriver, 'accept');
                  }}
                >
                  Accept
                </Button>
              </>
            ) : (
              // Company-to-driver requests: company can only Cancel
              <Button 
                variant="warning" 
                onClick={() => {
                  setShowDriverModal(false);
                  handleAction(selectedDriver, 'cancel');
                }}
              >
                Cancel
              </Button>
            )
          )}
        </Modal.Footer>
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'accept' ? 'Accept Trip Request' : 
             actionType === 'cancel' ? 'Cancel Trip Request' : 'Reject Trip Request'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <p>
                Are you sure you want to {actionType} the trip request {actionType === 'cancel' ? 'to' : 'from'} <strong>{selectedRequest.driver_name}</strong>?
              </p>
              
              <div className="bg-light p-3 rounded mb-3">
                <p className="mb-1"><strong>From:</strong> {selectedRequest.pickup_location || 'N/A'}</p>
                <p className="mb-1"><strong>To:</strong> {selectedRequest.destination || 'N/A'}</p>
                <p className="mb-1"><strong>Date & Time:</strong> {selectedRequest.trip_date && selectedRequest.departure_time ? new Date(`${selectedRequest.trip_date}T${selectedRequest.departure_time}`).toLocaleString() : 'N/A'}</p>
                <p className="mb-0"><strong>Vehicle:</strong> {selectedRequest.vehicle_type || 'N/A'} Seater (Plate: {selectedRequest.vehicle_plate || 'N/A'})</p>
              </div>
              
              {actionType === 'accept' ? (
                <Alert variant="warning">
                  By accepting this request, the driver will be assigned to this trip. This action cannot be undone.
                </Alert>
              ) : actionType === 'cancel' ? (
                <Alert variant="warning">
                  By canceling this request, your trip request to this driver will be withdrawn.
                </Alert>
              ) : (
                <Alert variant="danger">
                  By rejecting this request, the driver will be notified and will not be able to take this trip.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={actionType === 'accept' ? 'success' : actionType === 'cancel' ? 'warning' : 'danger'} 
            onClick={handleConfirmAction}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              actionType === 'accept' ? 'Accept' : actionType === 'cancel' ? 'Agree' : 'Reject'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TripRequests;
