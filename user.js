const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  facilityName: {
    type: String,
    required: [true, 'Please provide your facility name'],
    trim: true
  },
  facilityType: {
    type: String,
    required: [true, 'Please specify your facility type'],
    enum: ['rural_clinic', 'urban_hospital', 'specialty_center']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  address: {
    type: String,
    required: [true, 'Please provide your address']
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number']
  },
  specialties: {
    type: [String],
    default: []
  },
  availableBeds: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
  
  this.tokens = this.tokens.concat({ token });
  await this.save();
  
  return token;
};

// Remove sensitive data from user object
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  
  delete userObject.password;
  delete userObject.tokens;
  
  return userObject;
};

// Find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Unable to login');
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;