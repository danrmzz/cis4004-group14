import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

let auth;
let currentUser = null;
let selectedStock = null;

// DOM Elements
const stockSearch = document.getElementById('stock-search');
const searchButton = document.getElementById('search-button');
const stockResult = document.getElementById('stock-result');
const watchlistContainer = document.getElementById('watchlist');
const stockDetailsContainer = document.getElementById('stock-details');
const greetingElement = document.getElementById('greeting');

// Function to check authentication state
const checkAuthState = () => {
  if (!auth) {
    console.error("Auth is not initialized yet.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log(`User authenticated: ${user.uid}`);
      currentUser = user;
      updateGreeting();
      loadWatchlist();
    } else {
      console.log("User not authenticated, redirecting to login");
      window.location.href = "index.html"; // Redirect if not logged in
    }
  });
};

// Fetch Firebase config from backend
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    console.log("Firebase config received");
    // Initialize Firebase with fetched config
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId
    };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    console.log("Firebase Initialized");
    checkAuthState();
  })
  .catch(error => console.error('Error fetching Firebase config:', error));

// Update greeting
const updateGreeting = () => {
  const storedName = localStorage.getItem("username");
  if (storedName) {
    greetingElement.textContent = `Stock Market - Hello, ${storedName}!`;
    console.log(`Greeting updated for user: ${storedName}`);
  }
};

