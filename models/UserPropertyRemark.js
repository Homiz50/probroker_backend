const mongoose = require('mongoose');

const userPropertyRemarkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  propId: {
    type: String,
    required: true
  },
  remark: {
    type: String
  },
  createdOn: {
    type: String // Java uses String instead of Date here
  }
}, {
  collection: 'User Property remark' // Exact match to Java's @Document annotation
});

module.exports = mongoose.model('UserPropertyRemark', userPropertyRemarkSchema);
