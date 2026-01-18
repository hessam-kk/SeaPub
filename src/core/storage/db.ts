/**
 * One database ('seapub' v2), three object stores, created together in a
 * single upgrade — idempotent for databases created by earlier versions.
 */
const DB_NAME = 'seapub'
const DB_VERSION = 2

export const BOOKS = 'books'
export const ANNOTATIONS = 'annotations'
export const SETTINGS = 'settings'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const name of [BOOKS, ANNOTATIONS, SETTINGS]) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name)
        }
      }
      req.onsuccess = () => {
        req.result.onversionchange = () => req.result.close()
        resolve(req.result)
      }
      req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'))
      req.onblocked = () => reject(new Error('IndexedDB blocked'))
    })
  }
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const os = transaction.objectStore(store)
        const request = run(os)
        transaction.oncomplete = () => resolve(request?.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      }),
  )
}

export function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  return tx<T>(store, 'readonly', (os) => os.get(key) as IDBRequest<T>)
}

export function idbSet(store: string, key: string, value: unknown): Promise<void> {
  return tx(store, 'readwrite', (os) => {
    os.put(value, key)
  }).then(() => undefined)
}

export function idbDel(store: string, key: string): Promise<void> {
  return tx(store, 'readwrite', (os) => {
    os.delete(key)
  }).then(() => undefined)
}

export function idbEntries<T>(store: string): Promise<[string, T][]> {
  return open().then(
    (db) =>
      new Promise<[string, T][]>((resolve, reject) => {
        const transaction = db.transaction(store, 'readonly')
        const os = transaction.objectStore(store)
        const keysReq = os.getAllKeys()
        const valuesReq = os.getAll()
        transaction.oncomplete = () => {
          resolve(
            (keysReq.result as IDBValidKey[]).map((k, i) => [String(k), valuesReq.result[i] as T]),
          )
        }
        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

/** Friendly warning hook for storage pressure. */
export async function storageStatus(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate()
      return { usage, quota }
    }
  } catch {
    /* ignore */
  }
  return null
}
