// file: routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { userlisting } = require('../controllers/userlistingControllers');
const {showingUserProperty} = require('../controllers/userlistingControllers')
const Property = require('../models/userListingmodel'); 
const upload = require('../middleware/uploadMiddleware');

// Middleware to log API calls
const logApiMiddleware = require('../middleware/apiLogMiddleware');
router.use(logApiMiddleware);

// Health check
router.get('/', UserController.healthCheck);

// Authentication routes
router.post('/v2/signin/vkjdbfuhe/nkdkjbed', UserController.register);
router.post('/v2/login/dljcnji/cekbjid', UserController.login);

// Property routes
router.post('/properties/filter/jkdbxcb/wdjkwbshuvcw/fhwjvshudcknsb', UserController.filterProperties);
router.post('/v2/properties/filter/jkdbxcb/wdjkwbshuvcw/fhwjvshudcknsb', UserController.filterPropertiesv2);
router.get('/counts/fjkbfhwb/fkjbwdiwhbdjwkfjwbj', UserController.getPropertyCountsByStatusAndType);
router.post('/save-property/ijddskjidns/cudhsbcuev', UserController.saveProperty);
router.post('/v2/contacted/kcndjiwnjn/jdnjsnja/cxlbijbijsb', UserController.contactPropertyV2);
router.post('/ckbwubuw/cjiwbucb/:id/status/cajbyqwvfydgqv', UserController.changePropertyStatus);
router.post('/v2/ckjshcigsuch/kjciushcuihn/:userId/saved-properties/ckjsiuc', UserController.getSavedProperties);
router.post('/dsvsdv/v2/casadyt/:userId/csauyv', UserController.getUserDetailsV2);
router.get('/export-contacted-properties/:userId/vijcbuhscb/csjibcgyswv', UserController.exportContactedPropertiesToJson);
router.post('/fkjdbv/submit-suggestion/eijfbidb', UserController.submitSuggestion);
router.post('/jcebduvhd/vehbvyubheud/property-remark', UserController.addOrUpdateRemark);

//User Listing Property Routes 

// Create a route to handle form submission with media uploads
router.post('/add/properties', upload.array('images', 10), userlisting);

// GET route to fetch all user listings
router.get('/add/properties',showingUserProperty);

module.exports = router;