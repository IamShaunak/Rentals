// routes/renterRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const Renter = require('../models/Renter');
const { validateRenterRegistration } = require('../middleware/validation');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, `renter-${uniqueSuffix}.${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Register a new renter
router.post('/register', upload.single('profileImage'), validateRenterRegistration, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phoneNumber, 
      address, 
      city, 
      state, 
      zipCode 
    } = req.body;

    // Check if renter already exists
    const existingRenter = await Renter.findOne({ email });
    if (existingRenter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new renter
    const newRenter = new Renter({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      profileImage: req.file ? `/uploads/profile-images/${req.file.filename}` : null
    });

    await newRenter.save();

    res.status(201).json({
      success: true,
      message: 'Renter registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

module.exports = router;