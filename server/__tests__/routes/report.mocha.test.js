const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const { expect } = require('chai');
const reportController = require('../../controllers/report');

// Mock the auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, role: 'company' };
  next();
};

// Mock the checkRole middleware
const mockCheckRole = (roles) => (req, res, next) => {
  next();
};

describe('Report Routes', () => {
  let companyApp, driverApp;

  beforeEach(() => {
    // Reset mocks
    sinon.restore();
    
    // Set up stubs for the controller methods
    sinon.stub(reportController, 'getCompanyTripsByDate');
    sinon.stub(reportController, 'getCompanyTripsByDriver');
    sinon.stub(reportController, 'getTripsByVisaNumber');
    sinon.stub(reportController, 'getDriverTripsByDate');
    sinon.stub(reportController, 'getDriverTripsByCompany');

    // Create app instances for company and driver tests
    companyApp = express();
    companyApp.use(express.json());
    companyApp.use((req, res, next) => {
      req.user = { id: 1, role: 'company' };
      next();
    });

    driverApp = express();
    driverApp.use(express.json());
    driverApp.use((req, res, next) => {
      req.user = { id: 2, role: 'driver' };
      next();
    });

    // Set up company routes
    companyApp.get('/api/report/company/trips-by-date', mockCheckRole(['company']), (req, res) => reportController.getCompanyTripsByDate(req, res));
    companyApp.get('/api/report/company/trips-by-driver', mockCheckRole(['company']), (req, res) => reportController.getCompanyTripsByDriver(req, res));
    companyApp.get('/api/report/company/trips-by-visa', mockCheckRole(['company']), (req, res) => reportController.getTripsByVisaNumber(req, res));

    // Set up driver routes
    driverApp.get('/api/report/driver/trips-by-date', mockCheckRole(['driver']), (req, res) => reportController.getDriverTripsByDate(req, res));
    driverApp.get('/api/report/driver/trips-by-company', mockCheckRole(['driver']), (req, res) => reportController.getDriverTripsByCompany(req, res));
    driverApp.get('/api/report/driver/trips-by-visa', mockCheckRole(['driver']), (req, res) => reportController.getTripsByVisaNumber(req, res));
  });

  describe('Company Reports', () => {
    describe('GET /api/report/company/trips-by-date', () => {
      it('should call the getCompanyTripsByDate controller', async () => {
        // Mock the controller function
        reportController.getCompanyTripsByDate.callsFake((req, res) => {
          res.json([
            {
              date: '2025-01-01',
              count: 5,
              total_earnings: 1500
            },
            {
              date: '2025-01-02',
              count: 3,
              total_earnings: 900
            }
          ]);
        });

        // Make the request
        const response = await request(companyApp).get('/api/report/company/trips-by-date');

        // Assertions
        expect(response.status).to.equal(200);
        expect(reportController.getCompanyTripsByDate.called).to.be.true;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
      });
    });

    describe('GET /api/report/company/trips-by-driver', () => {
      it('should call the getCompanyTripsByDriver controller', async () => {
        // Mock the controller function
        reportController.getCompanyTripsByDriver.callsFake((req, res) => {
          res.json([
            {
              driver_id: 1,
              driver_name: 'John Doe',
              trip_count: 10,
              total_earnings: 3000
            },
            {
              driver_id: 2,
              driver_name: 'Jane Smith',
              trip_count: 8,
              total_earnings: 2400
            }
          ]);
        });

        // Make the request
        const response = await request(companyApp).get('/api/report/company/trips-by-driver');

        // Assertions
        expect(response.status).to.equal(200);
        expect(reportController.getCompanyTripsByDriver.called).to.be.true;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
      });
    });

    describe('GET /api/report/company/trips-by-visa', () => {
      it('should call the getTripsByVisaNumber controller', async () => {
        // Mock the controller function
        reportController.getTripsByVisaNumber.callsFake((req, res) => {
          res.json([
            {
              visa_number: '1234-5678-9012-3456',
              trip_count: 5,
              total_amount: 1500
            },
            {
              visa_number: '9876-5432-1098-7654',
              trip_count: 3,
              total_amount: 900
            }
          ]);
        });

        // Make the request
        const response = await request(companyApp).get('/api/report/company/trips-by-visa');

        // Assertions
        expect(response.status).to.equal(200);
        expect(reportController.getTripsByVisaNumber.called).to.be.true;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
      });
    });
  });

  describe('Driver Reports', () => {
    describe('GET /api/report/driver/trips-by-date', () => {
      it('should call the getDriverTripsByDate controller', async () => {
        // Mock the controller function
        reportController.getDriverTripsByDate.callsFake((req, res) => {
          res.json([
            {
              date: '2025-01-01',
              count: 3,
              total_earnings: 900
            },
            {
              date: '2025-01-02',
              count: 2,
              total_earnings: 600
            }
          ]);
        });

        // Make the request
        const response = await request(driverApp).get('/api/report/driver/trips-by-date');

        // Assertions
        expect(response.status).to.equal(200);
        expect(reportController.getDriverTripsByDate.called).to.be.true;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
      });
    });

    describe('GET /api/report/driver/trips-by-company', () => {
      it('should call the getDriverTripsByCompany controller', async () => {
        // Mock the controller function
        reportController.getDriverTripsByCompany.callsFake((req, res) => {
          res.json([
            {
              company_id: 1,
              company_name: 'ABC Corp',
              trip_count: 5,
              total_earnings: 1500
            },
            {
              company_id: 2,
              company_name: 'XYZ Inc',
              trip_count: 3,
              total_earnings: 900
            }
          ]);
        });

        // Make the request
        const response = await request(driverApp).get('/api/report/driver/trips-by-company');

        // Assertions
        expect(response.status).to.equal(200);
        expect(reportController.getDriverTripsByCompany.called).to.be.true;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
      });
    });

    describe('GET /api/report/driver/trips-by-visa', () => {
      it('should call the getTripsByVisaNumber controller', async () => {
        // Mock the controller function
        reportController.getTripsByVisaNumber.callsFake((req, res) => {
          res.json([
            {
              visa_number: '1234-5678-9012-3456',
              trip_count: 3,
              total_amount: 900
            },
            {
              visa_number: '9876-5432-1098-7654',
              trip_count: 2,
              total_amount: 600
            }
          ]);
        });

        // Make the request
        const response = await request(driverApp).get('/api/report/driver/trips-by-visa');

        // Assertions
        expect(response.status).to.equal(200);
        expect(reportController.getTripsByVisaNumber.called).to.be.true;
        expect(response.body).to.be.an('array');
        expect(response.body).to.have.lengthOf(2);
      });
    });
  });
});
