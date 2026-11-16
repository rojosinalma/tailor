import type { QueryClient } from "@tanstack/react-query";
import {
  type PersistedClient,
  type Persister,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { type ReactNode, useState } from "react";

export { useIsRestoring } from "@tanstack/react-query";

const DAY = 86_400_000;
const DATABASE = "tailor-offline-data";
const STORE = "clients";
/** Saves at most once a second: the cache changes on every fetch. */
const SAVE_DELAY = 1000;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

interface Storage {
  read(): Promise<PersistedClient | undefined>;
  write(client: PersistedClient): Promise<void>;
  remove(): Promise<void>;
}

function localStorageOf(key: string): Storage {
  return {
    read: async () => {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as PersistedClient) : undefined;
    },
    write: async (client) => localStorage.setItem(key, JSON.stringify(client)),
    remove: async () => localStorage.removeItem(key),
  };
}

/** IndexedDB when the browser has it, else localStorage. */
async function storageOf(key: string): Promise<Storage> {
  const db = typeof indexedDB === "undefined" ? null : await openDatabase().catch(() => null);
  if (!db) return localStorageOf(key);
  return {
    read: () => transact<PersistedClient | undefined>(db, "readonly", (s) => s.get(key)),
    write: async (client) => {
      await transact(db, "readwrite", (s) => s.put(client, key));
    },
    remove: async () => {
      await transact(db, "readwrite", (s) => s.delete(key));
    },
  };
}

function createPersister(key: string): Persister {
  let storage: Promise<Storage> | null = null;
  const open = (): Promise<Storage> => {
    storage ??= storageOf(key);
    return storage;
  };
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = (): void => {
    clearTimeout(timer);
    timer = undefined;
    const next = pending;
    pending = null;
    if (next) void open().then((s) => s.write(next).catch(() => undefined));
  };
  // The last change is saved when the page goes away, before its delay ends.
  addEventListener("pagehide", flush);
  return {
    persistClient(client) {
      pending = client;
      timer ??= setTimeout(flush, SAVE_DELAY);
    },
    restoreClient: () => open().then((s) => s.read()),
    removeClient: () => open().then((s) => s.remove()),
  };
}

export interface OfflineDataProps {
  /** The app's QueryClient. OfflineData takes the place of QueryClientProvider. */
  client: QueryClient;
  /** Names the kept data, for example the app's name. */
  storageKey: string;
  /** Kept data older than this many milliseconds is dropped. Default one day. */
  maxAge?: number;
  /** Data kept under another buster is dropped: give the app version when the data's shape changes. */
  buster?: string;
  children: ReactNode;
}

/**
 * Keeps the Query cache in the browser and restores it at the start. While offline, queries wait for the
 * network ("online" mode) and keep their data instead of failing.
 */
export function OfflineData({ client, storageKey, maxAge = DAY, buster = "", children }: OfflineDataProps) {
  const [persister] = useState(() => {
    // A query must live in the cache as long as it is kept, or it is gone before it is saved.
    const queries = client.getDefaultOptions().queries ?? {};
    const gcTime = typeof queries.gcTime === "number" ? Math.max(queries.gcTime, maxAge) : maxAge;
    client.setDefaultOptions({
      ...client.getDefaultOptions(),
      queries: { ...queries, gcTime, networkMode: queries.networkMode ?? "online" },
    });
    return createPersister(storageKey);
  });
  return (
    <PersistQueryClientProvider client={client} persistOptions={{ persister, maxAge, buster }}>
      {children}
    </PersistQueryClientProvider>
  );
}
