const mongoose = require('mongoose');

const deviceDetailsSchema = new mongoose.Schema({
  browser: String,
  os: String,
  device: String,
  userAgent: String
}, { _id: false });

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  deviceDetails: {
    type: deviceDetailsSchema
  },
  fingerprint: {
    type: String
  },
  loginTimes: [{
    type: Date
  }],
  createdOn: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'User Session' // Match the Java MongoDB collection name exactly
});

module.exports = mongoose.model('UserSession', userSessionSchema);
