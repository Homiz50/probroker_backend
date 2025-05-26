
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UpdatePasswordRequestSchema = new Schema({
  userId: {
    type: String
  },
  number: {
    type: String,
    trim: true
  },
  password: {
    type: String
  },
  adminId: {
    type: String
  },
  reason: {
    type: String,
    trim: true
  },
  createdOn: {
    type: Date
  }
}, { 
  collection: 'password update request' // Match the Java @Document collection name exactly
});

// Add getter and setter functionality similar to Java entity
UpdatePasswordRequestSchema.methods = {
  // Getter methods
  getId: function() {
    return this._id;
  },
  getUserId: function() {
    return this.userId;
  },
  getNumber: function() {
    return this.number;
  },
  getPassword: function() {
    return this.password;
  },
  getAdminId: function() {
    return this.adminId;
  },
  getReason: function() {
    return this.reason;
  },
  getCreatedOn: function() {
    return this.createdOn;
  },
  
  // Setter methods
  setUserId: function(userId) {
    this.userId = userId;
  },
  setNumber: function(number) {
    this.number = number;
  },
  setPassword: function(password) {
    this.password = password;
  },
  setAdminId: function(adminId) {
    this.adminId = adminId;
  },
  setReason: function(reason) {
    this.reason = reason;
  },
  setCreatedOn: function(createdOn) {
    this.createdOn = createdOn;
  }
};

module.exports = mongoose.model('UpdatePasswordRequest', UpdatePasswordRequestSchema);