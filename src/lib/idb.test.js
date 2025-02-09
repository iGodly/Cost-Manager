/**
 * IndexedDB wrapper library for Cost Manager application
 * Non-module version for testing
 */

class IDBWrapper {
  constructor() {
    this.db = null;
  }

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
          store.createIndex('date', 'date');
          store.createIndex('category', 'category');
        }
      };
    });
  }

  async addCost(cost) {
    return new Promise((resolve, reject) => {
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
}

// Create and expose the instance globally
window.idb = new IDBWrapper();