// Load user's watchlist
const loadWatchlist = async () => {
  console.log("Loading watchlist...");
  watchlistContainer.innerHTML = '<div class="loading">Loading your watchlist...</div>';
  
  if (!currentUser) {
    console.error("Cannot load watchlist: User not authenticated");
    watchlistContainer.innerHTML = '<div class="error-message">Please log in to view your watchlist.</div>';
    return;
  }
  
  console.log(`Fetching watchlist for user: ${currentUser.uid}`);
  
  try {
    const response = await fetch(`/api/watchlist/${currentUser.uid}`);
    console.log(`Watchlist API response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Watchlist API response data:", data);
    
    if (data.success && data.watchlist && data.watchlist.length > 0) {
      console.log(`Rendering ${data.watchlist.length} watchlist items`);
      renderWatchlist(data.watchlist);
    } else {
      console.log("Watchlist is empty or not found");
      watchlistContainer.innerHTML = '<div class="loading">Your watchlist is empty. Use the search to add stocks.</div>';
    }
  } catch (error) {
    console.error('Error loading watchlist:', error);
    watchlistContainer.innerHTML = `<div class="error-message">Failed to load watchlist: ${error.message}</div>`;
  }
};

// Render watchlist
const renderWatchlist = (watchlist) => {
  console.log("Rendering watchlist items:", watchlist);
  
  const watchlistHtml = watchlist.map(stock => {
    const priceChange = parseFloat(stock.priceChange || 0);
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    
    return `
      <div class="stock-card" data-symbol="${stock.symbol}">
        <div class="stock-info">
          <div class="stock-symbol">${stock.symbol}</div>
          <div class="stock-name">${stock.company_name || stock.symbol}</div>
        </div>
        <div class="stock-pricing">
          <div class="stock-price">${formatCurrency(stock.currentPrice || 0)}</div>
          <div class="price-change ${changeClass}">
            ${formatChange(stock.priceChange, stock.changePercent)}
          </div>
        </div>
        <div class="stock-action">
          <button class="remove" onclick="removeFromWatchlist('${stock.symbol}')">Remove</button>
        </div>
      </div>
    `;
  }).join('');
  
  watchlistContainer.innerHTML = watchlistHtml;
  
  // Add event listeners to stock cards
  document.querySelectorAll('.stock-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        const symbol = card.dataset.symbol;
        console.log(`Stock card clicked: ${symbol}`);
        showStockDetails(symbol);
      }
    });
  });
};

// Search for a stock
const searchStock = async () => {
  const symbol = stockSearch.value.trim().toUpperCase();
  
  if (!symbol) {
    stockResult.innerHTML = '<div class="error-message">Please enter a stock symbol</div>';
    return;
  }
  
  console.log(`Searching for stock: ${symbol}`);
  stockResult.innerHTML = '<div class="loading">Searching...</div>';
  
  try {
    const response = await fetch(`/api/stock/${symbol}`);
    console.log(`Stock search API response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Stock search API response:", data);
    
    if (data.success) {
      // Extract stock data
      const metadata = data.metadata || {};
      const timeSeriesData = data.data || {};
      
      // Get the most recent data point
      const dates = Object.keys(timeSeriesData).sort().reverse();
      console.log(`Available dates: ${dates.length}`);
      
      if (dates.length === 0) {
        throw new Error("No data available for this stock");
      }
      
      const latestDate = dates[0];
      const latestData = timeSeriesData[latestDate] || {};
      console.log(`Latest data from: ${latestDate}`);
      
      // Extract current price and previous close
      const currentPrice = parseFloat(latestData['4. close'] || 0);
      const previousClose = parseFloat(latestData['1. open'] || 0);
      const priceChange = currentPrice - previousClose;
      const changePercent = (priceChange / previousClose) * 100;
      
      const stockInfo = {
        symbol: symbol,
        name: metadata['2. Symbol'] || symbol,
        price: currentPrice,
        change: priceChange,
        changePercent: changePercent
      };
      
      console.log("Stock info prepared:", stockInfo);
      renderSearchResult(stockInfo);
      selectedStock = stockInfo;
    } else {
      console.error(`Stock search failed: ${data.message}`);
      stockResult.innerHTML = `<div class="error-message">${data.message || 'Stock not found'}</div>`;
    }
  } catch (error) {
    console.error('Error searching stock:', error);
    stockResult.innerHTML = `<div class="error-message">Error searching for stock: ${error.message}</div>`;
  }
};

// Render search result
const renderSearchResult = (stock) => {
  console.log("Rendering search result for:", stock.symbol);
  
  stockResult.innerHTML = `
    <div class="stock-card">
      <div class="stock-info">
        <div class="stock-symbol">${stock.symbol}</div>
        <div class="stock-name">${stock.name}</div>
      </div>
      <div class="stock-pricing">
        <div class="stock-price">${formatCurrency(stock.price)}</div>
        <div class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">
          ${formatChange(stock.change, stock.changePercent)}
        </div>
      </div>
      <div class="stock-action">
        <button id="add-to-watchlist">Add to Watchlist</button>
      </div>
    </div>
  `;
  
  // Add event listener to add button
  document.getElementById('add-to-watchlist').addEventListener('click', () => {
    console.log(`Add to watchlist clicked for: ${stock.symbol}`);
    addToWatchlist(stock.symbol);
  });
  
  // Show detailed view
  showStockDetails(stock.symbol);
};

// Add stock to watchlist
const addToWatchlist = async (symbol) => {
  console.log(`Adding ${symbol} to watchlist`);
  
  if (!currentUser) {
    console.error("Cannot add to watchlist: User not authenticated");
    alert("Please log in to add stocks to your watchlist");
    return;
  }
  
  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid: currentUser.uid,
        symbol: symbol
      }),
    });
    
    console.log(`Add to watchlist API response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Add to watchlist API response:", data);
    
    if (data.success) {
      alert(`${symbol} added to your watchlist!`);
      loadWatchlist();
    } else {
      alert(data.message || 'Failed to add stock to watchlist');
    }
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    alert(`Failed to add stock to watchlist: ${error.message}`);
  }
};

// Remove stock from watchlist
const removeFromWatchlist = async (symbol) => {
  console.log(`Removing ${symbol} from watchlist`);
  
  if (!currentUser) {
    console.error("Cannot remove from watchlist: User not authenticated");
    return;
  }
  
  if (confirm(`Remove ${symbol} from your watchlist?`)) {
    try {
      const response = await fetch(`/api/watchlist/${currentUser.uid}/${symbol}`, {
        method: 'DELETE'
      });
      
      console.log(`Remove from watchlist API response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Remove from watchlist API response:", data);
      
      if (data.success) {
        console.log(`${symbol} removed from watchlist`);
        loadWatchlist();
      } else {
        alert(data.message || 'Failed to remove stock from watchlist');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert(`Failed to remove stock from watchlist: ${error.message}`);
    }
  }
};

