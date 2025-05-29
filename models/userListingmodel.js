const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
    area: String,
    buildingName: String,
    cityName: String,
    contact: String,
    availabilityDate: Date,
    description: String,
    propertySize: String,
    rent: String,
    sqFeet: String,
    furnishedTypes: String,
    propertyTypes: String,
    categories: String,
    company: String,
    propertyType: String,
    ownarName: String,
    lister: {
        type: String,
        default: 'Anonymous'
    },
    images: [{
        data: Buffer,
        contentType: String,
        type: { type: String, enum: ['image', 'video'] }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if the model already exists before creating it
const Property = mongoose.model('UserListing', propertySchema);

module.exports = Property;