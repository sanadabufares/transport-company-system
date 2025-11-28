import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const EditTrip = () => {
  const { userProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const { tripId } = useParams(); // Changed from id to tripId to match the route parameter
  
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
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    } else {
      setError('Trip ID is missing');
      setFetchLoading(false);
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      setFetchLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/company/trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const tripData = response.data;
      // Format date and time correctly for the form fields
      if (tripData.trip_date) {
        tripData.trip_date = tripData.trip_date.split('T')[0];
      }
      if (tripData.departure_time) {
        tripData.departure_time = tripData.departure_time.substring(0, 5);
      }
      setFormData(tripData);

      // If the trip is pending, fetch available drivers
      if (tripData.status === 'pending') {
        fetchAvailableDrivers(tripData);
      }
      
    } catch (err) {
      console.error('Error fetching trip:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load trip details. Please try again.';
      setError(errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAvailableDrivers = async (tripData) => {
    try {
      const token = localStorage.getItem('token');
      // Use requesting drivers endpoint for edit trip - only show drivers who requested this trip
      const response = await axios.get(`${API_URL}/company/trips/${tripId}/requesting-drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAvailableDrivers(response.data);
    } catch (err) {
      console.error('Error fetching requesting drivers:', err);
      // Don't block the UI for this, just log the error
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      setError('Please select a driver to assign.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/company/trips/${tripId}`,
        { driver_id: selectedDriver, status: 'assigned' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccess('Driver assigned successfully!');
      setTimeout(() => navigate('/company/trips'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to assign driver.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

    setValidated(true);
    setLoading(true);
    
    // Fix timezone offset issue by adding a day if needed
    // This ensures the date is stored exactly as selected by the user
    const tripData = {
      ...formData,
      // Store the date exactly as entered by the user without timezone adjustment
      // Force ISO format YYYY-MM-DD to ensure consistent date storage
      trip_date: formData.trip_date
    };
    
    // Log the date being sent to the server for debugging
    console.log('Submitting trip date:', tripData.trip_date);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/company/trips/${tripId}`, tripData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Trip updated successfully:', response.data);
      
      setSuccess(true);
      
      // Navigate to trips list after a delay
      setTimeout(() => {
        navigate('/company/trips');
      }, 2000);
      
    } catch (err) {
      console.error('Error updating trip:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update trip. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum allowed date (today)
  const today = new Date().toISOString().split('T')[0];

  if (fetchLoading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading trip details...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Edit Trip</h2>
      
      <div className="alert alert-light border-start border-4 border-warning mb-4" dir="rtl">
        <strong>✏️ עריכת נסיעה</strong>
        <p className="mb-0 mt-1">כאן תוכל לערוך את פרטי הנסיעה: מיקום, תאריך, שעה, מספר נוסעים, ומחירים.</p>
      </div>
      
      <Card className="shadow-sm">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Trip updated successfully!</Alert>}
          
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
                    disabled={formData.status !== 'pending'}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid driver price.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="visa_number">
              <Form.Label>Visa Number (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="visa_number"
                placeholder="Enter visa number"
                value={formData.visa_number}
                onChange={handleChange}
              />
            </Form.Group>

            {/* Driver Assignment Section */}
            {formData.status === 'pending' && availableDrivers.length > 0 && (
              <Card className="my-4 bg-light">
                <Card.Body>
                  <Card.Title>Assign a Driver</Card.Title>
                  <Row>
                    <Col md={8}>
                      <Form.Group controlId="driver_assignment">
                        <Form.Label>Available Drivers</Form.Label>
                        <Form.Select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                        >
                          <option value="">Select a driver...</option>
                          {availableDrivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.first_name} {driver.last_name} ({driver.vehicle_type} seats, Rating: {driver.rating ? parseFloat(driver.rating).toFixed(1) : 'N/A'})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
                      <Button 
                        variant="success" 
                        onClick={handleAssignDriver} 
                        disabled={!selectedDriver || loading}
                        className="w-100"
                      >
                        {loading ? 'Assigning...' : 'Assign Driver'}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

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
                    Updating...
                  </>
                ) : (
                  'Update Trip'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditTrip;
