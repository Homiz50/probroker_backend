
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DemoAccountsSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  number: {
    type: String,
    trim: true
  },
  activatedBy: {
    type: String
  },
  activeDays: {
    type: Number
  },
  status: {
    type: String
  },
  paymentStatus: {
    type: String
  },
  remark: {
    type: String
  },
  followupDate: {
    type: String
  },
  expiredDate: {
    type: Date
  },
  createdOn: {
    type: Date
  }
}, {
  collection: 'Demos Given' // Specify collection name to match Java @Document annotation
});

// Create index for expired demo accounts query
DemoAccountsSchema.index({ expiredDate: 1, status: 1 });

// Create index for number lookups
DemoAccountsSchema.index({ number: 1 });

module.exports = mongoose.model('DemoAccounts', DemoAccountsSchema);