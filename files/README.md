# Hospital Management System - MongoDB Database

Complete MongoDB database structure with Mongoose schemas for a Hospital Management System based on your data model.

## 📋 Table of Contents
- [Features](#features)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Models](#models)

## ✨ Features

- **23 Complete Mongoose Models** based on your database structure
- **Full CRUD API endpoints** for Patients, Visits, Staff, and Departments
- **Authentication & Authorization** with JWT
- **Password hashing** with bcrypt
- **Audit logging** for all user actions
- **Event tracking** for visit workflow
- **Automatic ID generation** for all entities
- **Database seeding** with sample data
- **Comprehensive indexes** for optimal query performance

## 🗄️ Database Schema

### Core Entities
- **Patient**: Patient demographics with ABHA ID integration
- **Visit**: Patient visits with workflow tracking
- **Department**: Hospital departments
- **Staff**: Medical and administrative staff
- **Counter**: Service counters for queue management

### Clinical Workflow
- **Vital**: Patient vital signs recording
- **Consultation**: Doctor consultations with notes
- **Prescription**: Medicine prescriptions
- **Lab Order/Sample/Result**: Complete lab workflow
- **Pharmacy Order**: Medication dispensing

### Financial
- **Bill**: Patient billing
- **Payment**: Payment transactions

### Supporting Systems
- **Drug & Inventory**: Medicine management
- **Document**: Medical documents storage
- **Queue Counter**: Real-time queue management
- **Event Log**: Visit timeline tracking
- **AI Decision**: AI-assisted workflow guidance
- **User Account**: System authentication
- **Audit Log**: Security and compliance tracking

## 🚀 Installation

### 1. Clone or Download Files

All model files are in the `/models` directory.

### 2. Install Dependencies

```bash
npm install
```

This will install:
- express
- mongoose
- dotenv
- bcrypt
- jsonwebtoken
- cors
- body-parser
- morgan
- uuid

### 3. Install MongoDB

**Option A: Local MongoDB**
```bash
# On macOS
brew install mongodb-community

# On Ubuntu
sudo apt-get install mongodb

# On Windows
# Download from https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string

## ⚙️ Configuration

### 1. Create `.env` file

```bash
cp .env.example .env
```

### 2. Edit `.env` with your settings

```env
# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/hospital_management

# For MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_management

PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this
```

### 3. Seed the Database (Optional)

```bash
npm run seed
```

This will populate your database with:
- 5 Departments
- 6 Staff members
- 4 Counters
- 5 Drugs with inventory
- 5 User accounts (including admin)
- 2 Sample patients

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

## 🎯 Usage

### Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

### Test the API

```bash
# Health check
curl http://localhost:5000/api/health

# Get all patients
curl http://localhost:5000/api/patients

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login          - Login user
POST   /api/auth/register       - Register new user
GET    /api/auth/me             - Get current user (requires token)
POST   /api/auth/logout         - Logout (audit only)
```

### Patients
```
GET    /api/patients            - Get all patients
GET    /api/patients/:id        - Get patient by ID
GET    /api/patients/abha/:id   - Get patient by ABHA ID
POST   /api/patients            - Create new patient
PUT    /api/patients/:id        - Update patient
DELETE /api/patients/:id        - Delete patient
GET    /api/patients/:id/visits - Get patient visits
```

### Visits
```
GET    /api/visits              - Get all visits (with filters)
GET    /api/visits/:id          - Get visit by ID
POST   /api/visits              - Create new visit
PUT    /api/visits/:id/status   - Update visit status
PUT    /api/visits/:id/bill     - Mark visit as billed
GET    /api/visits/:id/timeline - Get visit event timeline
GET    /api/visits/today/all    - Get today's visits
```

### Staff
```
GET    /api/staff               - Get all staff (with filters)
GET    /api/staff/:id           - Get staff by ID
POST   /api/staff               - Create new staff
PUT    /api/staff/:id           - Update staff
PUT    /api/staff/:id/deactivate - Deactivate staff
GET    /api/staff/department/:id - Get staff by department
```

### Departments
```
GET    /api/departments         - Get all departments
GET    /api/departments/:id     - Get department by ID
POST   /api/departments         - Create new department
PUT    /api/departments/:id     - Update department
DELETE /api/departments/:id     - Delete department
GET    /api/departments/:id/staff - Get department staff
```

## 📚 Models

All models are in the `/models` directory:

### Patient Model
```javascript
{
  patient_id: String (PK),
  name: String,
  phone: String,
  abha_id: String (unique),
  dob: Date,
  address: String,
  consent_for_notifications: Boolean,
  created_at: Date
}
```

### Visit Model
```javascript
{
  visit_id: String (PK),
  patient_id: String (FK -> Patient),
  token: String (unique),
  visit_type: Enum ['OPD', 'Emergency', 'Telemedicine', 'Follow-up'],
  created_at: Date,
  current_step: Enum [steps...],
  billed: Boolean
}
```

[See individual model files for complete schemas]

## 🔐 Authentication Flow

1. **Login**: POST to `/api/auth/login` with username/password
2. **Receive JWT Token**: Use this token for authenticated requests
3. **Add to Headers**: `Authorization: Bearer <token>`
4. **Access Protected Routes**: Token validates user identity

Example:
```javascript
const token = "your_jwt_token";
fetch('/api/visits', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## 📊 Database Relationships

```
Patient (1) -> (N) Visit
Visit (1) -> (N) Vital
Visit (1) -> (N) Consultation
Consultation (1) -> (N) Lab Order
Lab Order (1) -> (N) Lab Sample
Lab Order (1) -> (N) Lab Result
Consultation (1) -> (N) Prescription
Prescription (1) -> (N) Prescription Item
Drug (1) -> (N) Prescription Item
Drug (1) -> (N) Inventory
Visit (1) -> (1) Bill
Bill (1) -> (N) Payment
Department (1) -> (N) Staff
Staff (1) -> (N) Consultation
Visit (1) -> (N) Event Log
Visit (1) -> (N) AI Decision
Staff (1) <-> (1) User Account
User Account (1) -> (N) Audit Log
```

## 🛠️ Development

### Adding New Routes
1. Create route file in `/routes` directory
2. Import models you need
3. Define CRUD operations
4. Export router
5. Add to `server.js`

### Adding New Models
1. Create schema file in `/models` directory
2. Define schema with mongoose
3. Add indexes for performance
4. Export model
5. Add to `/models/index.js`

## 📝 Notes

- All IDs are auto-generated (PAT001, VIS000001, etc.)
- Passwords are automatically hashed using bcrypt
- Timestamps (createdAt, updatedAt) are automatic
- All foreign keys use string references
- Indexes are optimized for common queries

## 🤝 Contributing

Feel free to extend this structure with:
- Additional API endpoints
- More complex queries
- Real-time features with Socket.io
- File upload functionality
- Report generation
- Analytics dashboards

## 📄 License

ISC

---

**Created for Hospital Management System**
Based on your complete data model structure with 23 interconnected entities.
