import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const API_URL = 'http://127.0.0.1:5000/api';

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/pending-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError('Failed to load pending approval requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setActionInProgress(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/approve-user/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      setShowDetailsModal(false);
      
      // Update the badge count directly
      try {
        const pendingCountResponse = await axios.get(`${API_URL}/admin/pending-users/count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Dispatch custom event with count data
        const customEvent = new CustomEvent('pending-count-updated', {
          detail: { count: pendingCountResponse.data.count }
        });
        window.dispatchEvent(customEvent);
        console.log('Dispatched pending-count-updated with count:', pendingCountResponse.data.count);
      } catch (error) {
        console.error('Error updating pending count:', error);
      }
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (userId) => {
    try {
      setActionInProgress(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/reject-user/${userId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      setShowDetailsModal(false);
      
      // Update the badge count directly
      try {
        const pendingCountResponse = await axios.get(`${API_URL}/admin/pending-users/count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Dispatch custom event with count data
        const customEvent = new CustomEvent('pending-count-updated', {
          detail: { count: pendingCountResponse.data.count }
        });
        window.dispatchEvent(customEvent);
        console.log('Dispatched pending-count-updated with count:', pendingCountResponse.data.count);
      } catch (error) {
        console.error('Error updating pending count:', error);
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Failed to reject user. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const renderUserDetails = () => {
    if (!selectedUser) return null;

    const { role, details } = selectedUser;

    if (role === 'company') {
      return (
        <div>
          <h5 className="mt-3">Company Details</h5>
          <Row>
            <Col md={6}>
              <p><strong>Company Name:</strong> {details.company_name}</p>
              <p><strong>Contact Person:</strong> {details.contact_person}</p>
              <p><strong>Phone:</strong> {details.phone}</p>
            </Col>
            <Col md={6}>
              <p><strong>Address:</strong> {details.address}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Registration Date:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
            </Col>
          </Row>
          {details.description && (
            <>
              <h6>Description</h6>
              <p>{details.description}</p>
            </>
          )}
        </div>
      );
    } else if (role === 'driver') {
      return (
        <div>
          <h5 className="mt-3">Driver Details</h5>
          <Row>
            <Col md={6}>
              <p><strong>Name:</strong> {details.first_name} {details.last_name}</p>
              <p><strong>Phone:</strong> {details.phone}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
            </Col>
            <Col md={6}>
              <p><strong>License Number:</strong> {details.license_number}</p>
              <p><strong>License Expiry:</strong> {new Date(details.license_expiry).toLocaleDateString()}</p>
              <p><strong>Registration Date:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={6}>
              <p><strong>Vehicle Type:</strong> {details.vehicle_type} Seater</p>
            </Col>
            <Col md={6}>
              <p><strong>Vehicle Plate:</strong> {details.vehicle_plate}</p>
            </Col>
          </Row>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <h2 className="mb-4">Pending Approvals</h2>
      
      <div className="alert alert-light border-start border-4 border-warning mb-4" dir="rtl">
        <strong>⏳ אישורים ממתינים</strong>
        <p className="mb-0 mt-1">כאן תוכל לאשר או לדחות בקשות הרשמה של חברות ונהגים חדשים. לחץ על "פרטים" כדי לראות מידע מלא לפני קבלת החלטה.</p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : pendingUsers.length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              No pending approvals at this time.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.role === 'company' ? 'primary' : 'success'}>
                        {user.role === 'company' ? 'Company' : 'Driver'}
                      </Badge>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openDetailsModal(user)}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleApprove(user.id)}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleReject(user.id)}
                      >
                        <FontAwesomeIcon icon={faTimes} />
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
            {selectedUser?.role === 'company' ? 'Company' : 'Driver'} Registration Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderUserDetails()}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDetailsModal(false)}
          >
            Close
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleReject(selectedUser?.id)}
            disabled={actionInProgress}
          >
            {actionInProgress ? 'Processing...' : 'Reject'}
          </Button>
          <Button 
            variant="success" 
            onClick={() => handleApprove(selectedUser?.id)}
            disabled={actionInProgress}
          >
            {actionInProgress ? 'Processing...' : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PendingApprovals;
