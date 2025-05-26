// file: middleware/userInfoMiddleware.js
const useragent = require('express-useragent');

/**
 * Middleware to capture user agent and IP information
 */
const userInfoMiddleware = (req, res, next) => {
  // Parse user agent
  const source = req.headers['user-agent'];
  const userAgentInfo = useragent.parse(source);
  
  // Store in global for use in services
  global.userAgentInfo = userAgentInfo;
  
  // Get client IP address
  global.clientIp = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
  next();
};

module.exports = userInfoMiddleware;