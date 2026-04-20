const DB_NAME = 'bookworm';
const DB_VERSION = 1;
export const STORE_BOOKS = 'books';
export const STORE_PAGES = 'pages';
export const STORE_SETTINGS = 'settings';

let db = null;

export function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE_BOOKS))
        d.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      if (!d.objectStoreNames.contains(STORE_PAGES))
        d.createObjectStore(STORE_PAGES, { keyPath: 'key' });
      if (!d.objectStoreNames.contains(STORE_SETTINGS))
        d.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

export const dbGet = (store, key) => new Promise((resolve, reject) => {
  const req = db.transaction(store, 'readonly').objectStore(store).get(key);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

export const dbPut = (store, value) => new Promise((resolve, reject) => {
  const req = db.transaction(store, 'readwrite').objectStore(store).put(value);
  req.onsuccess = () => resolve();
  req.onerror = () => reject(req.error);
});

export const dbDelete = (store, key) => new Promise((resolve, reject) => {
  const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
  req.onsuccess = () => resolve();
  req.onerror = () => reject(req.error);
});

export const dbGetAll = (store) => new Promise((resolve, reject) => {
  const req = db.transaction(store, 'readonly').objectStore(store).getAll();
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

export const dbClear = (store) => new Promise((resolve, reject) => {
  const req = db.transaction(store, 'readwrite').objectStore(store).clear();
  req.onsuccess = () => resolve();
  req.onerror = () => reject(req.error);
});

export const dbGetAllKeys = (store) => new Promise((resolve, reject) => {
  const req = db.transaction(store, 'readonly').objectStore(store).getAllKeys();
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
