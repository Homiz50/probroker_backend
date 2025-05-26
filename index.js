// file: index.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const userInfoMiddleware = require('./middleware/userInfoMiddleware');
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(userInfoMiddleware);

// Import routes
const userRoutes = require('./routes/userRoutes');

// Use routes
app.use('/cjidnvij/ceksfbuebijn/user', userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    data: {}
  });
});
// const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}`;

// Connect to MongoDB - Replace with your connection string
mongoose.connect("mongodb+srv://bhakodiyaprince05:prince.pb00@procluster.7asw1tr.mongodb.net/citynect", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;