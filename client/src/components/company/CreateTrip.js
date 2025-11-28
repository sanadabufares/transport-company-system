import React, { useState, useContext } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:5000/api';

const CreateTrip = () => {
  const { userProfile, triggerDashboardRefresh } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    pickup_location: '',
    destination: '',
    trip_date: '',
    departure_time: '',
    passenger_count: '',
    vehicle_type: '',
    company_price: '',
    driver_price: '',
    visa_number: ''
  });
  
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date and time to ensure proper format
    if (name === 'trip_date') {
      // Ensure proper YYYY-MM-DD format
      const dateValue = value ? value : '';
      setFormData({ ...formData, [name]: dateValue });
    } else if (name === 'departure_time') {
      // Ensure proper HH:MM format
      const timeValue = value ? value : '';
      setFormData({ ...formData, [name]: timeValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

    setValidated(true);
    setLoading(true);

    try {
      // Make API call to create trip
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/company/trips`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Trip created successfully:', response.data);
      setSuccess(true);
      
      // Clear form
      setFormData({
        pickup_location: '',
        destination: '',
        trip_date: '',
        departure_time: '',
        passenger_count: '',
        vehicle_type: '',
        company_price: '',
        driver_price: '',
        visa_number: ''
      });
      
      setValidated(false);
      
      // Trigger a refresh of the main dashboard stats
      triggerDashboardRefresh();

      // Navigate to trips list after a delay
      setTimeout(() => {
        navigate('/company/trips');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating trip:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create trip. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum allowed date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="mb-4">Create New Trip</h2>
      
      <div className="alert alert-light border-start border-4 border-success mb-4" dir="rtl">
        <strong>➕ יצירת נסיעה חדשה</strong>
        <p className="mb-0 mt-1">מלא את כל הפרטים הנדרשים ליצירת נסיעה חדשה: מיקום איסוף, יעד, תאריך, שעה, מספר נוסעים, ומחירים.</p>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Trip created successfully!</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="pickup_location">
                  <Form.Label>Pickup Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="pickup_location"
                    placeholder="Enter pickup location"
                    value={formData.pickup_location}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter pickup location.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="destination">
                  <Form.Label>Destination</Form.Label>
                  <Form.Control
                    type="text"
                    name="destination"
                    placeholder="Enter destination"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter destination.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="trip_date">
                  <Form.Label>Trip Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="trip_date"
                    value={formData.trip_date}
                    onChange={handleChange}
                    min={today}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please select a valid date.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="departure_time">
                  <Form.Label>Departure Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="departure_time"
                    value={formData.departure_time}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please select departure time.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="passenger_count">
                  <Form.Label>Number of Passengers</Form.Label>
                  <Form.Control
                    type="number"
                    name="passenger_count"
                    placeholder="Enter passenger count"
                    value={formData.passenger_count}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid passenger count.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="vehicle_type">
                  <Form.Label>Vehicle Type</Form.Label>
                  <Form.Select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select vehicle type</option>
                    <option value="8">8 Seater</option>
                    <option value="14">14 Seater</option>
                    <option value="19">19 Seater</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    Please select vehicle type.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="company_price">
                  <Form.Label>Company Price (₪)</Form.Label>
                  <Form.Control
                    type="number"
                    name="company_price"
                    placeholder="Enter company price"
                    value={formData.company_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid company price.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3" controlId="driver_price">
                  <Form.Label>Driver Price (₪)</Form.Label>
                  <Form.Control
                    type="number"
                    name="driver_price"
                    placeholder="Enter driver price"
                    value={formData.driver_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid driver price.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="visa_number">
              <Form.Label>Visa Number <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="visa_number"
                placeholder="Enter visa number"
                value={formData.visa_number}
                onChange={handleChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Please enter a visa number. Each trip must have a unique visa number.
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Visa number must be unique for each trip.
              </Form.Text>
            </Form.Group>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <Button
                variant="secondary"
                onClick={() => navigate('/company/trips')}
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
                    Creating...
                  </>
                ) : (
                  'Create Trip'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateTrip;
