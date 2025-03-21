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
const fs = require('fs');

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

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Multer File Filter for Images (JPEG and PNG)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG files are allowed'));
  }
};

// Multer Instance for Multiple File Uploads (for /api/rentals)
const uploadMultiple = multer({
  storage,
  fileFilter,
}).array('images', 3);

// Multer Instance for Single File Upload (for /api/customer-info)
const uploadSingle = multer({
  storage,
  fileFilter,
}).single('aadharDocument');

// Create Uploads Directory
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

// Updated Rental Schema
const rentalSchema = new mongoose.Schema({
  entityName: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String }, // Optional
  brand: { type: String, required: true },
  modelNumber: { type: String, required: true },
  stock: { type: Number, required: true, default: 1 },
  rented: { type: Number, default: 0 },//Add rented field
  deliveryStatus: { type: String, default: 'Pending' },
  imagePaths: [{ type: String }], // Array of image paths
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

// Customer Rental Request Schema
const rentalRequestSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
  itemName: { type: String, required: true }, // Should be modelNumber
  entityName: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerHour: { type: Number, required: true },
  rentalDurationHours: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  identityDocumentPath: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});
const RentalRequest = mongoose.model('RentalRequest', rentalRequestSchema);

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

// Add Rental Item Endpoint
app.post('/api/rentals', (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.log('Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log('Received request body:', req.body);
      console.log('Received files:', req.files);
      console.log('Session:', req.session);

      if (!req.session.renterId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
      }
      const { category, subcategory, brand, modelNumber, stock } = req.body;
      if (!category || !modelNumber || !stock || !brand) {
        return res.status(400).json({ message: 'Category, model number, stock, and brand are required' });
      }

      const stockValue = parseInt(stock);
      if (isNaN(stockValue) || stockValue <= 0) {
        return res.status(400).json({ message: 'Stock must be a positive number' });
      }

      const imagePaths = req.files ? req.files.map((file) => file.path) : [];

      const rental = new Rental({
        entityName: req.session.entityName,
        category,
        subcategory: subcategory || undefined,
        brand,
        modelNumber,
        stock: stockValue,
        deliveryStatus: 'Pending',
        imagePaths,
      });
      await rental.save();

      if (channel) {
        const msg = JSON.stringify({ rentalId: rental._id, modelNumber, status: 'Pending' });
        channel.sendToQueue('delivery_tracking', Buffer.from(msg));
        console.log('Sent message to RabbitMQ:', msg);
      }

      res.status(201).json({ message: 'Rental created successfully', rental });
    } catch (error) {
      console.error('Error creating rental:', error);
      res.status(500).json({ message: 'Error creating rental: ' + error.message });
    }
  });
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

// Fetch Rentals by Category for Logged-in User
app.get('/api/rentals/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['all', 'drums', 'guitars', 'keyboards', 'equipments', 'others'];

    const normalizedCategory = category === 'all' ? null : category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    if (normalizedCategory && !validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const query = {};
    if (normalizedCategory) {
      query.category = normalizedCategory;
    }

    const rentals = await Rental.find(query);
    res.status(200).json(rentals); // Return plain array
  } catch (error) {
    console.error('Error fetching rentals by category:', error);
    res.status(500).json({ message: 'Error fetching rentals: ' + error.message });
  }
});

app.get('/api/rentals/:id', async (req, res) => {
  try {
    if (!req.session.renterId) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    if (rental.entityName !== req.session.entityName) {
      return res.status(403).json({ message: 'Unauthorized to view this rental' });
    }
    res.status(200).json(rental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({ message: 'Error fetching rental: ' + error.message });
  }
});

app.put('/api/rentals/:id', (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.log('Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log('Received request body for update:', req.body);
      console.log('Received files for update:', req.files);

      if (!req.session.renterId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
      }

      const { category, subcategory, brand, modelNumber, stock } = req.body;
      if (!category || !modelNumber || !stock || !brand) {
        return res.status(400).json({ message: 'Category, model number, stock, and brand are required' });
      }

      const stockValue = parseInt(stock);
      if (isNaN(stockValue) || stockValue <= 0) {
        return res.status(400).json({ message: 'Stock must be a positive number' });
      }

      const rental = await Rental.findById(req.params.id);
      if (!rental) {
        return res.status(404).json({ message: 'Rental not found' });
      }

      if (rental.entityName !== req.session.entityName) {
        return res.status(403).json({ message: 'Unauthorized to edit this rental' });
      }

      const imagePaths = req.files ? req.files.map((file) => file.path) : rental.imagePaths;

      rental.category = category;
      rental.subcategory = subcategory || undefined;
      rental.brand = brand;
      rental.modelNumber = modelNumber;
      rental.stock = stockValue;
      rental.imagePaths = imagePaths;
      await rental.save();

      res.status(200).json({ message: 'Rental updated successfully', rental });
    } catch (error) {
      console.error('Error updating rental:', error);
      res.status(500).json({ message: 'Error updating rental: ' + error.message });
    }
  });
});

// customer-items ENDPOINT
app.get('/api/customer-items', async (req, res) => {
  try {
    // Example: Return some public data (e.g., available rentals)
    const publicRentals = await Rental.find({ deliveryStatus: 'Pending' }, { modelNumber: 1, category: 1, stock: 1 });
    res.status(200).json(publicRentals);
  } catch (error) {
    console.error('Error fetching customer items:', error);
    res.status(500).json({ message: 'Error fetching customer items: ' + error.message });
  }
});

// Checkout Endpoint
app.post('/api/rentals/checkout', async (req, res) => {
  try {
    const { rentalId, customerName, rentalDurationHours } = req.body;

    if (!rentalId || !customerName || !rentalDurationHours) {
      return res.status(400).json({ message: 'Rental ID, customer name, and rental duration are required' });
    }

    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    const totalPrice = rental.pricePerHour * parseInt(rentalDurationHours);
    if (isNaN(totalPrice) || totalPrice <= 0) {
      return res.status(400).json({ message: 'Invalid rental duration' });
    }

    const rentalRequest = new RentalRequest({
      customerName,
      rentalId,
      itemName: rental.modelNumber,
      entityName: rental.entityName,
      quantity: 1,
      pricePerHour: rental.pricePerHour,
      rentalDurationHours: parseInt(rentalDurationHours),
      totalPrice,
      status: 'Pending',
    });
    await rentalRequest.save();

    rental.deliveryStatus = 'Requested';
    await rental.save();

    if (channel) {
      const msg = JSON.stringify({
        rentalRequestId: rentalRequest._id,
        itemName: rental.modelNumber,
        status: 'Requested',
      });
      channel.sendToQueue('delivery_tracking', Buffer.from(msg));
      console.log('Sent message to RabbitMQ:', msg);
    }

    res.status(201).json({ message: 'Rental request submitted successfully', rentalRequest });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Error during checkout: ' + error.message });
  }
});

// Customer Info Endpoint
app.post('/api/customer-info', uploadSingle, async (req, res) => {
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