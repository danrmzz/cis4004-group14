require('dotenv').config();
const express = require('express');
const path = require('path');
const stockController = require('./controllers/stockController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const { testConnection } = require('./models/db');
const { initializeTables } = require('./models/initializeDb');

// Initialize database connection
(async () => {
  const connected = await testConnection();
  if (connected) {
    await initializeTables();
  }
})();

// Import controllers
const userController = require('./controllers/userController');
const accountController = require('./controllers/accountController');
const transactionController = require('./controllers/transactionController');
const stockWatchlistController = require('./controllers/stockWatchlistController');

// User routes
app.post('/api/users', userController.createOrUpdateUser);
app.get('/api/users/:firebaseUid', userController.getUserByFirebaseUid);

// Account routes
app.post('/api/accounts', accountController.createAccount);
app.get('/api/users/:firebaseUid/accounts', accountController.getUserAccounts);

// Transaction routes
app.post('/api/transactions', transactionController.createTransaction);
app.get('/api/accounts/:accountId/transactions', transactionController.getAccountTransactions);

// Stock API route
app.get('/api/stock/:symbol', stockController.getStockData);

// Stock watchlist routes
app.get('/api/watchlist/:firebaseUid', stockWatchlistController.getWatchlist);
app.post('/api/watchlist', stockWatchlistController.addToWatchlist);
app.delete('/api/watchlist/:firebaseUid/:symbol', stockWatchlistController.removeFromWatchlist);

// For testing only - remove in production
app.get('/api/test-watchlist/:firebaseUid', async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    // Get user ID
    const user = await require('./models/userModel').getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    // Get watchlist directly from database
    const watchlist = await require('./models/stockModel').getWatchlist(user.id);
    
    return res.json({
      success: true,
      user: user,
      watchlist: watchlist
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.message
    });
  }
});

// API Route to send Firebase config to frontend
app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  });
});

// Serve index.html for the home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});