const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Register a new facility
router.post('/register', async (req, res) => {
  try {
    const { facilityName, facilityType, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create user
    const user = new User({
      facilityName,
      facilityType,
      email,
      password,
      address: req.body.address,
      phone: req.body.phone,
      specialties: req.body.specialties || []
    });
    
    await user.save();
    
    // Create token
    const token = await user.generateAuthToken();
    
    res.status(201).json({ 
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login facility
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    
    res.json({ 
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

module.exports = router;