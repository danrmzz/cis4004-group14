import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

let auth, db;
let currentUser = null;
let userAccounts = [];

// DOM Elements
const greetingElement = document.getElementById("greeting");
const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.getElementById("sidebar");
const checkbox = document.getElementById("checkbox");
const accountsList = document.getElementById("accounts-list");
const transactionsList = document.getElementById("transactions-list");
const accountSelector = document.getElementById("account-selector");
const depositAccountSelect = document.getElementById("deposit-account");
const withdrawAccountSelect = document.getElementById("withdraw-account");
const depositForm = document.getElementById("deposit-form");
const withdrawForm = document.getElementById("withdraw-form");
const newAccountBtn = document.getElementById("newAccountBtn");
const newAccountModal = document.getElementById("new-account-modal");
const newAccountForm = document.getElementById("new-account-form");
const closeModalBtn = document.querySelector(".close-modal");

// Function to check authentication state
const checkAuthState = () => {
  if (!auth) {
    console.error("Auth is not initialized yet.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await updateGreeting(user);
      await loadUserAccounts(user);
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
    db = getFirestore(app);

    console.log("Firebase Initialized:", app);
    checkAuthState(); // Now this function is defined before being called
  })
  .catch(error => console.error('Error fetching Firebase config:', error));

// Update greeting with username
const updateGreeting = async (user) => {
  if (!user) return;

  const storedName = localStorage.getItem("username");
  
  if (storedName) {
    greetingElement.textContent = `Welcome Back, ${storedName}!`;
  } else {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      localStorage.setItem("username", userData.name);
      greetingElement.textContent = `Welcome Back, ${userData.name}!`;
    } else {
      greetingElement.textContent = "Welcome Back!";
    }
  }
};

// Load user accounts
const loadUserAccounts = async (user) => {
  try {
    const response = await fetch(`/api/users/${user.uid}/accounts`);
    const data = await response.json();
    
    if (data.success && data.accounts) {
      userAccounts = data.accounts;
      renderAccounts(data.accounts);
      populateAccountSelectors(data.accounts);
    } else {
      accountsList.innerHTML = '<div class="error-message">No accounts found. Create a new account to get started.</div>';
    }
  } catch (error) {
    console.error('Error loading accounts:', error);
    accountsList.innerHTML = '<div class="error-message">Failed to load accounts. Please try again later.</div>';
  }
};

// Render accounts in the UI
const renderAccounts = (accounts) => {
  if (!accounts || accounts.length === 0) {
    accountsList.innerHTML = '<div class="error-message">No accounts found. Create a new account to get started.</div>';
    return;
  }
  
  accountsList.innerHTML = accounts.map(account => `
    <div class="account-card ${account.account_type}">
      <div class="account-type">${account.account_type}</div>
      <div class="account-balance">${formatCurrency(account.balance, account.currency)}</div>
      <div class="account-currency">${account.currency}</div>
    </div>
  `).join('');
};

// Format currency display
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency 
  }).format(amount);
};

