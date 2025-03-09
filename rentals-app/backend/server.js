// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const amqp = require('amqplib');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();

// Updated CORS configuration
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
    cb(null, 'uploads/');
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

// Updated Session Configuration
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
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: false, // Set to false for local development (http)
      sameSite: 'lax', // Ensure cookies are sent in cross-origin requests
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

// Updated Rental Schema to include category and pricePerHour
const rentalSchema = new mongoose.Schema({
  entityName: { type: String, required: true },
  category: { type: String, required: true },
  itemName: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
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

// RabbitMQ Connection
let channel;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('delivery_tracking', { durable: true });
    console.log('RabbitMQ connected and queue created');
  } catch (err) {
    console.warn('RabbitMQ connection failed, continuing without it:', err.message);
    channel = null;
  }
}
connectRabbitMQ();

// backend/server.js
app.post('/api/rentals', async (req, res) => {
  try {
    if (!req.session.renterId) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const { category, itemName, pricePerHour } = req.body;
    if (!category || !itemName || !pricePerHour) {
      return res.status(400).json({ message: 'Category, item name, and price per hour are required' });
    }

    const price = parseFloat(pricePerHour);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Price per hour must be a positive number' });
    }

    const rental = new Rental({
      entityName: req.session.entityName,
      category,
      itemName,
      pricePerHour: price,
      deliveryStatus: 'Pending',
    });
    await rental.save();

    // Send message to RabbitMQ
    if (channel) {
      const msg = JSON.stringify({ rentalId: rental._id, itemName, status: 'Pending' });
      channel.sendToQueue('delivery_tracking', Buffer.from(msg));
      console.log('Sent message to RabbitMQ:', msg);
    }

    res.status(201).json({ message: 'Rental created successfully', rental });
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({ message: 'Error creating rental: ' + error.message });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const renter = await Renter.findOne({ email });
    if (!renter || !(await bcrypt.compare(password, renter.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.session.renterId = renter._id;
    req.session.entityName = renter.entityName;
    res.status(200).json({ message: 'Login successful', renterId: renter._id });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout Endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Check Session Status
app.get('/api/check-session', (req, res) => {
  if (req.session.renterId) {
    res.status(200).json({ loggedIn: true, renterId: req.session.renterId, entityName: req.session.entityName });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// Get Rentals for Logged-in User
app.get('/api/rentals', async (req, res) => {
  try {
    if (!req.session.renterId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const rentals = await Rental.find({ entityName: req.session.entityName });
    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rentals' });
  }
});

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

    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(aadharNumber)) {
      return res.status(400).json({ message: 'Aadhar number must be a 12-digit number' });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must be a 10-digit number' });
    }

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