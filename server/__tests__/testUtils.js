const jwt = require('jsonwebtoken');
const sinon = require('sinon');
require('dotenv').config();

/**
 * Generate a JWT token for testing
 * @param {Object} user - User object with id and role
 * @returns {String} JWT token
 */
function generateTestToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
}

/**
 * Create mock request and response objects for controller testing
 * @param {Object} options - Options for the mock objects
 * @returns {Object} Mock req and res objects
 */
function createMockReqRes(options = {}) {
  const {
    user = { id: 1, role: 'driver' },
    params = {},
    body = {},
    query = {},
    headers = {}
  } = options;

  const req = {
    user,
    params,
    body,
    query,
    headers,
    get: sinon.stub().callsFake(name => headers[name])
  };

  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    end: sinon.stub().returnsThis(),
    cookie: sinon.stub().returnsThis(),
    clearCookie: sinon.stub().returnsThis()
  };

  return { req, res };
}

/**
 * Create a mock database connection
 * @returns {Object} Mock connection object
 */
function createMockDbConnection() {
  return {
    execute: sinon.stub(),
    query: sinon.stub(),
    end: sinon.stub(),
    release: sinon.stub()
  };
}

/**
 * Wait for a specified time
 * @param {Number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateTestToken,
  createMockReqRes,
  createMockDbConnection,
  wait
};
