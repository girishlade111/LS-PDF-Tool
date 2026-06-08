import { openDB } from 'idb';

export const DB_NAME = 'ls-pdf-db';
export const STORE_NAME = 'history';
export const DB_VERSION = 1;

let dbInstance = null;

export async function initDB() {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('processedAt', 'processedAt');
        }
      },
    });
    return dbInstance;
  } catch (error) {
    console.error('IndexedDB init error:', error);
    return null;
  }
}

export async function addHistoryEntry(entry) {
  try {
    const db = await initDB();
    if (!db) return null;

    const newEntry = {
      toolName: entry.toolName,
      fileName: entry.fileName,
      fileSize: entry.fileSize,
      processedAt: entry.processedAt || new Date().toISOString(),
      status: entry.status || 'success',
    };

    await db.add(STORE_NAME, newEntry);

    const count = await db.count(STORE_NAME);
    if (count > 5) {
      const oldest = await db.getAllFromIndex(STORE_NAME, 'processedAt', 1);
      if (oldest.length > 0) {
        await db.delete(STORE_NAME, oldest[0].id);
      }
    }

    return newEntry;
  } catch (error) {
    console.error('addHistoryEntry error:', error);
    return null;
  }
}

export async function getHistory() {
  try {
    const db = await initDB();
    if (!db) return [];

    const entries = await db.getAllFromIndex(STORE_NAME, 'processedAt');
    return entries.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
  } catch (error) {
    console.error('getHistory error:', error);
    return [];
  }
}

export async function clearHistory() {
  try {
    const db = await initDB();
    if (!db) return false;

    await db.clear(STORE_NAME);
    return true;
  } catch (error) {
    console.error('clearHistory error:', error);
    return false;
  }
}