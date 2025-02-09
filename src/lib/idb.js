/**
 * IndexedDB wrapper library for Cost Manager application
 * Implements Promise-based operations for IndexedDB
 */

class IDBWrapper {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database with custom name and version
   * @param {string} dbName - Database name
   * @param {number} version - Database version
   * @returns {Promise} - Resolves with the IDBWrapper instance
   */
  async openCostsDB(dbName, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('costs')) {
          const store = db.createObjectStore('costs', {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for querying
          store.createIndex('date', 'date');
          store.createIndex('category', 'category');
        }
      };
    });
  }

  /**
   * Initialize the database with default values (for backward compatibility)
   * @returns {Promise} - Resolves when DB is ready
   */
  async init() {
    return this.openCostsDB('CostManagerDB', 1);
  }

  /**
   * Add a new cost item
   * @param {Object} cost - Cost item {sum, category, description, date}
   * @returns {Promise} - Resolves with the ID of the new item
   */
  async addCost(cost) {
    return new Promise((resolve, reject) => {
      // Ensure date field exists
      if (!cost.date) {
        cost.date = new Date();
      }
      
      const transaction = this.db.transaction(['costs'], 'readwrite');
      const store = transaction.objectStore('costs');
      const request = store.add(cost);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get costs for specific month and year
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise} - Resolves with array of cost items
   */
  async getCostsByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['costs'], 'readonly');
      const store = transaction.objectStore('costs');
      const index = store.index('date');

      // Set time to start and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.openCursor(range);
      const costs = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const cost = cursor.value;
          cost.date = new Date(cost.date);
          costs.push(cost);
          cursor.continue();
        } else {
          resolve(costs);
        }
      };
    });
  }

  /**
   * Get costs grouped by category for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise} - Resolves with object of category totals
   */
  async getCostsByCategory(startDate, endDate) {
    const costs = await this.getCostsByDateRange(startDate, endDate);
    return costs.reduce((acc, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + cost.sum;
      return acc;
    }, {});
  }

  /**
   * Update an existing cost item
   * @param {Object} cost - Cost item with id to update
   * @returns {Promise} - Resolves when update is complete
   */
  async updateCost(cost) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['costs'], 'readwrite');
      const store = transaction.objectStore('costs');
      const request = store.put(cost);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete a cost item
   * @param {number} id - ID of cost to delete
   * @returns {Promise} - Resolves when deletion is complete
   */
  async deleteCost(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['costs'], 'readwrite');
      const store = transaction.objectStore('costs');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Create instance
const idb = new IDBWrapper();

// Handle both module and non-module environments
if (typeof exports !== 'undefined') {
  module.exports = idb;
} else if (typeof window !== 'undefined') {
  window.idb = idb;
}

// For ES modules
export default idb;

