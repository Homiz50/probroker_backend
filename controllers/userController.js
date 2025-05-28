// file: controllers/userController.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const PropertyDetails = require('../models/PropertyDetails');
const ApiLog = require('../models/ApiLog');
const PaidAccounts = require('../models/PaidAccounts');
const UserPropertyStatus = require('../models/UserPropertyStatus');
const UserPropertyRemark = require('../models/UserPropertyRemark');
const Suggestion = require('../models/Suggestion');
const { createResponse } = require('../utils/responseHelper');
const UserSessionService = require('../services/userSessionService');
const PropertyService = require('../services/propertyService');
const {  scheduleCronJobs,
  expireDemoAccounts,
  expirePaidAccounts,
  resetLoginCount,
  resetWrongpassLimit,
  
  // User operations
  loginUser,
  registerUser,
  savePropertyToUser,
  getUserById,
  
  // Property operations
  updateSquareFtField,
  exportContactedPropertiesToJson,
  
  // Demo account operations
  registerOrActivateDemoAccount,
  registerOrActivateDemoAccountV2,
  
  // Paid account operations
  generateOrderId,
  activatePremium,
  activatePremiumV2,
  
  // Password operations
  updateUserPassword,
  updatePasswordWithAdmin,
  } = require('../services/userService');

// Initialize services
const userSessionService = new UserSessionService();
const propertyService = new PropertyService();
// const userService = new UserService();

// Helper functions
const maskPhoneNumber = (phoneNumber) => {
  if (phoneNumber && phoneNumber.length === 10) {
    return phoneNumber.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2");
  }
  return phoneNumber;
};

const maskEmail = (email) => {
  if (email && email.includes('@')) {
    const parts = email.split('@');
    const username = parts[0];
    const domain = parts[1];

    const maskedUsername = username.length > 2 ? username.substring(0, 2) + "****" : username;
    const maskedDomain = domain.length > 3 ? "****" + domain.substring(domain.length - 3) : domain;

    return maskedUsername + "@" + maskedDomain;
  }
  return email;
};

