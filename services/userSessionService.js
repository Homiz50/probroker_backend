// file: services/userSessionService.js
const mongoose = require('mongoose');
const UserSession = require('../models/UserSession');
const useragent = require('express-useragent');

class UserSessionService {
  /**
   * Track user session
   * @param {string} userId - User ID
   * @param {Object} registrationRequest - User registration request
   * @returns {Promise<Object>} - Saved session
   */
  async trackUserSession(userId, registrationRequest) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get user agent info from request (assuming it's available in request)
    const userAgentInfo = global.userAgentInfo || { source: 'Unknown' };
    
    // Create new session
    const session = new UserSession({
      userId,
      deviceInfo: {
        browser: userAgentInfo.browser || 'Unknown',
        os: userAgentInfo.os || 'Unknown',
        device: userAgentInfo.isMobile ? 'Mobile' : (userAgentInfo.isTablet ? 'Tablet' : 'Desktop'),
        userAgent: userAgentInfo.source || 'Unknown'
      },
      ipAddress: global.clientIp || 'Unknown',
      loginTime: new Date()
    });
    
    return await session.save();
  }
  
  /**
   * Get user sessions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of user sessions
   */
  async getUserSessions(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    return await UserSession.find({ userId }).sort({ loginTime: -1 });
  }
}

module.exports = UserSessionService;