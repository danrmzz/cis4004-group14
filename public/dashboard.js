import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

let auth;
let currentUser = null;
let userAccounts = [];
let transactionsData = [];

// DOM Elements
const accountsSelector = document.getElementById("account-selector");
const accountsSummary = document.getElementById("accounts-summary");
const usernameElement = document.getElementById("username");
const dateRangeSelector = document.getElementById("date-range");

// Charts
let cashflowChart;
let balanceChart;
let transactionPieChart;
let accountsPieChart;

// Function to check authentication state
const checkAuthState = () => {
  if (!auth) {
    console.error("Auth is not initialized yet.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await updateUsername();
      await loadUserAccounts(user);
      await loadTransactionsData();
    } else {
      window.location.href = "index.html"; // Redirect if not logged in
    }
  });
};

// Fetch Firebase config from backend
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
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

    console.log("Firebase Initialized:", app);
    checkAuthState();
  })
  .catch(error => console.error('Error fetching Firebase config:', error));

// Update username
const updateUsername = async () => {
  const storedName = localStorage.getItem("username");
  
  if (storedName) {
    usernameElement.textContent = `Hello, ${storedName}!`;
  }
};

// Load user accounts
const loadUserAccounts = async (user) => {
  try {
    const response = await fetch(`/api/users/${user.uid}/accounts`);
    const data = await response.json();
    
    if (data.success && data.accounts) {
      userAccounts = data.accounts;
      renderAccountsSummary(data.accounts);
      populateAccountSelector(data.accounts);
      renderAccountsPieChart(data.accounts);
    } else {
      accountsSummary.innerHTML = '<div class="error-message">No accounts found.</div>';
    }
  } catch (error) {
    console.error('Error loading accounts:', error);
    accountsSummary.innerHTML = '<div class="error-message">Failed to load accounts.</div>';
  }
};

// Render accounts summary
const renderAccountsSummary = (accounts) => {
  if (!accounts || accounts.length === 0) {
    accountsSummary.innerHTML = '<div class="error-message">No accounts found.</div>';
    return;
  }
  
  let totalBalance = 0;
  const accountsHtml = accounts.map(account => {
    totalBalance += parseFloat(account.balance);
    return `
      <div class="account-item">
        <div class="account-name">${capitalizeFirstLetter(account.account_type)} Account</div>
        <div class="account-balance">${formatCurrency(account.balance, account.currency)}</div>
      </div>
    `;
  }).join('');
  
  accountsSummary.innerHTML = `
    <div class="account-item" style="background-color: #e8f4fc;">
      <div class="account-name">Total Balance</div>
      <div class="account-balance">${formatCurrency(totalBalance, 'USD')}</div>
    </div>
    ${accountsHtml}
  `;
};

