import { openDB } from 'idb';

export const DB_NAME = 'ls-pdf-db';
export const STORE_NAME = 'history';
const DB_VERSION = 1;

/**
 * Initializes the IndexedDB instance.
 * Creates the database and object store if they don't exist.
 */
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          // Create an index on processedAt for sorting and enforcing the 5-item limit
          store.createIndex('processedAt', 'processedAt');
        }
      },
    });
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    return null;
  }
}

/**
 * Adds a new history entry.
 * Keeps only the last 5 entries, deleting older ones automatically.
 * 
 * @param {Object} entry - { toolName, fileName, fileSize, processedAt, status }
 */
export async function addHistoryEntry(entry) {
  try {
    const db = await initDB();
    if (!db) return null;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Ensure we have a valid ISO timestamp
    const entryToSave = {
      ...entry,
      processedAt: entry.processedAt || new Date().toISOString(),
    };

    await store.add(entryToSave);

    // Enforce the maximum limit of 5 entries
    const index = store.index('processedAt');
    let cursor = await index.openCursor();
    let count = await store.count();

    // Iterate through the oldest entries (ascending by processedAt) and delete them
    while (count > 5 && cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
      count--;
    }

    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to add history entry:', error);
    return null;
  }
}

/**
 * Retrieves all history entries, sorted by processedAt descending (newest first).
 */
export async function getHistory() {
  try {
    const db = await initDB();
    if (!db) return null;

    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('processedAt');

    // Use a cursor to fetch records in descending order
    let cursor = await index.openCursor(null, 'prev');
    const results = [];
    
    while (cursor) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    
    return results;
  } catch (error) {
    console.error('Failed to get history:', error);
    return null;
  }
}

/**
 * Deletes all history entries from the object store.
 */
export async function clearHistory() {
  try {
    const db = await initDB();
    if (!db) return null;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return null;
  }
}
