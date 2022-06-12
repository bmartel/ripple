import { openDB, IDBPDatabase } from 'idb'
import { BackgroundFetch } from './background'

export type StorageType = 'local' | 'session' | 'indexeddb'
export type StorageConfig = {
  name?: string
  version?: number
  store?: string
  key?: string
  type?: StorageType
  backgroundFetch?: BackgroundFetch
}

export type StorageConfigComplete = {
  name: string
  version: number
  store: string
  key: string
  type: StorageType
  backgroundFetch?: BackgroundFetch
}

export class Storage {
  static db: IDBPDatabase | null = null
  static stores = new Set<string>()
  config: StorageConfigComplete

  constructor(config?: StorageConfig) {
    this.config = { type: 'local', name: 'rpldata', version: 1, ...config } as StorageConfigComplete
    if (this.config.store) {
      this.registerStore([this.config.store])
    }
  }

  registerStore(stores: string[] = []) {
    stores.forEach((s) => Storage.stores.add(s))
  }

  using(type?: StorageType, storeName?: string): Storage {
    const store = new Storage()
    store.config.type = type || storeName ? 'indexeddb' : 'local'
    store.config.store = storeName || store.config.store
    if (store.config.store) {
      this.registerStore([store.config.store])
    }
    return store
  }

  async open() {
    if (this.config.type === 'indexeddb' && !Storage.db) {
      Storage.db = await openDB(this.config.name, this.config.version, {
        upgrade(_db, _oldVersion, _newVersion, _transaction) {
          Storage.stores.forEach((store) => {
            _db.createObjectStore(store)
          })
        },
      })
      this.registerStore(Array.from(Storage.db.objectStoreNames))
    }
  }

  close() {
    if (this.config.type === 'indexeddb') {
      Storage.db?.close()
      Storage.db = null
    }
  }

  ensureStore(store: string): boolean {
    return this.config.type !== 'indexeddb' || Storage.stores.has(store)
  }

  async get<T = any>(key: string): Promise<T | null> {
    switch (this.config.type) {
      case 'indexeddb':
        await this.open()
        if (!this.config.store || !this.ensureStore(this.config.store)) return null
        const tx = Storage.db!.transaction(this.config.store).objectStore(this.config.store)
        return await tx.get(key)
      case 'session':
        return JSON.parse(sessionStorage.getItem(key) || '')
      case 'local':
      default:
        return JSON.parse(localStorage.getItem(key) || '')
    }
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    switch (this.config.type) {
      case 'indexeddb':
        await this.open()
        if (!this.config.store || !this.ensureStore(this.config.store)) return
        const tx = Storage.db!.transaction(this.config.store, 'readwrite').objectStore(this.config.store)
        await tx.put(value, key)
        return
      case 'session':
        return sessionStorage.setItem(key, JSON.stringify(value))
      case 'local':
      default:
        return localStorage.setItem(key, JSON.stringify(value))
    }
  }

  async remove(key: string): Promise<void> {
    switch (this.config.type) {
      case 'indexeddb':
        await this.open()
        if (!this.config.store || !this.ensureStore(this.config.store)) return
        const tx = Storage.db!.transaction(this.config.store, 'readwrite').objectStore(this.config.store)
        await tx.delete(key)
        return
      case 'session':
        return sessionStorage.removeItem(key)
      case 'local':
      default:
        return localStorage.removeItem(key)
    }
  }

  async has(key: string): Promise<boolean> {
    switch (this.config.type) {
      case 'indexeddb':
        await this.open()
        if (!this.config.store || !this.ensureStore(this.config.store)) return false
        const tx = Storage.db!.transaction(this.config.store).objectStore(this.config.store)
        return (await tx.count(key)) > 0
      case 'session':
        return key in sessionStorage
      case 'local':
      default:
        return key in localStorage
    }
  }
}
