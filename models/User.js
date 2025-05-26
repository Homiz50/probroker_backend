// file: models/User.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  number: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isLocked: { 
    type: Boolean, 
    default: false 
  },
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  savedPropertyIds: [String],
  contactedPropertyIds: [String],
  limit: { 
    type: Number, 
    default: 10 
  },
  totalCount: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

userSchema.plugin(mongoosePaginate);


// ✅ Explicitly connect to 'Proeprty-Details' collection
module.exports = mongoose.model('User', userSchema, 'User');

// module.exports = mongoose.model('User', userSchema);