// Populate account selectors
const populateAccountSelectors = (accounts) => {
  if (!accounts || accounts.length === 0) return;
  
  // Clear existing options (except default)
  while (accountSelector.options.length > 1) {
    accountSelector.remove(1);
  }
  
  // Clear deposit account select
  depositAccountSelect.innerHTML = '<option value="">Select Account</option>';
  
  // Clear withdraw account select
  withdrawAccountSelect.innerHTML = '<option value="">Select Account</option>';
  
  // Add account options
  accounts.forEach(account => {
    // For transaction filter
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.account_type} (${formatCurrency(account.balance, account.currency)})`;
    accountSelector.appendChild(option);
    
    // For deposit form
    const depositOption = document.createElement('option');
    depositOption.value = account.id;
    depositOption.textContent = `${account.account_type} (${formatCurrency(account.balance, account.currency)})`;
    depositAccountSelect.appendChild(depositOption);
    
    // For withdraw form
    const withdrawOption = document.createElement('option');
    withdrawOption.value = account.id;
    withdrawOption.textContent = `${account.account_type} (${formatCurrency(account.balance, account.currency)})`;
    withdrawAccountSelect.appendChild(withdrawOption);
  });
};

// Load transactions for an account
const loadTransactions = async (accountId) => {
  transactionsList.innerHTML = '<div class="loading">Loading transactions...</div>';
  
  try {
    if (accountId === 'all') {
      // Load all transactions (this endpoint would need to be created)
      const allTransactions = [];
      
      for (const account of userAccounts) {
        const response = await fetch(`/api/accounts/${account.id}/transactions`);
        const data = await response.json();
        
        if (data.success && data.transactions) {
          data.transactions.forEach(transaction => {
            transaction.account_type = account.account_type;
            transaction.currency = account.currency;
          });
          
          allTransactions.push(...data.transactions);
        }
      }
      
      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      renderTransactions(allTransactions);
    } else {
      const response = await fetch(`/api/accounts/${accountId}/transactions`);
      const data = await response.json();
      
      if (data.success) {
        const account = userAccounts.find(a => a.id == accountId);
        
        if (account && data.transactions) {
          data.transactions.forEach(transaction => {
            transaction.account_type = account.account_type;
            transaction.currency = account.currency;
          });
          
          renderTransactions(data.transactions);
        } else {
          renderTransactions([]);
        }
      } else {
        throw new Error('Failed to load transactions');
      }
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    transactionsList.innerHTML = '<div class="error-message">Failed to load transactions. Please try again later.</div>';
  }
};

// Render transactions in the UI
const renderTransactions = (transactions) => {
  if (!transactions || transactions.length === 0) {
    transactionsList.innerHTML = '<div class="loading">No transactions found.</div>';
    return;
  }
  
  transactionsList.innerHTML = transactions.map(transaction => `
    <div class="transaction-item">
      <div class="transaction-info">
        <div class="transaction-date">${formatDate(transaction.date)}</div>
        <div class="transaction-description">
          ${transaction.description || capitalizeFirstLetter(transaction.transaction_type)}
          ${transaction.account_type ? `(${capitalizeFirstLetter(transaction.account_type)})` : ''}
        </div>
      </div>
      <div class="transaction-amount ${transaction.transaction_type}">
        ${transaction.transaction_type === 'deposit' ? '+' : '-'}
        ${formatCurrency(transaction.amount, transaction.currency)}
      </div>
    </div>
  `).join('');
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to capitalize first letter
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Create a new transaction
const createTransaction = async (accountId, amount, transactionType, description) => {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        amount,
        transactionType,
        description
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reload user accounts to get updated balances
      await loadUserAccounts(currentUser);
      
      // Reload transactions if viewing the relevant account
      const selectedAccountId = accountSelector.value;
      if (selectedAccountId === 'all' || selectedAccountId == accountId) {
        loadTransactions(selectedAccountId);
      }
      
      return { success: true, message: 'Transaction completed successfully' };
    } else {
      return { success: false, message: data.message || 'Transaction failed' };
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, message: 'Transaction failed: Network error' };
  }
};

// Create a new account
const createAccount = async (accountType, initialBalance, currency) => {
  try {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid: currentUser.uid,
        accountType,
        initialBalance,
        currency
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reload user accounts
      await loadUserAccounts(currentUser);
      return { success: true, message: 'Account created successfully' };
    } else {
      return { success: false, message: data.message || 'Failed to create account' };
    }
  } catch (error) {
    console.error('Error creating account:', error);
    return { success: false, message: 'Failed to create account: Network error' };
  }
};

// Show status message
const showStatusMessage = (container, message, isSuccess) => {
  const existingMessage = container.querySelector('.status-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageElement = document.createElement('div');
  messageElement.className = `status-message ${isSuccess ? 'success-message' : 'error-message'}`;
  messageElement.textContent = message;
  
  // Insert at the top of the container
  container.insertBefore(messageElement, container.firstChild);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.remove();
    }
  }, 5000);
};

// Toggle sidebar
checkbox.addEventListener('change', () => {
  if (checkbox.checked) {
    sidebar.classList.add('open');
  } else {
    sidebar.classList.remove('open');
  }
});

// Handle account selection change
accountSelector.addEventListener('change', () => {
  loadTransactions(accountSelector.value);
});

// Handle deposit form submission
depositForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const accountId = depositAccountSelect.value;
  const amount = document.getElementById('deposit-amount').value;
  const description = document.getElementById('deposit-description').value;
  
  if (!accountId || !amount) {
    showStatusMessage(depositForm, 'Please select an account and enter an amount', false);
    return;
  }
  
  const result = await createTransaction(accountId, amount, 'deposit', description);
  
  showStatusMessage(depositForm, result.message, result.success);
  
  if (result.success) {
    // Reset form
    depositForm.reset();
  }
});

// Handle withdraw form submission
withdrawForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const accountId = withdrawAccountSelect.value;
  const amount = document.getElementById('withdraw-amount').value;
  const description = document.getElementById('withdraw-description').value;
  
  if (!accountId || !amount) {
    showStatusMessage(withdrawForm, 'Please select an account and enter an amount', false);
    return;
  }
  
  const result = await createTransaction(accountId, amount, 'withdrawal', description);
  
  showStatusMessage(withdrawForm, result.message, result.success);
  
  if (result.success) {
    // Reset form
    withdrawForm.reset();
  }
});

// Show new account modal
newAccountBtn.addEventListener('click', () => {
  newAccountModal.style.display = 'block';
});

// Close modal
closeModalBtn.addEventListener('click', () => {
  newAccountModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === newAccountModal) {
    newAccountModal.style.display = 'none';
  }
});

// Handle new account form submission
newAccountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const accountType = document.getElementById('account-type').value;
  const initialBalance = document.getElementById('initial-balance').value;
  const currency = document.getElementById('currency').value;
  
  const result = await createAccount(accountType, initialBalance, currency);
  
  if (result.success) {
    // Close modal
    newAccountModal.style.display = 'none';
    // Reset form
    newAccountForm.reset();
    // Show success message
    showStatusMessage(document.querySelector('.accounts-section'), result.message, true);
  } else {
    // Show error message inside modal
    showStatusMessage(newAccountForm, result.message, false);
  }
});

// Sidebar menu buttons
document.getElementById('dashboard-btn').addEventListener('click', () => {
  // Default view - already showing
  sidebar.classList.remove('open');
  checkbox.checked = false;
});

document.getElementById('transactions-btn').addEventListener('click', () => {
  // Set account selector to "All Accounts" and load all transactions
  accountSelector.value = 'all';
  loadTransactions('all');
  sidebar.classList.remove('open');
  checkbox.checked = false;
});


document.getElementById('stock-market-btn').addEventListener('click', () => {
  window.location.href = "stocks.html";
  sidebar.classList.remove('open');
  checkbox.checked = false;
});


// Logout function
const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("username");
    alert("You have been logged out successfully!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout failed:", error.message);
  }
};

// Attach logout event listener
if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}

// Initial load of transactions (default to "all")
accountSelector.value = 'all';