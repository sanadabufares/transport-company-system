const sinon = require('sinon');
const { expect } = require('chai');
const reportController = require('../../controllers/report');
const Trip = require('../../models/trip');
const Company = require('../../models/company');
const Driver = require('../../models/driver');

describe('Report Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all stubs
    sinon.restore();

    // Mock request and response objects
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 1, role: 'company' }
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe('getCompanyTripsByDate', () => {
    it('should return trips by date range for a company', async () => {
      // Setup
      req.query = { start_date: '2025-01-01', end_date: '2025-01-31' };
      
      const mockTrips = [
        { id: 1, company_id: 1, price: '100.00', trip_date: '2025-01-05' },
        { id: 2, company_id: 1, price: '150.00', trip_date: '2025-01-10' }
      ];
      
      sinon.stub(Trip, 'getByDateRange').resolves(mockTrips);
      
      // Execute
      await reportController.getCompanyTripsByDate(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('reportTitle').that.includes('2025-01-01 to 2025-01-31');
      expect(res.json.firstCall.args[0]).to.have.property('trips').that.deep.equals(mockTrips);
      expect(res.json.firstCall.args[0]).to.have.property('totalTrips', 2);
      expect(res.json.firstCall.args[0]).to.have.property('totalRevenue', 250);
    });

    it('should return 400 if start_date or end_date is missing', async () => {
      // Setup
      req.query = { start_date: '2025-01-01' }; // Missing end_date
      
      // Execute
      await reportController.getCompanyTripsByDate(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Please provide start_date and end_date' })).to.be.true;
    });
  });

  describe('getDriverTripsByDate', () => {
    it('should return trips by date range for a driver', async () => {
      // Setup
      req.user = { id: 2, role: 'driver' };
      req.query = { start_date: '2025-01-01', end_date: '2025-01-31' };
      
      const mockTrips = [
        { id: 1, driver_id: 1, price: '80.00', trip_date: '2025-01-05' },
        { id: 2, driver_id: 1, price: '120.00', trip_date: '2025-01-10' }
      ];
      
      sinon.stub(Trip, 'getByDateRange').resolves(mockTrips);
      
      // Execute
      await reportController.getDriverTripsByDate(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('reportTitle').that.includes('2025-01-01 to 2025-01-31');
      expect(res.json.firstCall.args[0]).to.have.property('trips').that.deep.equals(mockTrips);
      expect(res.json.firstCall.args[0]).to.have.property('totalTrips', 2);
      expect(res.json.firstCall.args[0]).to.have.property('totalEarnings', 200);
    });

    it('should return 400 if start_date or end_date is missing', async () => {
      // Setup
      req.user = { id: 2, role: 'driver' };
      req.query = { end_date: '2025-01-31' }; // Missing start_date
      
      // Execute
      await reportController.getDriverTripsByDate(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Please provide start_date and end_date' })).to.be.true;
    });
  });

  describe('getTripsByVisaNumber', () => {
    it('should return trips by visa number for a company', async () => {
      // Setup
      req.user = { id: 1, role: 'company' };
      req.query = { visa_number: '1234-5678-9012-3456' };
      
      const mockTrips = [
        { id: 1, company_id: 1, driver_id: 1, price: '100.00', visa_number: '1234-5678-9012-3456' },
        { id: 2, company_id: 1, driver_id: 2, price: '150.00', visa_number: '1234-5678-9012-3456' }
      ];
      
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Trip, 'getByVisaNumber').resolves(mockTrips);
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      
      // Execute
      await reportController.getTripsByVisaNumber(req, res);
      
      // Assert
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('reportTitle').that.includes('1234-5678-9012-3456');
      expect(res.json.firstCall.args[0]).to.have.property('trips').that.deep.equals(mockTrips);
      expect(res.json.firstCall.args[0]).to.have.property('totalTrips', 2);
    });

    it('should return 400 if visa_number is missing', async () => {
      // Setup
      req.query = {}; // Missing visa_number
      
      // Execute
      await reportController.getTripsByVisaNumber(req, res);
      
      // Assert
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Please provide visa_number' })).to.be.true;
    });

    it('should return 404 if no trips found with the visa number', async () => {
      // Setup
      req.query = { visa_number: '9999-9999-9999-9999' };
      
      sinon.stub(Trip, 'getByVisaNumber').resolves([]);
      
      // Execute
      await reportController.getTripsByVisaNumber(req, res);
      
      // Assert
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'No trips found with this visa number' })).to.be.true;
    });

    it('should return 403 if company is not authorized', async () => {
      // Setup
      req.user = { id: 1, role: 'company' };
      req.query = { visa_number: '1234-5678-9012-3456' };
      
      const mockTrips = [
        { id: 1, company_id: 2, driver_id: 1, price: '100.00', visa_number: '1234-5678-9012-3456' }
      ];
      
      const mockCompany = { id: 1, user_id: 1 };
      
      sinon.stub(Trip, 'getByVisaNumber').resolves(mockTrips);
      sinon.stub(Company, 'findByUserId').resolves(mockCompany);
      
      // Execute
      await reportController.getTripsByVisaNumber(req, res);
      
      // Assert
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Unauthorized' })).to.be.true;
    });
  });
});
