const Stock = require('../models/stockModel');
const User = require('../models/userModel');
const axios = require('axios');

// Helper function to check if a stock exists on AlphaVantage
const checkStockExists = async (symbol) => {
  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  console.log(`Checking if stock ${symbol} exists using API Key: ${API_KEY ? 'Available' : 'Missing'}`);
  
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    // If "Global Quote" is empty, the stock doesn't exist
    const exists = Object.keys(response.data['Global Quote'] || {}).length > 0;
    console.log(`Stock ${symbol} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error('Error checking stock:', error.message);
    return false;
  }
};

// Get stock info from AlphaVantage
const getStockInfo = async (symbol) => {
  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  console.log(`Fetching stock info for ${symbol} using API Key: ${API_KEY ? 'Available' : 'Missing'}`);
  
  try {
    console.log(`Fetching quote data for ${symbol}`);
    const quoteResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    console.log(`Fetching overview data for ${symbol}`);
    const overviewResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'OVERVIEW',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    console.log(`Data received for ${symbol}`);
    return {
      quote: quoteResponse.data['Global Quote'] || {},
      overview: overviewResponse.data || {}
    };
  } catch (error) {
    console.error(`Error getting stock info for ${symbol}:`, error.message);
    return { quote: {}, overview: {} };
  }
};

// Add stock to watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { firebaseUid, symbol } = req.body;
    
    console.log(`Adding ${symbol} to watchlist for Firebase UID: ${firebaseUid}`);
    
    if (!firebaseUid || !symbol) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Firebase UID and stock symbol are required'
      });
    }
    
    // Check if stock exists
    console.log(`Verifying stock symbol: ${symbol}`);
    const exists = await checkStockExists(symbol);
    if (!exists) {
      console.log(`Stock symbol not found: ${symbol}`);
      return res.status(404).json({
        success: false,
        message: 'Stock symbol not found or invalid'
      });
    }
    
    // Get user ID from firebase UID
    console.log(`Finding user for Firebase UID: ${firebaseUid}`);
    const user = await User.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      console.log(`User not found for Firebase UID: ${firebaseUid}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`Found user with ID: ${user.id}`);
    
    // Get stock info for company name
    console.log(`Getting company name for: ${symbol}`);
    const stockInfo = await getStockInfo(symbol);
    const companyName = stockInfo.overview.Name || symbol;
    
    // Add to watchlist
    console.log(`Adding ${symbol} (${companyName}) to watchlist for user ID: ${user.id}`);
    await Stock.addToWatchlist(user.id, symbol, companyName);
    
    console.log('Stock added to watchlist successfully');
    return res.status(200).json({
      success: true,
      message: 'Stock added to watchlist',
      stock: {
        symbol,
        companyName
      }
    });
  } catch (error) {
    console.error('Error in addToWatchlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding stock to watchlist',
      error: error.message
    });
  }
};

// Remove stock from watchlist
const removeFromWatchlist = async (req, res) => {
  try {
    const { firebaseUid, symbol } = req.params;
    
    console.log(`Removing ${symbol} from watchlist for Firebase UID: ${firebaseUid}`);
    
    if (!firebaseUid || !symbol) {
      console.log('Missing required parameters');
      return res.status(400).json({
        success: false,
        message: 'Firebase UID and stock symbol are required'
      });
    }
    
    // Get user ID from firebase UID
    console.log(`Finding user for Firebase UID: ${firebaseUid}`);
    const user = await User.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      console.log(`User not found for Firebase UID: ${firebaseUid}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`Found user with ID: ${user.id}`);
    
    // Remove from watchlist
    console.log(`Removing ${symbol} from watchlist for user ID: ${user.id}`);
    const removed = await Stock.removeFromWatchlist(user.id, symbol);
    
    if (!removed) {
      console.log(`Stock ${symbol} not found in watchlist`);
      return res.status(404).json({
        success: false,
        message: 'Stock not found in watchlist'
      });
    }
    
    console.log('Stock removed from watchlist successfully');
    return res.status(200).json({
      success: true,
      message: 'Stock removed from watchlist'
    });
  } catch (error) {
    console.error('Error in removeFromWatchlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing stock from watchlist',
      error: error.message
    });
  }
};

// Get user's watchlist
const getWatchlist = async (req, res) => {
  try {
    const { firebaseUid } = req.params;
    
    console.log(`Getting watchlist for Firebase UID: ${firebaseUid}`);
    
    if (!firebaseUid) {
      console.log('Missing firebaseUid in request');
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }
    
    // Get user ID from firebase UID
    console.log(`Finding user for Firebase UID: ${firebaseUid}`);
    const user = await User.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      console.log(`User not found for Firebase UID: ${firebaseUid}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`Found user with ID: ${user.id}`);
    
    // Get watchlist
    console.log(`Retrieving watchlist for user ID: ${user.id}`);
    const watchlist = await Stock.getWatchlist(user.id);
    console.log(`Retrieved ${watchlist.length} watchlist items`);
    
    // Get current data for each stock
    console.log('Fetching current data for watchlist items');
    const watchlistWithData = await Promise.all(
      watchlist.map(async (item) => {
        try {
          console.log(`Fetching data for stock: ${item.symbol}`);
          const stockInfo = await getStockInfo(item.symbol);
          return {
            ...item,
            currentPrice: stockInfo.quote['05. price'] || null,
            priceChange: stockInfo.quote['09. change'] || null,
            changePercent: stockInfo.quote['10. change percent'] || null
          };
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error.message);
          return item;
        }
      })
    );
    
    console.log('Watchlist data fetching completed');
    return res.status(200).json({
      success: true,
      watchlist: watchlistWithData
    });
  } catch (error) {
    console.error('Error in getWatchlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving watchlist',
      error: error.message
    });
  }
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist
};