const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmergencyCase = require('../models/EmergencyCase');
const User = require('../models/User');
const upload = require('../middleware/upload');

// Create a new emergency case
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { toFacility, patientInfo, priority } = req.body;
    
    // Verify recipient exists
    const recipient = await User.findById(toFacility);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient facility not found' });
    }
    
    // Process attachments
    const attachments = req.files?.map(file => ({
      name: file.originalname,
      path: file.path.replace('public', ''),
      type: file.mimetype
    })) || [];
    
    // Create case
    const emergencyCase = new EmergencyCase({
      fromFacility: req.user._id,
      toFacility,
      patientInfo: JSON.parse(patientInfo),
      priority,
      attachments
    });
    
    await emergencyCase.save();
    
    res.status(201).json(emergencyCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all cases for current facility
router.get('/', auth, async (req, res) => {
  try {
    const cases = await EmergencyCase.find({
      $or: [
        { fromFacility: req.user._id },
        { toFacility: req.user._id }
      ]
    })
    .populate('fromFacility', 'facilityName facilityType')
    .populate('toFacility', 'facilityName facilityType')
    .sort({ createdAt: -1 });
    
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get case details
router.get('/:id', auth, async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id)
      .populate('fromFacility', 'facilityName facilityType')
      .populate('toFacility', 'facilityName facilityType');
    
    if (!emergencyCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Verify user has access to this case
    if (!emergencyCase.fromFacility.equals(req.user._id) && 
        !emergencyCase.toFacility.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    res.json(emergencyCase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update case status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const emergencyCase = await EmergencyCase.findById(req.params.id);
    
    if (!emergencyCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Only recipient can update status
    if (!emergencyCase.toFacility.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    
    emergencyCase.status = status;
    await emergencyCase.save();
    
    res.json(emergencyCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add note to case
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const emergencyCase = await EmergencyCase.findById(req.params.id);
    
    if (!emergencyCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Verify user has access to this case
    if (!emergencyCase.fromFacility.equals(req.user._id) && 
        !emergencyCase.toFacility.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    
    emergencyCase.notes.push({
      text,
      createdBy: req.user._id
    });
    
    await emergencyCase.save();
    
    res.json(emergencyCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;