// File: services/userService.js
const User = require('../models/User');
const PaidAccounts = require('../models/PaidAccounts');
const DemoAccounts = require('../models/DemoAccounts');
const UpdatePasswordRequest = require('../models/UpdatePasswordRequest');
const PropertyDetails = require('../models/PropertyDetails');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Schedule all cron jobs
const scheduleCronJobs = () => {
  // Expire demo accounts - every day at 22:00 (10:00 PM)
  cron.schedule('0 22 * * *', () => {
    expireDemoAccounts();
  });

  // Expire paid accounts - every day at 23:00 (11:00 PM)
  cron.schedule('0 23 * * *', () => {
    expirePaidAccounts();
  });

  // Reset login count - every day at 21:00 (9:00 PM)
  cron.schedule('0 21 * * *', () => {
    resetLoginCount();
  });

  // Reset wrong password limit - every day at midnight
  cron.schedule('0 0 * * *', () => {
    resetWrongpassLimit();
  });
};

/**
 * Expire demo accounts that have passed their expiration date
 */
const expireDemoAccounts = async () => {
  console.log("Demo account check API called");
  const currentDate = new Date();
  
  try {
    // Find all expired demo accounts that are still active
    const expiredAccounts = await DemoAccounts.find({
      expiredDate: { $lt: currentDate },
      status: "Active"
    });
    
    // Loop through and update each expired account
    for (const demoAccount of expiredAccounts) {
      // Update demo account status
      demoAccount.status = "Expired";
      await demoAccount.save();
      
      // Find and update associated user
      const user = await User.findById(demoAccount.userId);
      if (user && user.isPremium === 1) {
        user.isPremium = 0;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Error in expireDemoAccounts:", error);
  }
};

/**
 * Expire paid accounts that have passed their expiration date
 */
const expirePaidAccounts = async () => {
  console.log("Premium account check API called");
  const currentDate = new Date();
  
  try {
    // Find all expired paid accounts that are still active
    const expiredAccounts = await PaidAccounts.find({
      expiredDate: { $lt: currentDate },
      status: "Active"
    });
    
    // Loop through and update each expired account
    for (const paidAccount of expiredAccounts) {
      // Update paid account status
      paidAccount.status = "Expired";
      await paidAccount.save();
      
      // Find and update associated user
      const user = await User.findById(paidAccount.userId);
      if (user && user.isPremium === 1) {
        user.isPremium = 0;
        await user.save();
      }
    }
  } catch (error) {
    console.error("Error in expirePaidAccounts:", error);
  }
};

/**
 * Reset login count for premium users
 */
const resetLoginCount = async () => {
  console.log("Reset property count method running");
  
  try {
    // Find all premium users
    const premiumUsers = await User.find({ isPremium: 1 });
    
    const specificUserId = "67128ea2d6da233a1af20f30"; // The specific user ID
    
    // Update limits for each premium user
    for (const user of premiumUsers) {
      if (user._id.toString() === specificUserId) {
        user.limit = 25;
        user.wrongPassLimit = 10;
      } else {
        user.limit = 100;
        user.wrongPassLimit = 10;
      }
      
      await user.save();
    }
  } catch (error) {
    console.error("Error in resetLoginCount:", error);
  }
};

/**
 * Reset wrong password limit for all users
 */
const resetWrongpassLimit = async () => {
  console.log("Reset wrong pass limit method running");
  
  try {
    // Update all users to have wrongPassLimit = 10
    await User.updateMany({}, { $set: { wrongPassLimit: 10 } });
  } catch (error) {
    console.error("Error in resetWrongpassLimit:", error);
  }
};

// User related operations
/**
 * Login user with number and password
 * @param {string} number - User's phone number
 * @param {string} password - User's password
 * @returns {Promise<Object>} - User object if login successful
 */
const loginUser = async (number, password) => {
  try {
    // Find user by phone number
    console.log(number,password)
    const user = await User.findOne({ number });
    console.log(user)
    if (!user) {
      throw new Error("User with this number is not registered");
    }
    
    // Check if account is locked (wrongPassLimit <= 0)
    if (user.wrongPassLimit <= 0) {
      throw new Error("Account is locked. Please try again later.");
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Decrement wrongPassLimit and save
      user.wrongPassLimit -= 1;
      await user.save();
      
      throw new Error("Incorrect password");
    }
    
    // Return user if password matches
    return user;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - New user object
 */
const registerUser = async (userData) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ number: userData.number });
    
    if (existingUser) {
      throw new Error("User with this number already exists");
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password.trim(), salt);
    
    // Create new user
    const newUser = new User({
      companyName: userData.companyName.trim(),
      name: userData.name.trim(),
      number: userData.number.trim(),
      email: userData.email.trim(),
      address: userData.address.trim(),
      password: hashedPassword,
      isPremium: 0,
      limit: 0,
      wrongPassLimit: 10,
      createdOn: new Date()
    });
    
    // Save and return new user
    return await newUser.save();
    
  } catch (error) {
    throw error;
  }
};

