const { query } = require('./db');
const Account = require('./accountModel');

class Transaction {
  // Create a new transaction
  static async createTransaction(accountId, amount, transactionType, description = '') {
    try {
      // Start a transaction to ensure data integrity
      const connection = await require('./db').pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Get current account balance
        const [account] = await connection.query('SELECT balance FROM accounts WHERE id = ?', [accountId]);
        
        if (!account.length) {
          throw new Error('Account not found');
        }
        
        let currentBalance = parseFloat(account[0].balance);
        let newBalance = currentBalance;
        
        // Update balance based on transaction type
        if (transactionType === 'deposit') {
          newBalance = currentBalance + parseFloat(amount);
        } else if (transactionType === 'withdrawal' || transactionType === 'fee') {
          newBalance = currentBalance - parseFloat(amount);
          // Check for insufficient funds
          if (newBalance < 0) {
            throw new Error('Insufficient funds');
          }
        }
        
        // Update account balance
        await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, accountId]);
        
        // Create transaction record
        const [result] = await connection.query(
          'INSERT INTO transactions (account_id, amount, transaction_type, description) VALUES (?, ?, ?, ?)',
          [accountId, amount, transactionType, description]
        );
        
        await connection.commit();
        connection.release();
        
        return {
          transactionId: result.insertId,
          newBalance: newBalance
        };
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Get all transactions for an account
  static async getTransactionsByAccountId(accountId) {
    try {
      const sql = 'SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC';
      return await query(sql, [accountId]);
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }
}

module.exports = Transaction;