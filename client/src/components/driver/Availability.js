import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Availability = () => {
  const { userProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    current_location: '',
    available_from: '',
    available_to: ''
  });
  
  const [currentAvailability, setCurrentAvailability] = useState(null);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchCurrentAvailability();
    }
  }, [userProfile]);

  const fetchCurrentAvailability = async () => {
    try {
      setFetchLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/driver/availability/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const availabilityData = response.data;
      console.log('Fetched availability data:', availabilityData);
      console.log('Response status:', response.status);
      console.log('Full response:', response);
      
      // Only set the data if it has the expected structure
      if (availabilityData) {
        // Map the API response keys to the expected format
        const mappedData = {
          current_location: availabilityData.location || availabilityData.current_location || '',
          available_from: availabilityData.availableFrom || availabilityData.available_from || '',
          available_to: availabilityData.availableTo || availabilityData.available_to || ''
        };
        
        setCurrentAvailability(mappedData);
        console.log('Current availability set to:', mappedData);
        
        // Set form data with mapped values
        setFormData(mappedData);
        console.log('Form data set to:', mappedData);
      }
      
    } catch (err) {
      console.error('Error fetching current availability:', err);
      setError('Failed to load current availability. Please try again.');
    } finally {
      setFetchLoading(false);
    }
  };

  // Helper function to check if a date is invalid
  const isInvalidDate = (dateString) => {
    if (!dateString) return true;
    const date = new Date(dateString);
    return isNaN(date.getTime()) || dateString === '0000-00-00 00:00:00';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Reset messages
    setError(null);
    setSuccess(false);

    // Form validation
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Validate that available_to is after available_from
    const fromDate = new Date(formData.available_from);
    const toDate = new Date(formData.available_to);
    
    if (toDate <= fromDate) {
      setError('End time must be after start time');
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/driver/availability`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess(true);
      setCurrentAvailability(formData);
      
      // Navigate to dashboard after a delay
      setTimeout(() => {
        navigate('/driver/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error updating availability:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update availability. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get current date and time for min value
  const now = new Date();
  const localDateStr = now.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"

  if (fetchLoading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your availability...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Update Availability</h2>
      
      <div className="alert alert-light border-start border-4 border-success mb-4" dir="rtl">
        <strong>🕐 עדכון זמינות</strong>
        <p className="mb-0 mt-1">עדכן את המיקום הנוכחי שלך ואת שעות הזמינות. חברות יראו אותך כזמין ויוכלו לשלוח לך הצעות לנסיעות.</p>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Availability updated successfully!</Alert>}
          
          {currentAvailability && (
            <Alert variant="info" className="mb-4">
              <h5>Current Availability</h5>
              <p className="mb-1">
                <strong>Location:</strong> {currentAvailability.current_location || 'Not set'}
              </p>
              {currentAvailability.available_from && currentAvailability.available_to && 
               !isInvalidDate(currentAvailability.available_from) && !isInvalidDate(currentAvailability.available_to) ? (
                <p className="mb-0">
                  <strong>Available:</strong> {new Date(currentAvailability.available_from).toLocaleString()} - {new Date(currentAvailability.available_to).toLocaleString()}
                </p>
              ) : (
                <p className="mb-0">
                  <strong>Available:</strong> Not set
                </p>
              )}
            </Alert>
          )}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="current_location">
              <Form.Label>Current Location</Form.Label>
              <Form.Control
                type="text"
                name="current_location"
                placeholder="Enter your current location"
                value={formData.current_location}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">
                Enter a specific location like "Tel Aviv, Dizengoff Center" or "Jerusalem, Central Bus Station"
              </Form.Text>
              <Form.Control.Feedback type="invalid">
                Please enter your current location.
              </Form.Control.Feedback>
            </Form.Group>

            <Row className="mb-4">
              <Col md={6}>
                <Form.Group controlId="available_from">
                  <Form.Label>Available From</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="available_from"
                    value={formData.available_from}
                    onChange={handleChange}
                    min={localDateStr}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please select a valid start time.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="available_to">
                  <Form.Label>Available To</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="available_to"
                    value={formData.available_to}
                    onChange={handleChange}
                    min={localDateStr}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please select a valid end time.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <Button
                variant="secondary"
                onClick={() => navigate('/driver/dashboard')}
                className="me-md-2"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  'Update Availability'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Availability;
