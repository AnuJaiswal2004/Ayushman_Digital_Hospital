# Quick Start Guide - Hospital Management MongoDB Backend

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup MongoDB

**Option A - Local MongoDB (Easiest for Development)**
```bash
# Already installed? Skip to Step 3
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: Download from mongodb.com
```

**Option B - MongoDB Atlas (Free Cloud)**
1. Go to https://cloud.mongodb.com
2. Sign up for free
3. Create a cluster (M0 free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string

### Step 3: Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env and set your MongoDB URI
# For local: MONGODB_URI=mongodb://localhost:27017/hospital_management
# For Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospital_management
```

### Step 4: Seed Database (Optional but Recommended)
```bash
npm run seed
```

This creates sample data including:
- Admin user (username: `admin`, password: `admin123`)
- Departments, staff, drugs, etc.

### Step 5: Start Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on: **http://localhost:5000**

## ✅ Test It Works

```bash
# Check if server is running
curl http://localhost:5000/api/health

# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get all patients
curl http://localhost:5000/api/patients
```

## 📁 Project Structure

```
mongodb-backend/
├── models/              # 23 Mongoose schemas
│   ├── Patient.js
│   ├── Visit.js
│   ├── Staff.js
│   └── ... (20 more)
├── routes/              # API endpoints
│   ├── auth.js         # Login/Register
│   ├── patient.js      # Patient CRUD
│   ├── visit.js        # Visit management
│   ├── staff.js        # Staff management
│   └── department.js   # Department management
├── config/
│   └── database.js     # MongoDB connection
├── server.js           # Express app setup
├── seed.js             # Sample data
├── package.json        # Dependencies
└── .env.example        # Configuration template
```

## 🔑 Default Credentials (After Seeding)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| dr.sharma | doctor123 | Doctor |
| nurse.anjali | nurse123 | Nurse |
| lab.suresh | lab123 | Lab Technician |
| pharm.ravi | pharm123 | Pharmacist |

## 📡 Key API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/:id/visits` - Get patient visits

### Visits
- `POST /api/visits` - Create new visit
- `GET /api/visits` - List all visits
- `GET /api/visits/today/all` - Today's visits
- `PUT /api/visits/:id/status` - Update visit status

### Staff & Departments
- `GET /api/staff` - List all staff
- `GET /api/departments` - List all departments
- `GET /api/departments/:id/staff` - Get department staff

## 🔧 Common Issues

**Issue**: MongoDB connection failed
```bash
# Solution: Make sure MongoDB is running
# For local MongoDB:
mongod

# Or check your connection string in .env
```

**Issue**: Port 5000 already in use
```bash
# Solution: Change port in .env
PORT=3001
```

**Issue**: bcrypt installation error
```bash
# Solution: Install build tools
# macOS: xcode-select --install
# Ubuntu: sudo apt-get install build-essential
# Windows: npm install --global windows-build-tools
```

## 🎯 Next Steps

1. **Integrate with Frontend**: Update your frontend `script.js` to call these APIs instead of localStorage
2. **Add More Routes**: Extend routes for lab orders, prescriptions, billing
3. **Add Authentication**: Protect routes with JWT middleware
4. **Add Validation**: Use express-validator for input validation
5. **Deploy**: Deploy to Heroku, Railway, or your preferred platform

## 📚 Documentation

Full documentation in `README.md` includes:
- Complete API reference
- All 23 model schemas
- Relationship diagrams
- Development guide
- Deployment instructions

## 💡 Pro Tips

- Use Postman or Insomnia to test APIs
- Enable MongoDB Compass to view your database visually
- Check `server.js` console logs for debugging
- Use `npm run dev` for development (auto-restart)
- Seed data is great for testing - re-run `npm run seed` anytime

---

**Need Help?** Check the full README.md for detailed documentation!
