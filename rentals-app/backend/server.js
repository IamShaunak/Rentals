// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|pdf/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
});

// Create Uploads Directory
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Atlas connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Renter Schema
const renterSchema = new mongoose.Schema({
  entityName: { type: String, required: true },
  pocName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  location: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Renter = mongoose.model('Renter', renterSchema);

// Rental Schema
const rentalSchema = new mongoose.Schema({
  entityName: { type: String, required: true },
  itemName: { type: String, required: true },
  deliveryStatus: { type: String, default: 'Pending' },
  trackingId: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const Rental = mongoose.model('Rental', rentalSchema);

// Customer Schema
const customerSchema = new mongoose.Schema({
  aadharNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  aadharDocumentPath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Customer = mongoose.model('Customer', customerSchema);

// Register, Login, Logout, Check Session, Rentals Endpoints (already in your server.js)
// ... [Previous endpoints remain unchanged]

// Customer Info Endpoint
app.post('/api/customer-info', upload.single('aadharDocument'), async (req, res) => {
  try {
    if (!req.session.renterId) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const { aadharNumber, name, contactNumber, location } = req.body;
    if (!aadharNumber || !name || !contactNumber || !location || !req.file) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate Aadhar Number (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(aadharNumber)) {
      return res.status(400).json({ message: 'Aadhar number must be a 12-digit number' });
    }

    // Validate Contact Number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must be a 10-digit number' });
    }

    // Simulate Aadhar document validation (mock)
    // In a real app, use OCR or an Aadhar API to extract and validate details
    const mockAadharData = {
      name: 'John Doe',
      contactNumber: '9876543210',
    };
    if (name !== mockAadharData.name || contactNumber !== mockAadharData.contactNumber) {
      return res.status(400).json({ message: 'Name or contact number does not match Aadhar document' });
    }

    const customer = new Customer({
      aadharNumber,
      name,
      contactNumber,
      location,
      aadharDocumentPath: req.file.path,
    });

    await customer.save();
    res.status(201).json({ message: 'Customer information submitted successfully' });
  } catch (error) {
    console.error('Error submitting customer info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));