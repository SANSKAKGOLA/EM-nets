const mongoose = require('mongoose');

const emergencyCaseSchema = new mongoose.Schema({
  fromFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientInfo: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    bloodType: String,
    medicalHistory: String,
    currentCondition: {
      type: String,
      required: true
    },
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      oxygenSaturation: Number
    }
  },
  attachments: [{
    name: String,
    path: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_transit', 'completed', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

emergencyCaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const EmergencyCase = mongoose.model('EmergencyCase', emergencyCaseSchema);

module.exports = EmergencyCase;