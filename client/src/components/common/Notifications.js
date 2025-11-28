import React, { useState, useEffect, useContext } from 'react';
import { Card, ListGroup, Badge, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faEye, faInfoCircle, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Notifications = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  useEffect(() => {
    console.log('Notifications component mounted');
    console.log('userProfile:', userProfile);
    console.log('currentUser:', currentUser);
    
    // If current user exists, proceed with fetching notifications, even if profile is null
    if (currentUser) {
      console.log('currentUser exists, fetching notifications');
      fetchNotifications();
    } else {
      console.log('currentUser does not exist, not fetching notifications');
      setLoading(false);
    }
  }, [currentUser]);

  const [showReadNotifications, setShowReadNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching notifications with userProfile:', userProfile);
      console.log('Current user:', currentUser);
      
      // Get the correct API endpoint based on user role
      let endpoint = '';
      if (currentUser?.role === 'admin') {
        endpoint = `${API_URL}/admin/notifications`;
        console.log('Using admin endpoint:', endpoint);
      } else if (currentUser?.role === 'company') {
        endpoint = `${API_URL}/company/notifications`;
        console.log('Using company endpoint:', endpoint);
      } else if (currentUser?.role === 'driver') {
        endpoint = `${API_URL}/driver/notifications`;
        console.log('Using driver endpoint:', endpoint);
      } else {
        console.error('Invalid user role:', currentUser?.role);
        throw new Error('Invalid user role');
      }
      
      console.log('Making request to:', endpoint);
      // Fetch notifications from the API
      const response = await axios.get(endpoint);
      console.log('Notifications response:', response.data);
      let userNotifications = response.data || [];
      
      // Process notifications to add action URLs based on notification type
      userNotifications = userNotifications.map(notification => {
        let actionUrl = null;
        
        // Set action URLs based on notification type and user role
        if (notification.title.includes('Registration') || notification.title.includes('Approval')) {
          if (currentUser?.role === 'admin') {
            actionUrl = '/admin/pending-approvals';
          }
        } else if (notification.title.includes('Trip')) {
          if (currentUser?.role === 'company') {
            actionUrl = '/company/trips';
          } else if (currentUser?.role === 'driver') {
            actionUrl = '/driver/trips';
          }
        } else if (notification.title.includes('Request')) {
          if (currentUser?.role === 'driver') {
            actionUrl = '/driver/trip-requests';
          } else if (currentUser?.role === 'company') {
            actionUrl = '/company/trip-requests';
          }
        }
        
        // Determine notification type based on content
        let type = 'system';
        if (notification.title.includes('Approval') || notification.title.includes('Registration')) {
          type = 'approval_required';
        } else if (notification.title.includes('Request')) {
          type = 'trip_request';
        } else if (notification.title.includes('Trip')) {
          type = 'trip_status';
        } else if (notification.title.includes('Account')) {
          type = 'account';
        }
        
        return {
          ...notification,
          type: type,
          read: notification.is_read,
          action_url: actionUrl
        };
      });
      
      // Sort notifications by read status (unread first) and date (newest first)
      userNotifications.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1; // Unread first
        }
        return new Date(b.created_at) - new Date(a.created_at); // Newest first
      });
      
      setNotifications(userNotifications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to load notifications. Please try again later.');
      setNotifications([]);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Get the correct API endpoint based on user role
      let endpoint = '';
      if (currentUser?.role === 'admin') {
        endpoint = `${API_URL}/admin/notifications/${notificationId}/read`;
      } else if (currentUser?.role === 'company') {
        endpoint = `${API_URL}/company/notifications/${notificationId}/read`;
      } else if (currentUser?.role === 'driver') {
        endpoint = `${API_URL}/driver/notifications/${notificationId}/read`;
      } else {
        throw new Error('Invalid user role');
      }
      
      // Make the actual API call to the server
      console.log('Marking notification as read:', notificationId);
      const response = await axios.put(endpoint);
      console.log('Mark as read response:', response.data);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true, is_read: true } // Update both properties
          : notification
      ));
      
      // Dispatch event to notify other components (like Header) that notifications have been updated
      window.dispatchEvent(new Event('notification-updated'));
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkAllLoading(true);
      
      // Get the correct API endpoint based on user role
      let endpoint = '';
      if (currentUser?.role === 'admin') {
        endpoint = `${API_URL}/admin/notifications/mark-all-read`;
      } else if (currentUser?.role === 'company') {
        endpoint = `${API_URL}/company/notifications/read-all`;
      } else if (currentUser?.role === 'driver') {
        endpoint = `${API_URL}/driver/notifications/read-all`;
      } else {
        throw new Error('Invalid user role');
      }
      
      // Make the actual API call to the server
      console.log('Marking all notifications as read');
      const response = await axios.put(endpoint);
      console.log('Mark all as read response:', response.data);
      
      // Update local state
      setNotifications(notifications.map(notification => ({ 
        ...notification, 
        read: true,
        is_read: true // Update both properties 
      })));
      
      // Dispatch event to notify other components (like Header) that notifications have been updated
      window.dispatchEvent(new Event('notification-updated'));
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read. Please try again.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval_required':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" />;
      case 'trip_request':
        return <FontAwesomeIcon icon={faBell} className="text-primary" />;
      case 'trip_status':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-info" />;
      case 'trip_reminder':
        return <FontAwesomeIcon icon={faBell} className="text-warning" />;
      case 'account':
        return <FontAwesomeIcon icon={faCheck} className="text-success" />;
      case 'payment':
        return <FontAwesomeIcon icon={faCheck} className="text-success" />;
      case 'system':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-secondary" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="text-primary" />;
    }
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 
        ? 'Just now'
        : diffInHours === 1 
          ? '1 hour ago' 
          : `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          Notifications
          {unreadCount > 0 && (
            <Badge bg="danger" className="ms-2">
              {unreadCount} New
            </Badge>
          )}
        </h2>
        
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => setShowReadNotifications(!showReadNotifications)}
          >
            {showReadNotifications ? 'Hide Read Notifications' : 'Show Read Notifications'}
          </Button>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline-primary" 
              onClick={handleMarkAllAsRead}
              disabled={markAllLoading}
            >
              {markAllLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Marking...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Mark All as Read
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="alert alert-light border-start border-4 border-info mb-4" dir="rtl">
        <strong>🔔 התראות</strong>
        <p className="mb-0 mt-1">כאן תוכל לראות את כל ההתראות שלך: בקשות חדשות, עדכוני נסיעות, ואישורים. לחץ על התראה כדי לסמן אותה כנקראה.</p>
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
          <p className="mt-3">Loading notifications...</p>
        </div>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            {notifications.length === 0 ? (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faBell} size="3x" className="text-muted mb-3" />
                <h5>No Notifications</h5>
                <p className="text-muted">You don't have any notifications at the moment.</p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {notifications
                  .filter(notification => showReadNotifications || !notification.read)
                  .map(notification => (
                  <ListGroup.Item 
                    key={notification.id}
                    className={notification.read ? '' : 'bg-light'}
                  >
                    <div className="d-flex">
                      <div className="me-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-1">{notification.title}</h6>
                          <small className="text-muted">
                            {getFormattedDate(notification.created_at)}
                          </small>
                        </div>
                        <p className="mb-1">{notification.message}</p>
                        <div className="d-flex mt-2">
                          {notification.action_url && (
                            <Button 
                              as={Link} 
                              to={notification.action_url} 
                              variant="outline-primary" 
                              size="sm"
                              className="me-2"
                            >
                              <FontAwesomeIcon icon={faEye} className="me-1" />
                              View
                            </Button>
                          )}
                          
                          {!notification.read && (
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <FontAwesomeIcon icon={faCheck} className="me-1" />
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Notifications;
