// file: models/PaidAccounts.js
const mongoose = require('mongoose');

const paidAccountsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  orderId: {
    type: String
  },
  name: {
    type: String
  },
  number: {
    type: String
  },
  agentName: {
    type: String
  },
  amount: {
    type: String // Kept as String to match Java model exactly
  },
  durationInMonth: {
    type: Number
  },
  paymentMode: {
    type: String
  },
  paidTo: {
    type: String
  },
  status: {
    type: String
  },
  settlementStatus: {
    type: Boolean
  },
  updatedBy: {
    type: String
  },
  remark: {
    type: String
  },
  updatedOn: {
    type: Date
  },
  expiredDate: {
    type: Date
  },
  createdOn: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'Paid Accounts' // Ensure collection name matches Java class annotation
});

module.exports = mongoose.model('PaidAccounts', paidAccountsSchema);
