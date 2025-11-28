import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext.jsx';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [tripRequests, setTripRequests] = useState(0);
  const navigate = useNavigate();

  // Create a function to fetch unread notifications count that can be called from elsewhere
  const fetchUnreadNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const role = currentUser.role;
      const endpoint = role === 'admin'
        ? `${API_URL}/admin/notifications/unread-count`
        : role === 'company'
          ? `${API_URL}/company/notifications/unread-count`
          : `${API_URL}/driver/notifications/unread-count`;
          
      console.log('Fetching unread notification count from:', endpoint);
      const res = await axios.get(endpoint);
      console.log('Unread notification count:', res.data.count);
      setUnreadNotifications(res.data.count);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  // Fetch pending requests count (for admin)
  const fetchPendingRequests = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    try {
      const res = await axios.get(`${API_URL}/admin/pending-users/count`);
      setPendingRequests(res.data.count);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  // Fetch trip requests count (for company and driver)
  const fetchTripRequests = async () => {
    if (!currentUser) return;
    
    try {
      const role = currentUser.role;
      let endpoint;
      
      if (role === 'company') {
        endpoint = `${API_URL}/company/trip-requests/count`;
      } else if (role === 'driver') {
        endpoint = `${API_URL}/driver/trip-requests/count`;
      } else {
        return; // Not applicable for admin
      }
      
      const res = await axios.get(endpoint);
      setTripRequests(res.data.count);
    } catch (error) {
      console.error('Error fetching trip requests count:', error);
    }
  };

  // Event listener for notification updates
  useEffect(() => {
    // Add event listener for notification updates
    const handleNotificationUpdate = () => {
      console.log('Notification update event received');
      fetchUnreadNotifications();
    };
    
    // Add event listener for pending count updates
    const handlePendingCountUpdate = (event) => {
      console.log('Pending count update event received:', event.detail);
      if (event.detail && typeof event.detail.count !== 'undefined') {
        setPendingRequests(event.detail.count);
      } else {
        // Fallback to API fetch if no count in event
        fetchPendingRequests();
      }
    };
    
    // Add event listener for trip request updates
    const handleTripRequestUpdate = () => {
      console.log('Trip request update event received');
      fetchTripRequests();
    };

    window.addEventListener('notification-updated', handleNotificationUpdate);
    window.addEventListener('pending-count-updated', handlePendingCountUpdate);
    window.addEventListener('trip-request-updated', handleTripRequestUpdate);

    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
      window.removeEventListener('pending-count-updated', handlePendingCountUpdate);
      window.removeEventListener('trip-request-updated', handleTripRequestUpdate);
    };
  }, [currentUser]); // Re-add event listener if user changes
  
  // Initial fetch and interval refresh
  useEffect(() => {
    fetchUnreadNotifications();
    fetchPendingRequests();
    fetchTripRequests();

    // Set up interval to refresh counts
    const interval = setInterval(() => {
      fetchUnreadNotifications();
      fetchPendingRequests();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
  };

  const renderNavLinks = () => {
    if (!currentUser) {
      return (
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/login">Login</Nav.Link>
          <NavDropdown title="Register" id="register-dropdown">
            <NavDropdown.Item as={Link} to="/register/company">As Company</NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/register/driver">As Driver</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      );
    }

    const { role } = currentUser;

    if (role === 'admin') {
      return (
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/admin/dashboard">Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/admin/pending-approvals">
            Pending Approvals
            {pendingRequests > 0 && (
              <Badge bg="danger" pill className="ms-1">{pendingRequests}</Badge>
            )}
          </Nav.Link>
          <Nav.Link as={Link} to="/admin/companies">Companies</Nav.Link>
          <Nav.Link as={Link} to="/admin/drivers">Drivers</Nav.Link>
          <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
        </Nav>
      );
    }

    if (role === 'company') {
      return (
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/company/dashboard">Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/company/profile">Profile</Nav.Link>
          <NavDropdown title="Trips" id="company-trips-dropdown">
            <NavDropdown.Item as={Link} to="/company/trips">All Trips</NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/company/trips/create">Create Trip</NavDropdown.Item>
          </NavDropdown>
          <Nav.Link as={Link} to="/company/trip-requests">
            Trip Requests
            {tripRequests > 0 && (
              <Badge bg="danger" pill className="ms-1">{tripRequests}</Badge>
            )}
          </Nav.Link>
          <Nav.Link as={Link} to="/company/reports">Reports</Nav.Link>
          <Nav.Link as={Link} to="/company/notifications">
            Notifications
            {unreadNotifications > 0 && (
              <Badge bg="danger" pill className="ms-1">{unreadNotifications}</Badge>
            )}
          </Nav.Link>
          <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
        </Nav>
      );
    }

    if (role === 'driver') {
      return (
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/driver/dashboard">Dashboard</Nav.Link>
          <Nav.Link as={Link} to="/driver/profile">Profile</Nav.Link>
          <Nav.Link as={Link} to="/driver/availability">Update Availability</Nav.Link>
          <NavDropdown title="Trips" id="driver-trips-dropdown">
            <NavDropdown.Item as={Link} to="/driver/trips">My Trips</NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/driver/available-trips">Available Trips</NavDropdown.Item>
          </NavDropdown>
          <Nav.Link as={Link} to="/driver/trip-requests">
            Trip Requests
            {tripRequests > 0 && (
              <Badge bg="danger" pill className="ms-1">{tripRequests}</Badge>
            )}
          </Nav.Link>
          <Nav.Link as={Link} to="/driver/reports">Reports</Nav.Link>
          <Nav.Link as={Link} to="/driver/notifications">
            Notifications
            {unreadNotifications > 0 && (
              <Badge bg="danger" pill className="ms-1">{unreadNotifications}</Badge>
            )}
          </Nav.Link>
          <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
        </Nav>
      );
    }

    return null;
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
      <Container>
        <Navbar.Brand as={Link} to="/">Transportation Company</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {renderNavLinks()}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
