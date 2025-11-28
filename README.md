# Transport Company Application

A comprehensive application for managing transportation services between companies and drivers.

## Project Structure

- `client/` - React frontend application
- `server/` - Node.js backend application
- `test-reports/` - Generated test reports

## Setup

### Prerequisites

- Node.js (v16+)
- MySQL (v8+)
- XAMPP (optional, for local development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/TransportCompany.git
cd TransportCompany
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

3. Set up the database:
```bash
# Set up the main database
cd server
npm run setup-db

# Create test users (optional)
npm run create-test-users
cd ..
```

4. Configure environment variables:
   - Create a `.env` file in the `server` directory with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=transport_company
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=90d
   ```

## Running the Application

### Development Mode

```bash
# Start both client and server
npm start

# Start server only
npm run start:server

# Start client only
npm run start:client
```

### Production Mode

```bash
# Build the client
cd client
npm run build
cd ..

# Start the server
cd server
npm start
```

## Testing

### Setup Test Environment

```bash
# Set up the test database
npm run setup-test-db
```

### Running Tests

```bash
# Run all tests (server and client)
npm test

# Run server tests only
npm run test:server

# Run client tests only
npm run test:client

# Run integration tests
npm run test:integration
```

### Test Reports

After running tests, coverage reports will be generated in the `test-reports` directory:
- Server coverage: `test-reports/server/`
- Client coverage: `test-reports/client/`
- Integration test reports: `test-reports/integration/`

## Test Plan

See the [TEST_PLAN.md](./TEST_PLAN.md) file for a comprehensive testing strategy.

## Features

- User authentication (Admin, Company, Driver)
- Company trip management
- Driver availability management
- Trip request system
- Real-time notifications
- Rating system
- Comprehensive reporting

## License

This project is licensed under the ISC License.
