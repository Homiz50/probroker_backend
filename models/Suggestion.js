const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['UI', 'Feature', 'Bug', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'implemented', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