/**
 * Save or unsave a property for a user
 * @param {string} userId - User ID
 * @param {string} propId - Property ID
 * @returns {Promise<string>} - Success message
 */
const savePropertyToUser = async (userId, propId) => {
  if (!userId || !userId.trim() || !propId || !propId.trim()) {
    throw new Error("Invalid user ID or property ID!");
  }
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error("User not found!");
    }
    
    if (!user.savedPropertyIds) {
      user.savedPropertyIds = [];
    }
    
    // Check if property is already saved
    const index = user.savedPropertyIds.indexOf(propId);
    
    if (index !== -1) {
      // Remove property
      user.savedPropertyIds.splice(index, 1);
      await user.save();
      return "Property removed from saved list successfully.";
    } else {
      // Add property
      user.savedPropertyIds.push(propId);
      await user.save();
      return "Property added to saved list successfully.";
    }
    
  } catch (error) {
    throw error;
  }
};

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User object
 */
const getUserById = async (userId) => {
  return await User.findById(userId);
};

// Property related operations
/**
 * Update the sqFt field for all properties
 * @returns {Promise<number>} - Number of updated properties
 */
const updateSquareFtField = async () => {
  try {
    const properties = await PropertyDetails.find();
    let modifiedCount = 0;
    
    for (const property of properties) {
      const squareFtString = property.squareFt;
      
      if (squareFtString && squareFtString.trim() !== '') {
        try {
          // Try to convert string to integer
          const squareFtInt = parseInt(squareFtString);
          
          if (!isNaN(squareFtInt)) {
            property.sqFt = squareFtInt;
            await property.save();
            modifiedCount++;
          }
        } catch (error) {
          console.error(`Failed to convert squareFt for property ID: ${property._id}`);
        }
      }
    }
    
    return modifiedCount;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Export contacted properties to JSON
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of property details
 */
const exportContactedPropertiesToJson = async (userId) => {
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user || !user.contactedPropertyIds || user.contactedPropertyIds.length === 0) {
      throw new Error("No contacted properties found for this user");
    }
    
    // Get properties
    const properties = await PropertyDetails.find({
      _id: { $in: user.contactedPropertyIds }
    });
    
    return properties;
    
  } catch (error) {
    throw error;
  }
};

// Demo account related operations
/**
 * Register or activate a demo account
 * @param {Object} demoAccountDTO - Demo account data
 * @returns {Promise<string>} - Success message
 */
const registerOrActivateDemoAccount = async (demoAccountDTO) => {
  try {
    // Check if user exists
    let user = await User.findOne({ number: demoAccountDTO.number });
    
    if (user) {
      // Update existing user
      user.isPremium = 1;
      user.limit = 50;
      user.wrongPassLimit = 10;
      await user.save();
    } else {
      // Create new user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoAccountDTO.password.trim(), salt);
      
      user = new User({
        companyName: demoAccountDTO.companyName,
        name: demoAccountDTO.name,
        number: demoAccountDTO.number,
        email: demoAccountDTO.email,
        address: demoAccountDTO.address,
        password: hashedPassword,
        isPremium: 1,
        limit: 50,
        wrongPassLimit: 10,
        createdOn: new Date()
      });
      
      await user.save();
    }
    
    // Create demo account
    const demoAccount = new DemoAccounts({
      userId: user._id,
      name: demoAccountDTO.name,
      number: demoAccountDTO.number,
      activatedBy: demoAccountDTO.activatedBy,
      activeDays: demoAccountDTO.activeDays,
      status: "Active",
      paymentStatus: "Pending",
      createdOn: new Date(),
      expiredDate: new Date(Date.now() + demoAccountDTO.activeDays * 24 * 60 * 60 * 1000)
    });
    
    await demoAccount.save();
    
    return `User ${user.name} is now active as a demo account.`;
    
  } catch (error) {
    console.error("Error registering or activating demo account:", error);
    throw new Error(`Failed to register or activate demo account: ${error.message}`);
  }
};

