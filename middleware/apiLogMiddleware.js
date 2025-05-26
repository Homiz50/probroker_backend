
// file: middleware/apiLogMiddleware.js
const ApiLog = require('../models/ApiLog');

// Middleware to log API requests and responses
const logApiMiddleware = async (req, res, next) => {
  // Store original send method
  const originalSend = res.send;
  
  // Create a log object
  const log = {
    httpMethod: req.method,
    requestUrl: req.originalUrl,
    description: `${req.method} ${req.path} log`,
    requestParams: req.query,
    requestPayload: JSON.stringify(req.body),
    responsePayload: null,
    responseStatus: null,
    errorMessage: null,
    errorCode: null,
    createdAt: new Date()
  };
  
  // Override send method to capture response
  res.send = function (body) {
    // Save the response data
    log.responsePayload = body;
    log.responseStatus = res.statusCode;
    
    // Save log to database
    const apiLog = new ApiLog(log);
    apiLog.save().catch(err => console.error('Error saving API log:', err));
    
    // Call original send method
    return originalSend.call(this, body);
  };
  
  // Continue with request
  next();
};

module.exports = logApiMiddleware;