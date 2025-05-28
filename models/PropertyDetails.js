const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const propertyDetailsSchema = new mongoose.Schema({
  title: String,
  listedDate: Date,
  type: String,
  rent: String,
  rentValue: Number,
  bhk: String,
  furnishedType: String,
  squareFt: String,
  sqFt: Number,
  address: String,
  area: String,
  city: String,
  status: String,
  // amenities: String, // Stored as comma-separated in DB
  bathrooms: String,
  description: String,
  userType: String,
  unitType: String,
  propertyCurrentStatus: String,
  description1: String,
  key: String,
  name: String,
  number: String,
  isDeleted: Number,
  isSaved: Number,
  remark: String,
  createdOn: {
    type: Date,
    default: Date.now
  }
});
const filters = {
  areas: [],
  bhk: [],
  furnitureTypes: [],
  subType:[],
  minRent:[],
  maxRent:[],
  minsqFt:[],
  maxsqFt:[]
};

propertyDetailsSchema.plugin(mongoosePaginate);

// ✅ Explicitly connect to 'Proeprty-Details' collection
module.exports = mongoose.model('PropertyDetails', propertyDetailsSchema, 'Proeprty-Details' ,filters);
