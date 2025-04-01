const { query } = require('./db');

class Account {
  // Create a new account for user
  static async createAccount(userId, accountType, initialBalance = 0.00, currency = 'USD') {
    try {
      const sql = `
        INSERT INTO accounts (user_id, account_type, balance, currency)
        VALUES (?, ?, ?, ?)
      `;
      
      const result = await query(sql, [userId, accountType, initialBalance, currency]);
      return result.insertId;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Get all accounts for a user
  static async getAccountsByUserId(userId) {
    try {
      const sql = 'SELECT * FROM accounts WHERE user_id = ?';
      return await query(sql, [userId]);
    } catch (error) {
      console.error('Error getting accounts:', error);
      throw error;
    }
  }

  // Update account balance
  static async updateBalance(accountId, newBalance) {
    try {
      const sql = 'UPDATE accounts SET balance = ? WHERE id = ?';
      return await query(sql, [newBalance, accountId]);
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }
}

module.exports = Account;