const userController = {
  // Health check endpoint
  healthCheck: (req, res) => {
    return res.status(200).send("this is User API's");
  },

  // User registration
  register: async (req, res) => {
    const registrationRequest = req.body;
    
    try {
      // Register the user
      const newUser = await registerUser(registrationRequest);
      
      // Hide password in response
      newUser.password = null;
      
      // Track user session
      await userSessionService.trackUserSession(newUser._id, registrationRequest);
      
      // Prepare response
      const response = {
        status: "success",
        message: "User registered successfully",
        data: newUser
      };
      
      return res.status(200).json(response);
    } catch (error) {
      let statusCode = 500;
      let response = {
        status: "error",
        message: "An error occurred during registration. Please try again later."
      };
      
      if (error.message === 'User already exists') {
        statusCode = 409; // Conflict
        response.message = error.message;
      } else if (error instanceof TypeError || error instanceof RangeError) {
        statusCode = 400; // Bad Request
        response.message = error.message;
      }
      
      return res.status(statusCode).json(response);
    }
  },

  // User login
  login: async (req, res) => {
    const { number, password } = req.body;
    
    try {
      const user = await loginUser(number, password);
      
      // Hide password in response
      user.password = null;
      
      // Track user session
      await userSessionService.trackUserSession(user._id, req.body);
      
      const response = {
        status: "success",
        message: "Login successful",
        data: user
      };
      
      return res.status(200).json(response);
    } catch (error) {
      let statusCode = 500;
      let response = {
        status: "error",
        message: "An error occurred during login."
      };
      
      if (error.message === 'Account is locked') {
        statusCode = 423; // Locked
        response.message = error.message;
      } else if (error.message === 'Invalid credentials') {
        statusCode = 401; // Unauthorized
        response.message = error.message;
      }
      console.log(response)
      return res.status(statusCode).json(response);
    }
  },

  // Filter properties
  filterProperties: async (req, res) => {
    try {
      let { page = 0, size = 10 } = req.query;
      const filterRequest = req.body;
      
      // Limit size to 25
      if (size > 25) {
        size = 25;
      }
      
      // Check if userId is provided
      if (!filterRequest.userId) {
        const response = {
          properties: [],
          currentPage: 0,
          totalItems: 0,
          totalPages: 0
        };
        return res.status(200).json(createResponse(true, "", response));
      }
      
      // Filter properties
      const filteredPropertiesPage = await propertyService.filterPropertiesSharingFlat(filterRequest, page, size);
      
      const response = {
        properties: filteredPropertiesPage.docs,
        currentPage: filteredPropertiesPage.page - 1, // Adjust for 0-based indexing
        totalItems: filteredPropertiesPage.totalDocs,
        totalPages: filteredPropertiesPage.totalPages
      };
      
      return res.status(200).json(createResponse(true, "", response));
    } catch (error) {
      return res.status(500).json(createResponse(false, "An error occurred while fetching properties", {}));
    }
  },

  // Filter properties v2
  // Filter properties v2
filterPropertiesv2: async (req, res) => {
  try {
    let { page = 0, size = 10 } = req.query;
    const filterRequest = req.body;

    // Enforce max size limit
    size = parseInt(size);
    if (size > 25) size = 25;

    page = parseInt(page);

    // Validate userId
    if (!filterRequest.userId) {
      return res.status(200).json({
        success: true,
        error: "",
        data: {
          properties: [],
          currentPage: 0,
          totalItems: 0,
          totalPages: 0
        }
      });
    }

    // Fetch paginated properties manually
    const result = await propertyService.filterPropertiesSharingFlatV2(filterRequest, page, size);
    // console.log(`this is Fillter ${result} + ${filterRequest} + ${page} + ${size}`)
    return res.status(200).json({
      success: true,
      error: "",
      data: {
        properties: result.properties,
        currentPage: result.currentPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.log("Catch")
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while fetching properties",
      data: {}
    });
  }
},

  // Get property counts by status and type
  getPropertyCountsByStatusAndType: async (req, res) => {
    try {
      const counts = await propertyService.getPropertyCountsByStatusAndType();
      return res.status(200).json(counts);
    } catch (error) {
      return res.status(500).json(createResponse(false, "Error getting property counts", {}));
    }
  },

  // Save property to user
  saveProperty: async (req, res) => {
    try {
      console.log('Received save property request:', req.body);
      const { userId, propId } = req.body;
      
      if (!userId || !propId) {
        console.log('Missing userId or propId:', { userId, propId });
        return res.status(400).json(createResponse(false, "Missing userId or propId", {}));
      }

      console.log('Calling savePropertyToUser with:', { userId, propId });
      const responseMessage = await savePropertyToUser(userId, propId);
      console.log('Save property response:', responseMessage);
      
      return res.status(200).json(createResponse(true, "", responseMessage));
    } catch (error) {
      console.error('Error in saveProperty:', error);
      if (error instanceof TypeError || error instanceof RangeError) {
        return res.status(400).json(createResponse(false, error.message, {}));
      }
      return res.status(500).json(createResponse(false, error.message, {}));
    }
  },

  // Contact property v2
  contactPropertyV2: async (req, res) => {
    try {
      console.log('Received contact request:', req.body);
      const { userId, propId } = req.body;

      if (!userId || !propId) {
        console.log('Missing userId or propId:', { userId, propId });
        return res.status(400).json(createResponse(false, "Missing userId or propId", {}));
      }

      console.log('Calling contactPropertyToUserV2 with:', { userId, propId });
      const property = await propertyService.contactPropertyToUserV2(userId, propId);
      console.log('Property details:', property);

      const response = {
        name: property.name,
        number: userId === "67128ea2d6da233a1af20f30" 
          ? `9${100000000 + Math.floor(Math.random() * 900000000)}` 
          : property.number
      };
      
      console.log('Sending response:', response);
      return res.status(200).json(createResponse(true, "", response));
    } catch (error) {
      console.error('Error in contactPropertyV2:', error);
      if (error instanceof TypeError || error instanceof RangeError) {
        return res.status(400).json(createResponse(false, error.message, {}));
      }
      return res.status(500).json(createResponse(false, error.message, {}));
    }
  },

  // Change property status
  changePropertyStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { newStatus, userId } = req.body;
      console.log(id + " User Id this is Status id " )
      console.log(newStatus +" New " , userId + "UserId")
      const updatedProperty = await propertyService.updatePropertyStatus(id, newStatus, userId);
      
      const response = {
        id: updatedProperty.propId,
        status: updatedProperty.status
      };
      
      return res.status(200).json(createResponse(true, "", response));
    } catch (error) {
      return res.status(500).json(createResponse(false, error.message, {}));
    }
  },
