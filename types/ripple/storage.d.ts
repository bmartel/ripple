import { IDBPDatabase } from 'idb';
import { BackgroundFetch } from './background';
export declare type StorageType = 'local' | 'session' | 'indexeddb';
export declare type StorageConfig = {
    name?: string;
    version?: number;
    store?: string;
    key?: string;
    type?: StorageType;
    backgroundFetch?: BackgroundFetch;
};
export declare type StorageConfigComplete = {
    name: string;
    version: number;
    store: string;
    key: string;
    type: StorageType;
    backgroundFetch?: BackgroundFetch;
};
export declare class Storage {
    static db: IDBPDatabase | null;
    static stores: Set<string>;
    config: StorageConfigComplete;
    constructor(config?: StorageConfig);
    registerStore(stores?: string[]): void;
    using(type?: StorageType, storeName?: string): Storage;
    open(): Promise<void>;
    close(): void;
    ensureStore(store: string): boolean;
    get<T = any>(key: string): Promise<T | null>;
    set<T = any>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
}
