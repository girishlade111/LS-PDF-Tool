import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'pdf-tools-db';
const DB_VERSION = 1;

const STORES = {
  FILES: 'files',
  HISTORY: 'history',
} as const;

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  createdAt: number;
}

export interface OperationHistory {
  id: string;
  toolType: string;
  toolName: string;
  inputFiles: string[];
  outputFiles: string[];
  createdAt: number;
  filename?: string;
  fileSize?: number;
  size?: number;
  status?: 'success' | 'error';
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.FILES)) {
        db.createObjectStore(STORES.FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
        historyStore.createIndex('createdAt', 'createdAt');
        historyStore.createIndex('toolType', 'toolType');
      }
    },
  });
  
  return dbInstance;
}

export async function storeFile(file: StoredFile): Promise<void> {
  const db = await getDB();
  await db.put(STORES.FILES, file);
}

export async function getFile(id: string): Promise<StoredFile | undefined> {
  const db = await getDB();
  return db.get(STORES.FILES, id);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.FILES, id);
}

export async function addHistory(entry: OperationHistory): Promise<void> {
  const db = await getDB();
  await db.put(STORES.HISTORY, entry);
  // Keep only last 5 entries
  const tx = db.transaction(STORES.HISTORY, 'readwrite');
  const store = tx.objectStore(STORES.HISTORY);
  const index = store.index('createdAt');
  let cursor = await index.openCursor(null, 'prev');
  let count = 0;
  const toDelete: string[] = [];
  while (cursor) {
    count++;
    if (count > 5) {
      toDelete.push(cursor.value.id);
    }
    cursor = await cursor.continue();
  }
  for (const id of toDelete) {
    await store.delete(id);
  }
  await tx.done;
}

export async function addHistoryEntry(entry: OperationHistory): Promise<void> {
  await addHistory(entry);
}

export async function getRecentHistory(limit = 5): Promise<OperationHistory[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.HISTORY, 'readonly');
  const index = tx.store.index('createdAt');
  const entries: OperationHistory[] = [];
  let cursor = await index.openCursor(null, 'prev');
  while (cursor && entries.length < limit) {
    entries.push(cursor.value);
    cursor = await cursor.continue();
  }
  return entries;
}

export async function getHistory(): Promise<OperationHistory[]> {
  return getRecentHistory(5);
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear(STORES.HISTORY);
}