/**
 * Register or activate a demo account (version 2)
 * @param {Object} demoAccountDTO - Demo account data
 * @returns {Promise<string>} - Success message
 */
const registerOrActivateDemoAccountV2 = async (demoAccountDTO) => {
  try {
    const repeatDemo = demoAccountDTO.repeatDemo;
    const number = demoAccountDTO.number;
    
    // Check existing demo accounts
    const demoAccountsList = await DemoAccounts.find({ number });
    
    if (repeatDemo === "No Repeat Demo" && demoAccountsList.length > 0) {
      throw new Error("Demo account already exists for this number.");
    }
    
    // Find or create user
    let user = await User.findOne({ number });
    
    if (user) {
      // Update existing user
      user.isPremium = 1;
      user.limit = 50;
      user.wrongPassLimit = 10;
      
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoAccountDTO.password.trim(), salt);
      user.password = hashedPassword;
      
      await user.save();
    } else {
      // Create new user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoAccountDTO.password.trim(), salt);
      
      user = new User({
        companyName: demoAccountDTO.companyName,
        name: demoAccountDTO.name,
        number: number,
        email: demoAccountDTO.email,
        address: demoAccountDTO.address,
        password: hashedPassword,
        isPremium: 1,
        limit: 100,
        wrongPassLimit: 10,
        createdOn: new Date()
      });
      
      await user.save();
    }
    
    // Create demo account
    const demoAccount = new DemoAccounts({
      userId: user._id,
      name: demoAccountDTO.name,
      number: number,
      activatedBy: demoAccountDTO.activatedBy,
      activeDays: demoAccountDTO.activeDays,
      status: "Active",
      paymentStatus: "Pending",
      createdOn: new Date(),
      expiredDate: new Date(Date.now() + demoAccountDTO.activeDays * 24 * 60 * 60 * 1000)
    });
    
    await demoAccount.save();
    
    return `User ${user.name} is now active as a demo account.`;
    
  } catch (error) {
    console.error("Error registering or activating demo account:", error);
    throw error;
  }
};

// Paid account related operations
/**
 * Generate a unique order ID
 * @returns {string} - Order ID
 */
const generateOrderId = () => {
  return "order_" + uuidv4().replace(/-/g, "").substring(0, 14);
};

/**
 * Activate premium account
 * @param {Object} paidAccountsDTO - Paid account data
 * @returns {Promise<string>} - Success message
 */