getSavedProperties: async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 0, size = 10 } = req.query;
    console.log("this is Save property")
    console.log(`user id is = ${userId}`)
    // Convert to integers
    page = parseInt(page);
    size = parseInt(size);
    
    const paginatedProperties = await propertyService.getSavedPropertiesV2(userId, page, size);
    // The service now returns { properties, currentPage, totalItems, totalPages }
    // So we can use it directly without transformation
    const response = {
      properties: paginatedProperties.properties,
      currentPage: paginatedProperties.currentPage,
      totalItems: paginatedProperties.totalItems,
      totalPages: paginatedProperties.totalPages
    };
    // console.log(`Response Of Save Property  = ${response}`)
    return res.status(200).json(createResponse(true, "", response));
  } catch (error) {
    return res.status(500).json(createResponse(false, `An error occurred while fetching properties: ${error.message}`, null));
  }
},
 // Get user details v2
  getUserDetailsV2: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await getUserById(userId);
      
      if (!user) {
        return res.status(404).json(createResponse(false, "User not found", {}));
      }
      
      // Mask sensitive information
      user.number = maskPhoneNumber(user.number);
      user.email = maskEmail(user.email);
      user.password = null;
      user.savedPropertyIds = null;
      user.contactedPropertyIds = null;
      user.limit = 0;
      user.totalCount = 0;
      
      // Get payment history
      const paymentHistory = await PaidAccounts.find({ userId: userId });
      
      const responseData = {
        user: user,
        paymentHistory: paymentHistory
      };
      
      return res.status(200).json(createResponse(true, "", responseData));
    } catch (error) {
      console.error(error);
      return res.status(500).json(createResponse(false, "An unexpected error occurred.", {}));
    }
  },

  // Export contacted properties
  exportContactedPropertiesToJson: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const properties = await exportContactedPropertiesToJson(userId);
      return res.status(200).json(properties);
    } catch (error) {
      if (error instanceof TypeError || error instanceof RangeError) {
        return res.status(404).json([]);
      }
      return res.status(500).json([]);
    }
  },

  // Submit suggestion
  submitSuggestion: async (req, res) => {
    try {
      const suggestion = req.body;
      
      await propertyService.saveSuggestion(suggestion);
      return res.status(200).send("Suggestion submitted successfully!");
    } catch (error) {
      return res.status(500).send(`Error while submitting the suggestion: ${error.message}`);
    }
  },

  // Add or update remark
  addOrUpdateRemark: async (req, res) => {
    try {
      const { userId, propId, remark } = req.body;
      
      if (!remark) {
        return res.status(400).json(createResponse(false, "Remark cannot be empty.", {}));
      }
      
      const updatedRemark = await propertyService.addOrUpdateRemark(propId, userId, remark);
      
      const response = {
        id: updatedRemark.id,
        propId: updatedRemark.propId,
        userId: updatedRemark.userId,
        remark: updatedRemark.remark,
        createdOn: updatedRemark.createdOn
      };
      
      return res.status(200).json(createResponse(true, "", response));
    } catch (error) {
      return res.status(500).json(createResponse(false, error.message, {}));
    }
  }
};

module.exports = userController;