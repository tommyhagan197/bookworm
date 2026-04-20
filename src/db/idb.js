// src/db/idb.js
// Shared IndexedDB layer. All views import from here.

const DB_NAME = "bookworm";
const DB_VERSION = 3;

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("books"))
        db.createObjectStore("books", { keyPath: "id" });
      if (!db.objectStoreNames.contains("pages"))
        db.createObjectStore("pages", { keyPath: "key" });
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "id" });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export async function dbGet(store, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function dbPut(store, value) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readwrite").objectStore(store).put(value);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function getSetting(key, fallback = null) {
  const row = await dbGet("settings", key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  return dbPut("settings", { id: key, value });
}

export async function getAllBooks() {
  return dbGetAll("books");
}

export async function findBookByGutenbergId(gutenbergId) {
  const books = await getAllBooks();
  return books.find(b => b.gutenbergId === gutenbergId) || null;
}
