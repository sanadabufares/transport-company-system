import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

// Define different API base URLs to try
const API_URLS = [
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api',
  'http://localhost:3000/api'
];

const DashboardDebugger = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState('');

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    setAuthToken(token || '');
  }, []);

  const testEndpoint = async (apiUrl, endpoint) => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      };
      
      const response = await axios.get(`${apiUrl}${endpoint}`, config);
      return {
        success: true,
        status: response.status,
        data: response.data.length || 0,
        message: `Success: Found ${response.data.length || 0} items`
      };
    } catch (error) {
      console.error(`Error testing ${apiUrl}${endpoint}:`, error);
      
      return {
        success: false,
        status: error.response?.status || 'Network Error',
        data: 0,
        message: error.response?.data?.message || error.message
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    setError(null);
    const testResults = [];

    try {
      for (const apiUrl of API_URLS) {
        // Test generic endpoints
        testResults.push({
          name: `${apiUrl} - Auth Check`,
          result: await testEndpoint(apiUrl, '/auth/check')
        });
        
        // Test admin endpoints
        testResults.push({
          name: `${apiUrl} - Companies`,
          result: await testEndpoint(apiUrl, '/admin/companies')
        });
        
        testResults.push({
          name: `${apiUrl} - Drivers`,
          result: await testEndpoint(apiUrl, '/admin/drivers')
        });
      }
      
      setResults(testResults);
    } catch (err) {
      console.error('Error running tests:', err);
      setError('Failed to run tests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Dashboard API Debugger</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>API Connection Tests</Card.Title>
          <p><strong>Auth Token:</strong> {authToken ? `${authToken.substring(0, 15)}...` : 'Not found'}</p>
          
          <Button 
            variant="primary" 
            onClick={runTests} 
            disabled={loading}
          >
            {loading ? 'Running Tests...' : 'Run API Tests'}
          </Button>
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </Card.Body>
      </Card>
      
      {results.length > 0 && (
        <Card>
          <Card.Body>
            <Card.Title>Test Results</Card.Title>
            <div className="mt-3">
              {results.map((test, index) => (
                <div key={index} className="mb-3 p-3 border rounded">
                  <h5>{test.name}</h5>
                  <p className={`badge bg-${test.result.success ? 'success' : 'danger'}`}>
                    Status: {test.result.status}
                  </p>
                  <p><strong>Data Count:</strong> {test.result.data}</p>
                  <p><strong>Message:</strong> {test.result.message}</p>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default DashboardDebugger;
