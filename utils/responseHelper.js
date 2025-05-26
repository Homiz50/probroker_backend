// file: utils/responseHelper.js
/**
 * Creates a standardized response object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} error - Error message, if any
 * @param {any} data - Response data
 * @returns {Object} Standardized response object
 */
const createResponse = (success, error, data) => {
  return {
    success,
    error,
    data
  };
};

module.exports = {
  createResponse
};