const Property = require('../models/userListingmodel');

// Service to create a new property
const createProperty = async (propertyData) => {
    try {
        console.log('Creating property with data:', propertyData); // Debug log
        
        // Validate required fields
        if (!propertyData.lister) {
            propertyData.lister = 'Anonymous'; // Set default if not provided
        }
        
        const property = new Property(propertyData);
        await property.save();
        
        console.log('Property created successfully:', property); // Debug log
        return property;
    } catch (error) {
        console.error('Error in createProperty service:', error); // Debug log
        throw new Error('Error creating property: ' + error.message);
    }
};

module.exports = {
    createProperty
};
