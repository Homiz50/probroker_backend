const mongoose = require('mongoose');
const { createProperty } = require('../services/userListingsService');
const Property = require('../models/userListingmodel');

module.exports.userlisting = async (req, res) => {
    try {
        console.log('Received body:', req.body); // Debug log
        
        const propertyData = {
            ...req.body,
            images: []
        };
        // console.log(`propertyData by User: ${propertyData}`)
        // Handle media uploads if files are present
        if (req.files && req.files.length > 0) {
            propertyData.images = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype,
                type: file.mimetype.startsWith('video/') ? 'video' : 'image'
            }));
        }

        console.log('Property data to be saved:', propertyData); // Debug log
        const property = await createProperty(propertyData);
        res.status(201).json(property);
    } catch (error) {
        console.error('Error in userlisting controller:', error); // Debug log
        res.status(400).json({ error: error.message });
    }
};

module.exports.showingUserProperty = async (req, res) => {
    try {
        const properties = await Property.find().select('-images'); // Exclude images from the response
        res.status(200).json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching properties', error: error.message });
    }
}