const { query } = require('./db');

class Stock {
  // Add a stock to user's watchlist
  static async addToWatchlist(userId, symbol, companyName) {
    try {
      console.log(`Adding stock to watchlist: userId=${userId}, symbol=${symbol}, companyName=${companyName}`);
      
      const sql = `
        INSERT INTO stock_watchlist (user_id, symbol, company_name)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name)
      `;
      
      const result = await query(sql, [userId, symbol, companyName]);
      console.log(`Stock added to watchlist: insertId=${result.insertId}, affectedRows=${result.affectedRows}`);
      
      return result.insertId || result.affectedRows;
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      throw error;
    }
  }

  // Remove a stock from user's watchlist
  static async removeFromWatchlist(userId, symbol) {
    try {
      console.log(`Removing stock from watchlist: userId=${userId}, symbol=${symbol}`);
      
      const sql = 'DELETE FROM stock_watchlist WHERE user_id = ? AND symbol = ?';
      const result = await query(sql, [userId, symbol]);
      
      console.log(`Stock removed from watchlist: affectedRows=${result.affectedRows}`);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
      throw error;
    }
  }

  // Get user's watchlist
  static async getWatchlist(userId) {
    try {
      console.log(`Getting watchlist for userId=${userId}`);
      
      const sql = 'SELECT * FROM stock_watchlist WHERE user_id = ? ORDER BY date_added DESC';
      const result = await query(sql, [userId]);
      
      console.log(`Retrieved ${result.length} stocks from watchlist`);
      return result;
    } catch (error) {
      console.error('Error getting watchlist:', error);
      throw error;
    }
  }

  // Check if a stock exists in user's watchlist
  static async isInWatchlist(userId, symbol) {
    try {
      console.log(`Checking if stock is in watchlist: userId=${userId}, symbol=${symbol}`);
      
      const sql = 'SELECT COUNT(*) as count FROM stock_watchlist WHERE user_id = ? AND symbol = ?';
      const result = await query(sql, [userId, symbol]);
      
      const isInWatchlist = result[0].count > 0;
      console.log(`Stock in watchlist check: ${isInWatchlist}`);
      
      return isInWatchlist;
    } catch (error) {
      console.error('Error checking if stock is in watchlist:', error);
      throw error;
    }
  }
}

module.exports = Stock;