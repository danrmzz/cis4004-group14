const axios = require('axios');
// Alpha Vantage API URL and API key
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY; // Load from environment variables

// Helper function to convert company name to stock symbol
const getSymbolFromName = (name) => {
  const companySymbols = {
    'reliance industries': 'RELIANCE.BSE',
    'tata capital': 'TATACAPITAL.BSE',
    'apple': 'AAPL',
    'google': 'GOOG',
    // Add more company-name to symbol mappings as needed
  };
  return companySymbols[name.toLowerCase()] || null;  // Return symbol or null if not found
};

// Helper function to get data from the last month
const getLastMonthData = (timeSeriesData) => {
  // Get all available dates and sort them in descending order (newest first)
  const dates = Object.keys(timeSeriesData).sort().reverse();
  
  // Get current date and calculate date from 30 days ago
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);
  
  // Filter dates to include only those from the last 30 days
  const recentDates = dates.filter(dateStr => {
    const dateParts = dateStr.split('-');
    const date = new Date(
      parseInt(dateParts[0]),     // year
      parseInt(dateParts[1]) - 1, // month (0-indexed in JavaScript)
      parseInt(dateParts[2])      // day
    );
    return date >= oneMonthAgo;
  });
  
  // Create a new object with only the last month of data
  const lastMonthData = {};
  recentDates.forEach(date => {
    lastMonthData[date] = timeSeriesData[date];
  });
  
  return lastMonthData;
};

// Controller to fetch stock data from Alpha Vantage
const getStockData = async (req, res) => {
  let { symbol } = req.params; // Get stock symbol from URL parameters

  // Check if the input is a company name rather than a symbol
  if (!symbol.match(/^[A-Za-z0-9.]+$/)) {
    symbol = getSymbolFromName(symbol);
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company name or symbol.',
      });
    }
  }

  symbol = symbol.toUpperCase(); // Ensure the symbol is in uppercase
  
  console.log(`Fetching stock data for symbol: ${symbol}`);

  try {
    // Fetch stock data from Alpha Vantage API
    const response = await axios.get(ALPHA_VANTAGE_API_URL, {
      params: {
        function: 'TIME_SERIES_DAILY', // Fetch daily time series data
        symbol: symbol, // Stock symbol (e.g., RELIANCE.BSE)
        outputsize: 'full', // Retrieve all available data (full dataset)
        apikey: API_KEY, // Your API key
      },
    });

    // Log the entire response for debugging
    console.log('API Response Keys:', Object.keys(response.data));
    
    // Check for API error messages
    if (response.data['Error Message']) {
      console.error('Alpha Vantage API Error:', response.data['Error Message']);
      return res.status(400).json({
        success: false,
        message: response.data['Error Message'],
      });
    }
    
    // Check for information messages (often sent when rate limited)
    if (response.data['Information']) {
      console.warn('Alpha Vantage API Info:', response.data['Information']);
      return res.status(429).json({
        success: false,
        message: response.data['Information'],
      });
    }

    // Check if the response contains valid data
    if (response.data['Time Series (Daily)']) {
      const timeSeriesData = response.data['Time Series (Daily)'];
      console.log(`Received data for ${Object.keys(timeSeriesData).length} days`);
      
      // Get only last month of data
      const lastMonthData = getLastMonthData(timeSeriesData);
      console.log(`Filtered to ${Object.keys(lastMonthData).length} days from the last month`);
      
      return res.status(200).json({
        success: true,
        data: lastMonthData,
        metadata: response.data['Meta Data'] || {}
      });
    } else {
      console.error('Unexpected API response structure:', response.data);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch stock data. Unexpected API response structure.',
      });
    }
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching stock data from Alpha Vantage API.',
      error: error.message,
    });
  }
};

module.exports = { getStockData };