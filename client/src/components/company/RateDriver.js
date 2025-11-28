import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faUser, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const RateDriver = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [driver, setDriver] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      fetchTripDetails();
    }
  }, [userProfile, tripId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would make an API call
      // const res = await axios.get(`${API_URL}/company/trips/${tripId}`);
      // setTrip(res.data.trip);
      // setDriver(res.data.driver);
      
      // Simulate API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for demo
      setTrip({
        id: parseInt(tripId),
        pickup_location: 'Tel Aviv, Savidor Center Station',
        destination: 'Haifa, Technion',
        trip_date: '2025-05-12',
        departure_time: '12:00:00',
        arrival_time: '13:30:00',
        status: 'completed',
        passenger_count: 8,
        price: 320,
        created_at: '2025-05-10T14:30:00',
        completed_at: '2025-05-12T13:35:00',
        existing_rating: null // This would be set if the driver was already rated
      });
      
      setDriver({
        id: 101,
        first_name: 'David',
        last_name: 'Cohen',
        phone: '050-1234567',
        vehicle_type: '8',
        vehicle_plate: '12-345-67',
        average_rating: 4.7,
        total_ratings: 28
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trip details:', err);
      setError('Failed to load trip details. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating before submitting.');
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError(null);
      
      // In a real app, this would make an API call
      // await axios.post(`${API_URL}/company/trips/${tripId}/rate`, {
      //   rating,
      //   comment
      // });
      
      // Simulate API call for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Navigate back to trips page after a delay
      setTimeout(() => {
        navigate('/company/trips');
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderRatingStars = (selectedRating, isInteractive = false) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (isInteractive) {
        stars.push(
          <FontAwesomeIcon 
            key={i}
            icon={i <= (hoveredRating || rating) ? faStarSolid : faStarRegular}
            className={i <= (hoveredRating || rating) ? "text-warning" : "text-secondary"}
            style={{ 
              cursor: 'pointer', 
              fontSize: '2rem',
              marginRight: '0.5rem'
            }}
            onMouseEnter={() => setHoveredRating(i)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(i)}
          />
        );
      } else {
        stars.push(
          <FontAwesomeIcon 
            key={i}
            icon={i <= selectedRating ? faStarSolid : faStarRegular}
            className={i <= selectedRating ? "text-warning" : "text-secondary"}
            style={{ marginRight: '0.2rem' }}
          />
        );
      }
    }
    
    return stars;
  };

  if (loading) {
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
      <h2 className="mb-4">Rate Driver</h2>
      
      <div className="alert alert-light border-start border-4 border-warning mb-4" dir="rtl">
        <strong>⭐ דירוג נהג</strong>
        <p className="mb-0 mt-1">דרג את הנהג לאחר סיום הנסיעה. הדירוג עוזר לנהגים אחרים ולחברות לקבל החלטות מושכלות.</p>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          Rating submitted successfully! Redirecting to trips page...
        </Alert>
      )}
      
      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="text-center mb-3">
                <div className="bg-light p-3 rounded-circle d-inline-block mb-2">
                  <FontAwesomeIcon icon={faUser} size="3x" />
                </div>
                <h4>{driver.first_name} {driver.last_name}</h4>
                <div className="mb-1">
                  {renderRatingStars(driver.average_rating)}
                  <span className="ms-1">({driver.average_rating.toFixed(1)})</span>
                </div>
                <small className="text-muted">{driver.total_ratings} ratings</small>
              </div>
              
              <hr />
              
              <div>
                <p className="mb-1"><strong>Phone:</strong> {driver.phone}</p>
                <p className="mb-1"><strong>Vehicle Type:</strong> {driver.vehicle_type} Seater</p>
                <p className="mb-0"><strong>Vehicle Plate:</strong> {driver.vehicle_plate}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-4">Trip Details</Card.Title>
              
              <Row className="mb-4">
                <Col md={6}>
                  <p className="mb-2"><strong>From:</strong> {trip.pickup_location}</p>
                  <p className="mb-2"><strong>To:</strong> {trip.destination}</p>
                  <p className="mb-2">
                    <strong>Date:</strong> {new Date(trip.trip_date).toLocaleDateString()}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Departure Time:</strong> {new Date(`${trip.trip_date}T${trip.departure_time}`).toLocaleTimeString()}
                  </p>
                  <p className="mb-2">
                    <strong>Arrival Time:</strong> {new Date(`${trip.trip_date}T${trip.arrival_time}`).toLocaleTimeString()}
                  </p>
                  <p className="mb-2"><strong>Passengers:</strong> {trip.passenger_count}</p>
                </Col>
              </Row>
              
              <hr className="my-4" />
              
              {trip.existing_rating ? (
                <div className="text-center py-3">
                  <h5>You've already rated this trip</h5>
                  <div className="mb-3">
                    {renderRatingStars(trip.existing_rating.score)}
                    <p className="text-muted mt-2">{trip.existing_rating.comment || 'No comment provided'}</p>
                  </div>
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigate('/company/trips')}
                  >
                    Back to Trips
                  </Button>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4" controlId="rating">
                    <Form.Label>
                      <h5>How would you rate this driver?</h5>
                    </Form.Label>
                    <div className="text-center my-3">
                      {renderRatingStars(rating, true)}
                      {rating > 0 && (
                        <div className="mt-2">
                          {rating === 5 && <small className="text-success">Excellent</small>}
                          {rating === 4 && <small className="text-primary">Good</small>}
                          {rating === 3 && <small className="text-info">Average</small>}
                          {rating === 2 && <small className="text-warning">Below Average</small>}
                          {rating === 1 && <small className="text-danger">Poor</small>}
                        </div>
                      )}
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-4" controlId="comment">
                    <Form.Label>Comments (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Share your experience with this driver..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/company/trips')}
                      className="me-2"
                      disabled={submitLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={submitLoading || rating === 0}
                    >
                      {submitLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit Rating'
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RateDriver;
