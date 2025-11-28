import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Button, Alert, Row, Col, Tab, Nav, Modal } from 'react-bootstrap';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBuilding, faCar, faEnvelope, faPhone, faIdCard, faLock, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext';

const API_URL = 'http://127.0.0.1:5000/api';

const Profile = () => {
  const { currentUser, userProfile } = useContext(AuthContext);
  
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [companyInfo, setCompanyInfo] = useState({
    company_type: '',
    license_number: '',
    tax_id: '',
    website: '',
    founding_year: ''
  });
  
  const [driverInfo, setDriverInfo] = useState({
    license_number: '',
    license_expiry: '',
    vehicle_type: '',
    vehicle_plate: ''
  });
  
  const [passwordInfo, setPasswordInfo] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailUpdatePassword, setEmailUpdatePassword] = useState('');
  const [emailUpdateError, setEmailUpdateError] = useState(null);
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState(false);
  const [emailUpdating, setEmailUpdating] = useState(false);

  useEffect(() => {
    console.log('Profile component mounted, checking auth status');
    // First check if we have current user data
    if (currentUser) {
      console.log('Current user available, fetching profile data');
      fetchUserProfile();
    } else {
      console.log('Current user not available, cannot fetch profile');
      setError('User information not available. Please login again.');
      setFetchLoading(false);
    }
  }, [currentUser]); // Depend on currentUser instead of userProfile

  const fetchUserProfile = async () => {
    try {
      setFetchLoading(true);
      setError(null);
      
      console.log('Current user:', currentUser);
      console.log('User profile:', userProfile);
      
      if (!currentUser) {
        throw new Error('User information not available');
      }
      
      // Get the correct API endpoint based on user role
      let endpoint = '';
      if (currentUser.role === 'admin') {
        endpoint = `${API_URL}/admin/profile`;
      } else if (currentUser.role === 'company') {
        endpoint = `${API_URL}/company/profile`;
      } else if (currentUser.role === 'driver') {
        endpoint = `${API_URL}/driver/profile`;
      } else {
        throw new Error('Invalid user role: ' + currentUser.role);
      }
      
      console.log('Fetching profile from endpoint:', endpoint);
      
      // Fetch user profile data from the API
      const token = localStorage.getItem('token');
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const profileData = response.data;
      
      console.log('Profile data received:', profileData);
      
      if (!profileData) {
        throw new Error('Profile data not found');
      }
      
      // Set the appropriate state based on user role
      if (currentUser.role === 'company') {
        console.log('Setting company profile data');
        setPersonalInfo({
          company_name: profileData.company_name || '',
          contact_person: profileData.contact_person || '',
          email: currentUser.email || '',
          phone: profileData.phone || '',
          address: profileData.address || ''
        });
        
        setCompanyInfo({
          company_type: profileData.company_type || '',
          license_number: profileData.license_number || '',
          tax_id: profileData.tax_id || '',
          website: profileData.website || '',
          founding_year: profileData.founding_year || ''
        });
      } else if (currentUser.role === 'driver') {
        console.log('Setting driver profile data');
        setPersonalInfo({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: currentUser.email || '',
          phone: profileData.phone || '',
          address: profileData.address || ''
        });
        
        setDriverInfo({
          license_number: profileData.license_number || '',
          license_expiry: profileData.license_expiry || '',
          vehicle_type: profileData.vehicle_type || '',
          vehicle_plate: profileData.vehicle_plate || ''
        });
      } else if (currentUser.role === 'admin') {
        console.log('Setting admin profile data');
        setPersonalInfo({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          address: profileData.address || ''
        });
      }
      
    } catch (err) {
      console.error('Error fetching user profile:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      console.log('Error details:', { status: err.response?.status, message: errorMessage });
      
      // Use a more specific error message if we have one from the server
      if (err.response?.status === 404) {
        setError('Your profile information could not be found. Please contact support.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(`Failed to load profile information: ${errorMessage}. Please try again later.`);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo({ ...personalInfo, [name]: value });
  };

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo({ ...companyInfo, [name]: value });
  };

  const handleDriverInfoChange = (e) => {
    const { name, value } = e.target;
    setDriverInfo({ ...driverInfo, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordInfo({ ...passwordInfo, [name]: value });
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setError(null);
    setSuccess(false);

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);

    const emailChanged = personalInfo.email !== currentUser.email;

    try {
      const dataToSubmit = { ...personalInfo };
      if (emailChanged) {
        delete dataToSubmit.email;
      }

      const token = localStorage.getItem('token');
      let endpoint = '';
      if (currentUser.role === 'admin') {
        endpoint = `${API_URL}/admin/profile`;
      } else if (currentUser.role === 'company') {
        endpoint = `${API_URL}/company/profile`;
      } else if (currentUser.role === 'driver') {
        endpoint = `${API_URL}/driver/profile`;
      }

      if (Object.keys(dataToSubmit).length > 0) {
        await axios.put(endpoint, dataToSubmit, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (emailChanged) {
        setShowEmailModal(true);
      }

      setLoading(false);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailUpdateSubmit = async (e) => {
    e.preventDefault();
    setEmailUpdateError(null);
    setEmailUpdateSuccess(false);

    if (!emailUpdatePassword) {
      setEmailUpdateError('Password is required.');
      return;
    }

    setEmailUpdating(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/update-email`, {
        email: personalInfo.email,
        password: emailUpdatePassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setEmailUpdateSuccess(true);
      setTimeout(() => setEmailUpdateSuccess(false), 3000);
      setShowEmailModal(false);
      // Manually update the email in the auth context or refetch user
      // For now, we can just update the UI state, but a full context update is better
      currentUser.email = personalInfo.email;

    } catch (err) {
      console.error('Error updating email:', err);
      const message = err.response?.data?.message || 'An error occurred.';
      setEmailUpdateError(`Failed to update email: ${message}`);
    } finally {
      setEmailUpdating(false);
      setEmailUpdatePassword('');
    }
  };

  const handleCompanyInfoSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setError(null);
    setSuccess(false);

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/company/profile`, companyInfo, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating company information:', error);
      setError('Failed to update company information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverInfoSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setError(null);
    setSuccess(false);

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/driver/profile`, driverInfo, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating driver information:', error);
      setError('Failed to update driver information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setPasswordError(null);
    setPasswordSuccess(false);

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    if (passwordInfo.new_password !== passwordInfo.confirm_password) {
      setPasswordError("New passwords don't match");
      return;
    }

    setValidated(true);
    setLoading(true);

    try {
      let endpoint = '';
      if (userProfile?.role === 'admin') {
        endpoint = `${API_URL}/admin/profile/password`;
      } else if (userProfile?.role === 'company') {
        endpoint = `${API_URL}/company/profile/password`;
      } else if (userProfile?.role === 'driver') {
        endpoint = `${API_URL}/driver/profile/password`;
      } else {
        throw new Error('Invalid user role');
      }
      
      await axios.put(endpoint, {
        current_password: passwordInfo.current_password,
        new_password: passwordInfo.new_password
      });
      
      setPasswordSuccess(true);
      
      setPasswordInfo({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setValidated(false);
      
      setTimeout(() => setPasswordSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating password:', error);
      
      if (error.response && error.response.status === 401) {
        setPasswordError('Current password is incorrect. Please try again.');
      } else {
        setPasswordError('Failed to update password. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">My Profile</h2>
      
      <div className="alert alert-light border-start border-4 border-info mb-4" dir="rtl">
        <strong>👤 הפרופיל שלי</strong>
        <p className="mb-0 mt-1">כאן תוכל לעדכן את הפרטים האישיים שלך, לשנות סיסמה, ולערוך פרטי רכב (לנהגים) או פרטי חברה (לחברות).</p>
      </div>
      
      <Tab.Container id="profile-tabs" defaultActiveKey="personal">
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="personal">
                  <FontAwesomeIcon icon={currentUser?.role === 'company' ? faBuilding : faUser} className="me-2" />
                  {currentUser?.role === 'company' ? 'Company Information' : 'Personal Information'}
                </Nav.Link>
              </Nav.Item>
              
              
              {currentUser?.role === 'driver' && (
                <Nav.Item>
                  <Nav.Link eventKey="driver">
                    <FontAwesomeIcon icon={faCar} className="me-2" />
                    Driver & Vehicle Details
                  </Nav.Link>
                </Nav.Item>
              )}
              
              <Nav.Item>
                <Nav.Link eventKey="password">
                  <FontAwesomeIcon icon={faLock} className="me-2" />
                  Change Password
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey="personal">
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">Profile updated successfully!</Alert>}
                
                <Form noValidate validated={validated} onSubmit={handlePersonalInfoSubmit}>
                  {currentUser?.role === 'company' ? (
                    // Company Form
                    <>
                      <Form.Group className="mb-3" controlId="company_name">
                        <Form.Label>Company Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="company_name"
                          value={personalInfo.company_name}
                          onChange={handlePersonalInfoChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter company name.
                        </Form.Control.Feedback>
                      </Form.Group>
                      
                      <Form.Group className="mb-3" controlId="contact_person">
                        <Form.Label>Contact Person Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="contact_person"
                          value={personalInfo.contact_person}
                          onChange={handlePersonalInfoChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter contact person name.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </>
                  ) : (
                    // Individual Form
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="first_name">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={personalInfo.first_name}
                            onChange={handlePersonalInfoChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter first name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="last_name">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={personalInfo.last_name}
                            onChange={handlePersonalInfoChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter last name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a valid email.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="phone">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter phone number.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="address">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={personalInfo.address}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter address.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </Form>
              </Tab.Pane>
              
              
              {currentUser?.role === 'driver' && (
                <Tab.Pane eventKey="driver">
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">Driver information updated successfully!</Alert>}
                  
                  <Form noValidate validated={validated} onSubmit={handleDriverInfoSubmit}>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="license_number">
                          <Form.Label>Driver License Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="license_number"
                            value={driverInfo.license_number}
                            onChange={handleDriverInfoChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter license number.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="license_expiry">
                          <Form.Label>License Expiry Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="license_expiry"
                            value={driverInfo.license_expiry}
                            onChange={handleDriverInfoChange}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Please enter license expiry date.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <hr className="my-4" />
                    <h5 className="mb-3">Vehicle Information</h5>
                    
                    <Form.Group className="mb-3" controlId="vehicle_type">
                      <Form.Label>Vehicle Type (Capacity)</Form.Label>
                      <Form.Select
                        name="vehicle_type"
                        value={driverInfo.vehicle_type}
                        onChange={handleDriverInfoChange}
                        required
                      >
                        <option value="">Select vehicle type</option>
                        <option value="4">4 Seater</option>
                        <option value="6">6 Seater</option>
                        <option value="8">8 Seater</option>
                        <option value="10">10 Seater</option>
                        <option value="14">14 Seater</option>
                        <option value="16">16 Seater</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        Please select vehicle type.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3" controlId="vehicle_plate">
                      <Form.Label>License Plate</Form.Label>
                      <Form.Control
                        type="text"
                        name="vehicle_plate"
                        value={driverInfo.vehicle_plate}
                        onChange={handleDriverInfoChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Please enter license plate.
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
              )}
              
              <Tab.Pane eventKey="password">
                {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                {passwordSuccess && <Alert variant="success">Password updated successfully!</Alert>}
                
                <Form noValidate validated={validated} onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3" controlId="current_password">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="current_password"
                      value={passwordInfo.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter current password.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="new_password">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="new_password"
                      value={passwordInfo.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength="8"
                    />
                    <Form.Text className="text-muted">
                      Password must be at least 8 characters long.
                    </Form.Text>
                    <Form.Control.Feedback type="invalid">
                      Password must be at least 8 characters long.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="confirm_password">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirm_password"
                      value={passwordInfo.confirm_password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please confirm your new password.
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
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
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </Form>
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>

      <Modal show={showEmailModal} onHide={() => { setShowEmailModal(false); setLoading(false); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Email Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {emailUpdateError && <Alert variant="danger">{emailUpdateError}</Alert>}
          {emailUpdateSuccess && <Alert variant="success">Email updated successfully!</Alert>}
          <p>To change your email to <strong>{personalInfo.email}</strong>, please enter your current password.</p>
          <Form onSubmit={handleEmailUpdateSubmit}>
            <Form.Group controlId="emailUpdatePassword">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={emailUpdatePassword}
                onChange={(e) => setEmailUpdatePassword(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={() => { setShowEmailModal(false); setLoading(false); }} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={emailUpdating}>
                {emailUpdating ? 'Updating...' : 'Update Email'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Profile;
