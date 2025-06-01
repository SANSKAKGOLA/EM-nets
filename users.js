const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all facilities (filter by type if provided)
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    
    if (type) {
      filter.facilityType = type;
    }
    
    // Exclude current user
    filter._id = { $ne: req.user._id };
    
    const facilities = await User.find(filter)
      .select('facilityName facilityType specialties availableBeds');
    
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get facility details
router.get('/:id', auth, async (req, res) => {
  try {
    const facility = await User.findById(req.params.id)
      .select('-password -tokens');
    
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    
    res.json(facility);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update facility profile
router.patch('/me', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'facilityName', 'address', 'phone', 'specialties', 'availableBeds'
    ];
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }
    
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;