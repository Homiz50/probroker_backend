const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  httpMethod: String,
  requestUrl: String,
  description: String,
  requestParams: mongoose.Schema.Types.Mixed, // equivalent to Object
  requestPayload: String,
  responsePayload: String,
  responseStatus: Number,
  errorMessage: String,
  errorCode: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ApiLog', apiLogSchema);
