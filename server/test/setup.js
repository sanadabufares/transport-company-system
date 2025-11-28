// Global setup for Mocha tests
const chai = require('chai');
const sinon = require('sinon');

// Configure chai
chai.should();

// Make expect, assert, and should available globally
global.expect = chai.expect;
global.assert = chai.assert;
global.should = chai.should;
global.sinon = sinon;

// Setup process.env for tests
process.env.NODE_ENV = 'test';

// Add any other global setup here
