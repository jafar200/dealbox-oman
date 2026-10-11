const DATABASE_NAME = 'dealbox-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'settings';
const LOGO_KEY = 'project-logo';
const LEGACY_LOGO_KEY = 'dealbox_project_logo_v1';

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const loadStoredValue = async <T>(key: string): Promise<T | null> => {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  const database = await openDatabase();
  return new Promise<T | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveStoredValue = async <T>(key: string, value: T | null): Promise<void> => {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is unavailable in this browser');
  }

  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    if (value === null) store.delete(key);
    else store.put(value, key);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

export const loadProjectLogo = async (): Promise<string | null> => {
  const storedLogo = await loadStoredValue<string>(LOGO_KEY);
  if (storedLogo) return storedLogo;

  const legacyLogo = typeof localStorage === 'undefined' ? null : localStorage.getItem(LEGACY_LOGO_KEY);
  if (legacyLogo) {
    await saveProjectLogo(legacyLogo);
    localStorage.removeItem(LEGACY_LOGO_KEY);
  }
  return legacyLogo;
};

export const saveProjectLogo = async (logo: string | null): Promise<void> => {
  await saveStoredValue(LOGO_KEY, logo);
};