// Show detailed stock information
const showStockDetails = async (symbol) => {
  console.log(`Showing details for stock: ${symbol}`);
  stockDetailsContainer.innerHTML = '<div class="loading">Loading stock details...</div>';
  
  try {
    // Fetch stock data from your API
    const response = await fetch(`/api/stock/${symbol}`);
    console.log(`Stock details API response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Stock details API response:", data);
    
    if (data.success) {
      // Extract data
      const metadata = data.metadata || {};
      const timeSeriesData = data.data || {};
      
      // Get the most recent data point
      const dates = Object.keys(timeSeriesData).sort().reverse();
      console.log(`Available dates: ${dates.length}`);
      
      if (dates.length === 0) {
        throw new Error("No data available for this stock");
      }
      
      const latestDate = dates[0];
      const latestData = timeSeriesData[latestDate] || {};
      console.log(`Latest data from: ${latestDate}`);
      
      // Get previous day for comparison
      const previousDate = dates[1] || latestDate;
      const previousData = timeSeriesData[previousDate] || latestData;
      
      // Calculate change
      const currentPrice = parseFloat(latestData['4. close'] || 0);
      const previousClose = parseFloat(previousData['4. close'] || 0);
      const priceChange = currentPrice - previousClose;
      const changePercent = (priceChange / previousClose) * 100;
      
      // Calculate day range
      const dayHigh = parseFloat(latestData['2. high'] || 0);
      const dayLow = parseFloat(latestData['3. low'] || 0);
      
      // Calculate volume
      const volume = parseInt(latestData['5. volume'] || 0);
      
      // Render the detailed view
      renderStockDetails({
        symbol: symbol,
        name: metadata['2. Symbol'] || symbol,
        price: currentPrice,
        change: priceChange,
        changePercent: changePercent,
        dayHigh: dayHigh,
        dayLow: dayLow,
        volume: volume,
        date: new Date(latestDate)
      });
    } else {
      console.error(`Stock details failed: ${data.message}`);
      stockDetailsContainer.innerHTML = `<div class="error-message">${data.message || 'Failed to load stock details'}</div>`;
    }
  } catch (error) {
    console.error('Error loading stock details:', error);
    stockDetailsContainer.innerHTML = `<div class="error-message">Error loading stock details: ${error.message}</div>`;
  }
};

// Render detailed stock information
const renderStockDetails = (stock) => {
  console.log("Rendering stock details for:", stock.symbol);
  
  stockDetailsContainer.innerHTML = `
    <div class="stock-header">
      <div class="stock-title-area">
        <h2 class="stock-title">${stock.symbol}</h2>
        <div class="stock-subtitle">${stock.name}</div>
        <div class="stock-date">Last updated: ${formatDate(stock.date)}</div>
      </div>
      <div class="stock-price-area">
        <div class="stock-current-price">${formatCurrency(stock.price)}</div>
        <div class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">
          ${formatChange(stock.change, stock.changePercent)}
        </div>
      </div>
    </div>
    
    <div class="stock-stats">
      <div class="stat-item">
        <div class="stat-label">Day Range</div>
        <div class="stat-value">${formatCurrency(stock.dayLow)} - ${formatCurrency(stock.dayHigh)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Volume</div>
        <div class="stat-value">${formatNumber(stock.volume)}</div>
      </div>
    </div>
  `;
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

// Format change amount and percentage
const formatChange = (change, changePercent) => {
  if (change === undefined || changePercent === undefined) {
    return "N/A";
  }
  
  const prefix = change >= 0 ? '+' : '';
  return `${prefix}${parseFloat(change).toFixed(2)} (${prefix}${parseFloat(changePercent).toFixed(2)}%)`;
};

// Format large numbers
const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

// Format date
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Event listeners
searchButton.addEventListener('click', () => {
  console.log("Search button clicked");
  searchStock();
});

stockSearch.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    console.log("Enter key pressed in search box");
    searchStock();
  }
});

// Make functions available globally
window.removeFromWatchlist = removeFromWatchlist;
window.showStockDetails = showStockDetails;

console.log("Stocks.js loaded");