const activatePremium = async (paidAccountsDTO) => {
  try {
    // Find user
    const user = await User.findOne({ number: paidAccountsDTO.number });
    
    if (!user) {
      throw new Error("User with the provided number does not exist.");
    }
    
    // Generate order ID
    const orderId = generateOrderId();
    
    // Update user
    user.limit = 50;
    user.isPremium = 1;
    user.wrongPassLimit = 10;
    
    // Create active plan details
    const expiredDate = new Date();
    expiredDate.setMonth(expiredDate.getMonth() + paidAccountsDTO.durationInMonth);
    
    user.activePlanDetails = {
      orderId: orderId,
      amount: paidAccountsDTO.amount,
      paidOn: new Date(),
      expiredOn: expiredDate
    };
    
    await user.save();
    
    // Update any existing demo accounts
    const demoAccountsList = await DemoAccounts.find({ number: paidAccountsDTO.number });
    
    for (const demoAccount of demoAccountsList) {
      demoAccount.paymentStatus = "Success";
      demoAccount.status = "Expired";
      await demoAccount.save();
    }
    
    // Create paid account
    const paidAccount = new PaidAccounts({
      userId: user._id,
      name: user.name,
      number: paidAccountsDTO.number,
      agentName: paidAccountsDTO.agentName,
      durationInMonth: paidAccountsDTO.durationInMonth,
      orderId: orderId,
      amount: paidAccountsDTO.amount,
      paymentMode: paidAccountsDTO.paymentMode,
      status: "Active",
      settlementStatus: paidAccountsDTO.settlementStatus,
      createdOn: new Date(),
      expiredDate: expiredDate
    });
    
    if (paidAccountsDTO.settlementStatus) {
      paidAccount.updatedBy = paidAccountsDTO.adminId;
      paidAccount.updatedOn = new Date();
    }
    
    await paidAccount.save();
    
    return `User ${user.name} has been upgraded to premium and the paid account is active.`;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Activate premium account (version 2)
 * @param {Object} paidAccountsDTO - Paid account data
 * @returns {Promise<string>} - Success message
 */
const activatePremiumV2 = async (paidAccountsDTO) => {
  try {
    // Generate order ID
    const orderId = generateOrderId();
    
    // Find or create user
    let user = await User.findOne({ number: paidAccountsDTO.number });
    
    if (!user) {
      // Create new user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(paidAccountsDTO.password.trim(), salt);
      
      user = new User({
        number: paidAccountsDTO.number,
        name: paidAccountsDTO.name,
        companyName: paidAccountsDTO.companyName,
        email: paidAccountsDTO.email,
        address: paidAccountsDTO.address,
        password: hashedPassword,
        createdOn: new Date()
      });
    }
    
    // Update user
    user.limit = 50;
    user.isPremium = 1;
    user.wrongPassLimit = 10;
    
    // Create active plan details
    const expiredDate = new Date();
    expiredDate.setMonth(expiredDate.getMonth() + paidAccountsDTO.durationInMonth);
    
    user.activePlanDetails = {
      orderId: orderId,
      amount: paidAccountsDTO.amount,
      paidOn: new Date(),
      expiredOn: expiredDate
    };
    
    await user.save();
    
    // Update any existing demo accounts
    const demoAccountsList = await DemoAccounts.find({ number: paidAccountsDTO.number });
    
    for (const demoAccount of demoAccountsList) {
      demoAccount.paymentStatus = "Success";
      demoAccount.status = "Expired";
      await demoAccount.save();
    }
    
    // Create paid account
    const paidAccount = new PaidAccounts({
      userId: user._id,
      name: user.name,
      number: paidAccountsDTO.number,
      agentName: paidAccountsDTO.agentName,
      durationInMonth: paidAccountsDTO.durationInMonth,
      orderId: orderId,
      paidTo: paidAccountsDTO.transferTO,
      amount: paidAccountsDTO.amount,
      paymentMode: paidAccountsDTO.paymentMode,
      status: "Active",
      settlementStatus: paidAccountsDTO.settlementStatus,
      createdOn: new Date(),
      expiredDate: expiredDate
    });
    
    if (paidAccountsDTO.settlementStatus) {
      paidAccount.updatedBy = paidAccountsDTO.adminId;
      paidAccount.updatedOn = new Date();
    }
    
    await paidAccount.save();
    
    return `User ${user.name} has been upgraded to premium and the paid account is active.`;
    
  } catch (error) {
    throw error;
  }
};

// Password related operations
/**
 * Update user password
 * @param {string} number - User's phone number
 * @param {string} newPassword - New password
 * @returns {Promise<string>} - Success message
 */
const updateUserPassword = async (number, newPassword) => {
  try {
    // Find user
    const user = await User.findOne({ number });
    
    if (!user) {
      throw new Error("User with this number not found");
    }
    
    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);
    
    user.password = hashedPassword;
    await user.save();
    
    return `Password updated successfully for user with number: ${number}`;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Update password with admin request
 * @param {Object} updatePasswordRequest - Password update request
 * @returns {Promise<string>} - Success message
 */
const updatePasswordWithAdmin = async (updatePasswordRequest) => {
  try {
    // Find user
    const user = await User.findOne({ number: updatePasswordRequest.number });
    
    if (!user) {
      throw new Error(`User not found with number: ${updatePasswordRequest.number}`);
    }
    
    // Hash and update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(updatePasswordRequest.password.trim(), salt);
    
    user.password = hashedPassword;
    user.wrongPassLimit = 10;
    await user.save();
    
    // Record password change
    const passwordChangeHistory = new UpdatePasswordRequest({
      userId: user._id,
      number: updatePasswordRequest.number,
      adminId: updatePasswordRequest.adminId,
      reason: updatePasswordRequest.reason.trim(),
      createdOn: new Date()
    });
    
    await passwordChangeHistory.save();
    
    return `Password updated successfully for user with ${updatePasswordRequest.number}`;
    
  } catch (error) {
    throw error;
  }
};

// Custom error classes
class UserAlreadyExistsException extends Error {
  constructor(message) {
    super(message);
    this.name = "UserAlreadyExistsException";
  }
}

class AccountLockedException extends Error {
  constructor(message) {
    super(message);
    this.name = "AccountLockedException";
  }
}

// Export all functions
module.exports = {
  // Cron jobs
  scheduleCronJobs,
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
  
  // Error classes
  UserAlreadyExistsException,
  AccountLockedException
};