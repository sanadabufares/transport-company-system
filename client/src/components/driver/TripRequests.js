import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Alert, Modal, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendarAlt, faClock, faUsers, faMoneyBillWave, faInfoCircle, faCheckCircle, faTimes, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:5000/api';

const TripRequests = () => {
  const { userProfile } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (userProfile) {
      fetchTripRequests();
      
      let interval;
      
      const startPolling = () => {
        interval = setInterval(() => {
          // Only poll if page is visible
          if (document.visibilityState === 'visible') {
            fetchTripRequests();
          }
        }, 18000); // Increased to 18 seconds
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Refresh immediately when tab becomes visible
          fetchTripRequests();
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

  const fetchTripRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get trip requests from the API
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/driver/trip-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const tripRequests = response.data || [];
      
      // Enhanced debug logging
      console.log("Trip requests received (total):", tripRequests.length);
      console.log("Trip requests by type:", 
        tripRequests.reduce((acc, req) => {
          acc[req.request_type] = (acc[req.request_type] || 0) + 1;
          return acc;
        }, {})
      );
      console.log("Trip requests by status:", 
        tripRequests.reduce((acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          return acc;
        }, {})
      );
      
      // Log each request with all details
      tripRequests.forEach(req => {
        console.log(`Request ID: ${req.id}, Status: ${req.status}, Type: ${req.request_type}`, req);
      });
      
      // Filter out any requests that might be invalid or rejected
      const validRequests = tripRequests.filter(req => {
        if (!req || !req.id || !req.request_type) {
          console.error('Invalid request data detected:', req);
          return false;
        }
        // Filter out rejected requests
        if (req.status === 'rejected') {
          return false;
        }
        return true;
      });
      
      // Sort requests by status (pending first) and date (newest first)
      validRequests.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1; // Pending first
        }
        return new Date(b.created_at) - new Date(a.created_at); // Newest first
      });
      
      setRequests(validRequests);
      setLoading(false);
      
      // If no requests, log a warning
      if (validRequests.length === 0) {
        console.warn('No valid trip requests received from the API');
      }
    } catch (error) {
      console.error('Error fetching trip requests:', error);
      setError('Failed to load trip requests. Please try again later.');
      setRequests([]);
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) {
      console.error('No request selected for acceptance');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      
      // Make the API call to accept the request
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/driver/trip-requests/${selectedRequest.id}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state by removing the accepted request from the list
      setRequests(requests.filter(req => req.id !== selectedRequest.id));
      
      setActionSuccess('Trip request accepted successfully!');
      
      // Dispatch event to update trip request count in header
      window.dispatchEvent(new Event('trip-request-updated'));
      
      // Close modal after a delay
      setTimeout(() => {
        setShowRequestModal(false);
        setSelectedRequest(null);
        
        // Refresh data to ensure we have the latest state
        fetchTripRequests();
      }, 2000);
      
    } catch (error) {
      console.error('Error accepting trip request:', error);
      setActionError('Failed to accept trip request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) {
      console.error('No request selected');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      
      const token = localStorage.getItem('token');
      
      if (selectedRequest.request_type === 'driver_to_company') {
        // Cancel (delete) driver's own request to company
        await axios.post(`${API_URL}/driver/trip-requests/cancel`, 
          { requestId: selectedRequest.id },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setActionSuccess('Trip request canceled successfully!');
      } else {
        // Reject company-to-driver request
        await axios.put(`${API_URL}/driver/trip-requests/${selectedRequest.id}/reject`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setActionSuccess('Trip request rejected successfully!');
      }
      
      // Update local state by removing the request from the list
      setRequests(requests.filter(req => req.id !== selectedRequest.id));
      
      // Dispatch event to update trip request count in header
      window.dispatchEvent(new Event('trip-request-updated'));
      
      // Close modal after a delay
      setTimeout(() => {
        setShowRequestModal(false);
        setSelectedRequest(null);
        
        // Refresh data to ensure we have the latest state
        fetchTripRequests();
      }, 2000);
      
    } catch (error) {
      console.error('Error processing trip request:', error);
      const actionText = selectedRequest?.request_type === 'driver_to_company' ? 'cancel' : 'reject';
      setActionError(`Failed to ${actionText} trip request. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    try {
      return new Date(`${date}T${time}`).toLocaleString();
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (request) => {
    // Debug log the exact request object
    console.log(`Status badge for request ${request.id}:`, {
      status: request.status, 
      type: request.request_type,
      full: request
    });
    
    // If this is a request from driver to company, show different status text
    if (request.request_type === 'driver_to_company') {
      switch (request.status) {
        case 'pending':
          return <Badge bg="info">Sent to Company</Badge>;
        case 'accepted':
          return <Badge bg="success">Company Accepted</Badge>;
        case 'rejected':
          return <Badge bg="danger">Company Rejected</Badge>;
        default:
          return <Badge bg="secondary">{request.status || 'Unknown'}</Badge>;
      }
    } else {
      // Regular company to driver request
      switch (request.status) {
        case 'pending':
          return <Badge bg="warning">Action Required</Badge>;
        case 'accepted':
          return <Badge bg="success">Accepted</Badge>;
        case 'rejected':
          return <Badge bg="danger">Rejected</Badge>;
        default:
          return <Badge bg="secondary">{request.status || 'Unknown'}</Badge>;
      }
    }
  };

  
  return (
    <div>
      <h2 className="mb-4">Trip Requests</h2>
      
      <div className="alert alert-light border-start border-4 border-warning mb-4" dir="rtl">
        <strong>📋 בקשות נסיעה</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות הצעות נסיעה שחברות שלחו לך. אשר או דחה הצעות לפי הזמינות שלך.</p>
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
          <p className="mt-3">Loading trip requests...</p>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            {requests.length === 0 ? (
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                You have no pending trip requests at the moment.
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
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter(request => request && request.id).map(request => (
                    <tr key={request.id}>
                      <td>{request.company_name || 'N/A'}</td>
                      <td>{request.visa_number || 'N/A'}</td>
                      <td>{request.pickup_location || 'N/A'}</td>
                      <td>{request.destination || 'N/A'}</td>
                      <td>{request.trip_date && request.departure_time ? formatDateTime(request.trip_date, request.departure_time) : 'N/A'}</td>
                      <td>₪{request.driver_price || request.company_price || 0}</td>
                      <td>{getStatusBadge(request)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          {request.status === 'pending' && request.request_type === 'company_to_driver' ? (
                            // Company-to-driver requests: driver can Accept/Reject
                            <>
                              <Button 
                                variant="success" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (request && request.id) {
                                    setSelectedRequest(request);
                                    handleAcceptRequest();
                                  }
                                }}
                              >
                                Accept
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (request && request.id) {
                                    setSelectedRequest(request);
                                    handleRejectRequest();
                                  }
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          ) : request.status === 'pending' && request.request_type === 'driver_to_company' ? (
                            // Driver-to-company requests: driver can only Cancel (their own request)
                            <Button 
                              variant="warning" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (request && request.id) {
                                  setSelectedRequest(request);
                                  handleRejectRequest();
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Button 
                              variant="info" 
                              size="sm" 
                              onClick={() => handleViewRequest(request)}
                            >
                              Details
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Trip Request Details Modal */}
      <Modal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Trip Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
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
                  <h5 className="mb-1">Request #{selectedRequest.id}</h5>
                  <div>{getStatusBadge(selectedRequest)}</div>
                </div>
                <div className="text-end">
                  <div className="mb-1">
                    <strong>Requested:</strong> {new Date(selectedRequest.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mb-4 pb-3 border-bottom">
                <h6>
                  <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                  Company Information
                </h6>
                <Row>
                  <Col md={6}>
                    <p><strong>Name:</strong> {selectedRequest.company_name}</p>
                    <p><strong>Contact:</strong> {selectedRequest.contact_person || 'Not provided'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Phone:</strong> {selectedRequest.phone || 'Not provided'}</p>
                    <p><strong>Rating:</strong> {selectedRequest.rating || '0.0'} / 5</p>
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
                        <strong>{selectedRequest.pickup_location || 'N/A'}</strong>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-muted mb-1">Date & Time</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                        <strong>{selectedRequest.trip_date && selectedRequest.departure_time ? formatDateTime(selectedRequest.trip_date, selectedRequest.departure_time) : 'N/A'}</strong>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-muted mb-1">Passengers</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faUsers} className="text-success me-2" />
                        <strong>{selectedRequest.passenger_count || 0}</strong>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <div className="mb-3">
                      <div className="text-muted mb-1">Destination</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-success me-2" />
                        <strong>{selectedRequest.destination || 'N/A'}</strong>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-muted mb-1">Price</div>
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary me-2" />
                        <strong>₪{selectedRequest.price || 0}</strong>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {selectedRequest.special_instructions && (
                <div className="alert alert-info mb-4">
                  <strong>Special Instructions:</strong>
                  <div>{selectedRequest.special_instructions}</div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
            Close
          </Button>
          
          {selectedRequest && selectedRequest.status === 'pending' && !actionSuccess && (
            selectedRequest.request_type === 'company_to_driver' ? (
              // Company-to-driver requests: driver can Accept/Reject
              <>
                <Button
                  variant="danger"
                  onClick={handleRejectRequest}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  variant="success"
                  onClick={handleAcceptRequest}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    'Accept Request'
                  )}
                </Button>
              </>
            ) : selectedRequest.request_type === 'driver_to_company' ? (
              // Driver-to-company requests: driver can only Cancel their own request
              <Button
                variant="warning"
                onClick={handleRejectRequest}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Cancel'}
              </Button>
            ) : null
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TripRequests;
