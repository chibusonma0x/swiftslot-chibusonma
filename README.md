SWIFTSLOT - Booking System
A full-stack booking application where buyers can book vendors in 30-minute slots with mock payment processing. Built with conflict-free, idempotent, and UTC-safe architecture.

Tech Stack

Backend:
* Node.js 20+ with TypeScript
* Express.js
* Sequelize ORM with MySQL
* date-fns for timezone handling
  
Frontend:
* React with TypeScript
* Vite for build tooling
* Tailwind CSS for styling
* Zustand for state management
* React Router for navigation
  
Prerequisites
* Node.js 20+
* MySQL 8.0+
* npm or yarn
  
Setup Instructions
1. Clone Repository
   git clone hgit clone https://github.com/chibusonma0x/swiftslot_chibusonma.git
* cd swiftslot-chibusonma

3. Backend Setup
* cd api
* npm install

Create MySQL database:
* mysql -u root -p
* CREATE DATABASE swiftslot_chibusonma;
* exit;

Update database credentials in api/src/config/database.ts if needed:
* export const sequelize = new Sequelize({
  * database: 'swiftslot_chibusonma',
  * username: 'root',
  * password: 'your_password', // Add your MySQL password
  * host: 'localhost',
  * dialect: 'mysql',
    
  }); 

4. Frontend Setup
* cd ../web
* npm install

5. Run the Application
Start backend (from api/ directory):
npm run dev
Start frontend (from web/ directory):
npm run dev
The application will be available at:
* Frontend: http://localhost:5173
* Backend API: http://localhost:3000
  
API Endpoints
* GET /api/vendors - List all vendors
* GET /api/vendors/:id/availability?date=YYYY-MM-DD - Get available slots
* POST /api/bookings - Create booking (requires Idempotency-Key header)
* POST /api/payments/initialize - Initialize payment
* POST /api/payments/webhook - Process payment webhook
* GET /api/bookings/:id - Get booking details
  
Testing
Run the core functionality tests: 
Install dev dependencies
* cd api
* npm install --save-dev jest ts-jest @types/jest supertest @types/supertest ts-node
  
Configure Jest for TypeScript
* Create jest.config.js in api/:
* /** @type {import('ts-jest').JestConfigWithTsJest} 

* module.exports = {
  * preset: "ts-jest",
  * testEnvironment: "node",
  * testMatch: ["**/src/tests/**/*.test.ts"],
  * moduleFileExtensions: ["ts", "js", "json"],
    
  };

Update package.json
* "scripts": {
  "test": "jest", }
  
Run Tests-
From inside api/:
* npm test
  
This tests:
* Overlap prevention (concurrent booking attempts)
* Idempotency (duplicate requests with same key)
  
Key Features
* Conflict-free booking: Prevents double-booking with database constraints
* Idempotent API: Same request returns identical response
* UTC-safe: Proper timezone handling between Lagos time and UTC storage
* 2-hour buffer: Today's bookings must be at least 2 hours in advance
* Mock payment flow: Complete booking-to-payment simulation
* Responsive UI: Works on mobile and desktop
Database Schema
* vendors(id, name, timezone)
* bookings(id, vendor_id, buyer_id, start_time_utc, end_time_utc, status, created_at)
* booking_slots(id, booking_id, vendor_id, slot_start_utc) with unique constraint
* payments(id, booking_id, ref, status, raw_event_json)
* idempotency_keys(key, scope, response_hash, created_at)
Usage
1. Navigate to the application
2. Browse available vendors
3. Select a vendor to view their calendar
4. Choose a date and available time slot
5. Review booking details
6. Complete mock payment process
7. Receive booking confirmation
   
Troubleshooting
Database connection errors:
* Ensure MySQL is running
* Check database credentials in api/src/config/database.ts
* Verify database swiftslot_chibusonma exists
CORS errors:
* Backend runs on port 3000, frontend on 5173
* CORS is configured for localhost:5173
Missing tables:
* Tables are auto-created on server startup
* Check console logs for database sync messages


