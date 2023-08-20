import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from "react-native-encrypted-storage";

/**
 * Loads a string from storage.
 *
 * @param key The key to fetch.
 */
export async function loadString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    // not sure why this would fail... even reading the RN docs I'm unclear
    return null;
  }
}

/**
 * Saves a string to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export async function saveString(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads something from storage and runs it thru JSON.parse.
 *
 * @param key The key to fetch.
 */
export async function load(key: string): Promise<any | null> {
  try {
    const almostThere = await AsyncStorage.getItem(key);
    return JSON.parse(<string>almostThere);
  } catch {
    return null;
  }
}

/**
 * Saves an object to storage.
 *
 * @param key The key to fetch.
 * @param value The value to store.
 */
export async function save(key: string, value: any): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * This asynchronous function securely saves a value under a specified key in encrypted storage.
 *
 * @async
 * @export
 * @param {string} key - The key under which the value will be stored.
 * @param {any} value - The value to be stored.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the value was saved successfully, and `false` otherwise.
 * @throws Will throw an error if the saving process fails.
 * @example
 *
 * saveEncrypted('username', 'JohnDoe')
 *   .then(success => console.log(success))
 *   .catch(e => console.error(e));
 *
 */
export async function saveEncrypted(key: string, value: any) {
  try {
    await EncryptedStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * This asynchronous function loads a value from encrypted storage given a specified key.
 *
 * @async
 * @export
 * @param {string} key - The key of the stored value to load.
 * @returns {Promise<any | null>} - A promise that resolves to the stored value (parsed from JSON) if the load operation was successful, and `null` otherwise.
 * @throws Will throw an error if the loading process fails, but this error is caught and results in a returned `null`.
 * @example
 *
 * loadEncrypted('username')
 *   .then(value => console.log(value))
 *   .catch(e => console.error(e));
 *
 */
export async function loadEncrypted(key: string): Promise<any | null> {
  try {
    return await EncryptedStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Removes something from storage.
 *
 * @param key The key to kill.
 */
export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

/**
 * Burn it all to the ground.
 */
export async function clear(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch {}
}
