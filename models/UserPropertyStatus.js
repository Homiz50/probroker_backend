// file: models/UserPropertyStatus.js
const mongoose = require('mongoose');

const userPropertyStatusSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  propId: {
    type: String,
    required: true
  },
  status: {
    type: String // No enum applied because Java doesn't restrict
  },
  adminId: {
    type: String
  },
  isVerified: {
    type: Number // Integer equivalent
  },
  reviewedDate: {
    type: Date
  },
  createdOn: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'Property Staus' // Ensure exact match with Java @Document annotation
});

// Optional: Ensure unique (propId, userId) pair if needed
// userPropertyStatusSchema.index({ propId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserPropertyStatus', userPropertyStatusSchema);
