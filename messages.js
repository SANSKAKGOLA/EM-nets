const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const EmergencyCase = require('../models/EmergencyCase');
const upload = require('../middleware/upload');

// Send message
router.post('/', auth, upload.array('attachments', 3), async (req, res) => {
  try {
    const { caseId, recipient, content } = req.body;
    
    // Verify case exists and user has access
    const emergencyCase = await EmergencyCase.findById(caseId);
    if (!emergencyCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (!emergencyCase.fromFacility.equals(req.user._id) && 
        !emergencyCase.toFacility.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Verify recipient exists and is part of the case
    if (recipient !== emergencyCase.fromFacility.toString() && 
        recipient !== emergencyCase.toFacility.toString()) {
      return res.status(400).json({ message: 'Invalid recipient' });
    }
    
    // Process attachments
    const attachments = req.files?.map(file => ({
      name: file.originalname,
      path: file.path.replace('public', ''),
      type: file.mimetype
    })) || [];
    
    // Create message
    const message = new Message({
      caseId,
      sender: req.user._id,
      recipient,
      content,
      attachments
    });
    
    await message.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get messages for a case
router.get('/case/:caseId', auth, async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.caseId);
    
    if (!emergencyCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Verify user has access to this case
    if (!emergencyCase.fromFacility.equals(req.user._id) && 
        !emergencyCase.toFacility.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    const messages = await Message.find({
      caseId: req.params.caseId,
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
    .populate('sender', 'facilityName')
    .populate('recipient', 'facilityName')
    .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Verify user is the recipient
    if (!message.recipient.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    
    message.isRead = true;
    await message.save();
    
    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;