// Populate account selector
const populateAccountSelector = (accounts) => {
  if (!accounts || accounts.length === 0) return;
  
  // Clear existing options (except "All Accounts")
  while (accountsSelector.options.length > 1) {
    accountsSelector.remove(1);
  }
  
  // Add account options
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${capitalizeFirstLetter(account.account_type)} (${formatCurrency(account.balance, account.currency)})`;
    accountsSelector.appendChild(option);
  });
};

// Load transaction data for charts
const loadTransactionsData = async () => {
  try {
    const selectedAccountId = accountsSelector.value;
    const days = parseInt(dateRangeSelector.value);
    
    // Fetch transactions for all accounts
    const allTransactions = [];
    
    if (selectedAccountId === 'all') {
      for (const account of userAccounts) {
        const response = await fetch(`/api/accounts/${account.id}/transactions`);
        const data = await response.json();
        
        if (data.success && data.transactions) {
          data.transactions.forEach(transaction => {
            transaction.account_type = account.account_type;
            transaction.currency = account.currency;
            transaction.account_id = account.id;
          });
          
          allTransactions.push(...data.transactions);
        }
      }
    } else {
      const response = await fetch(`/api/accounts/${selectedAccountId}/transactions`);
      const data = await response.json();
      
      if (data.success && data.transactions) {
        const account = userAccounts.find(a => a.id == selectedAccountId);
        
        if (account) {
          data.transactions.forEach(transaction => {
            transaction.account_type = account.account_type;
            transaction.currency = account.currency;
            transaction.account_id = account.id;
          });
          
          allTransactions.push(...data.transactions);
        }
      }
    }
    
    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    transactionsData = allTransactions.filter(transaction => {
      return new Date(transaction.date) >= cutoffDate;
    });
    
    // Sort by date
    transactionsData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Update charts
    updateCharts();
  } catch (error) {
    console.error('Error loading transaction data:', error);
  }
};

// Update all charts
const updateCharts = () => {
  updateCashflowChart();
  updateBalanceChart();
  updateTransactionPieChart();
};

// Update cashflow chart
const updateCashflowChart = () => {
  const ctx = document.getElementById('cashflow-chart').getContext('2d');
  
  // Group transactions by date
  const dateMap = {};
  transactionsData.forEach(transaction => {
    const date = new Date(transaction.date).toLocaleDateString();
    if (!dateMap[date]) {
      dateMap[date] = { deposits: 0, withdrawals: 0 };
    }
    
    if (transaction.transaction_type === 'deposit') {
      dateMap[date].deposits += parseFloat(transaction.amount);
    } else if (transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'fee') {
      dateMap[date].withdrawals += parseFloat(transaction.amount);
    }
  });
  
  // Convert to arrays for chart
  const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
  const deposits = dates.map(date => dateMap[date].deposits);
  const withdrawals = dates.map(date => dateMap[date].withdrawals);
  
  // Destroy existing chart if it exists
  if (cashflowChart) {
    cashflowChart.destroy();
  }
  
  // Create new chart
  cashflowChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Deposits',
          data: deposits,
          backgroundColor: '#2ecc71',
          borderColor: '#27ae60',
          borderWidth: 1
        },
        {
          label: 'Withdrawals',
          data: withdrawals,
          backgroundColor: '#e74c3c',
          borderColor: '#c0392b',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount (USD)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Income vs. Expenses'
        }
      }
    }
  });
};

// Update balance history chart
const updateBalanceChart = () => {
  const ctx = document.getElementById('balance-chart').getContext('2d');
  
  // Create balance history based on transactions
  const balanceHistory = {};
  
  // Initialize with starting balance (assuming 0)
  userAccounts.forEach(account => {
    const accountTransactions = transactionsData.filter(t => t.account_id == account.id);
    
    if (accountTransactions.length > 0) {
      // Sort by date (oldest first)
      accountTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate total transactions amount
      let totalTransactionsAmount = 0;
      accountTransactions.forEach(transaction => {
        if (transaction.transaction_type === 'deposit') {
          totalTransactionsAmount += parseFloat(transaction.amount);
        } else if (transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'fee') {
          totalTransactionsAmount -= parseFloat(transaction.amount);
        }
      });
      
      // Calculate starting balance (current balance minus all transaction effects)
      const startingBalance = parseFloat(account.balance) - totalTransactionsAmount;
      
      // Build balance history
      let runningBalance = startingBalance;
      accountTransactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        
        if (!balanceHistory[date]) {
          balanceHistory[date] = runningBalance;
        }
        
        if (transaction.transaction_type === 'deposit') {
          runningBalance += parseFloat(transaction.amount);
        } else if (transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'fee') {
          runningBalance -= parseFloat(transaction.amount);
        }
        
        balanceHistory[date] = runningBalance;
      });
    }
  });
  
  // Convert to arrays for chart
  const dates = Object.keys(balanceHistory).sort((a, b) => new Date(a) - new Date(b));
  const balances = dates.map(date => balanceHistory[date]);
  
  // Destroy existing chart if it exists
  if (balanceChart) {
    balanceChart.destroy();
  }
  
  // Create new chart
  balanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Balance',
          data: balances,
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: '#3498db',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Balance (USD)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Balance History'
        }
      }
    }
  });
};

// Update transaction pie chart
const updateTransactionPieChart = () => {
  const ctx = document.getElementById('transaction-pie-chart').getContext('2d');
  
  // Count transactions by type
  const typeCount = { 'deposit': 0, 'withdrawal': 0, 'transfer': 0, 'fee': 0 };
  
  transactionsData.forEach(transaction => {
    typeCount[transaction.transaction_type] += parseFloat(transaction.amount);
  });
  
  // Prepare data for chart
  const labels = Object.keys(typeCount).filter(type => typeCount[type] > 0).map(capitalizeFirstLetter);
  const data = Object.keys(typeCount).filter(type => typeCount[type] > 0).map(type => typeCount[type]);
  const backgroundColor = [
    '#2ecc71', // deposit - green
    '#e74c3c', // withdrawal - red
    '#3498db', // transfer - blue
    '#f39c12'  // fee - orange
  ];
  
  // Destroy existing chart if it exists
  if (transactionPieChart) {
    transactionPieChart.destroy();
  }
  
  // Create new chart
  transactionPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColor,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Transaction Types by Amount'
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
};

// Update accounts pie chart
const renderAccountsPieChart = (accounts) => {
  const ctx = document.getElementById('accounts-pie-chart').getContext('2d');
  
  if (!accounts || accounts.length === 0) return;
  
  // Prepare data for chart
  const labels = accounts.map(account => capitalizeFirstLetter(account.account_type));
  const data = accounts.map(account => parseFloat(account.balance));
  const backgroundColor = [
    '#3498db', // checking - blue
    '#2ecc71', // savings - green
    '#f39c12'  // investment - orange
  ];
  
  // Destroy existing chart if it exists
  if (accountsPieChart) {
    accountsPieChart.destroy();
  }
  
  // Create new chart
  accountsPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColor,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Balance Distribution by Account Type'
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
};

// Helper functions
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency 
  }).format(amount);
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Event listeners
accountsSelector.addEventListener('change', loadTransactionsData);
dateRangeSelector.addEventListener('change', loadTransactionsData);