import CryptoJS from 'crypto-js';

// Secret key - in production, this should come from environment variables
const SECRET_KEY = process.env.VUE_APP_CRYPTO_SECRET || 'contacto-secure-key-2026';

/**
 * Encrypts data for secure storage in localStorage
 */
export function encrypt(data) {
  try {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Decrypts data from localStorage
 */
export function decrypt(encryptedData) {
  try {
    if (!encryptedData) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Securely stores data in localStorage (encrypted)
 */
export function secureStore(key, data) {
  const encrypted = encrypt(data);
  if (encrypted) {
    localStorage.setItem(key, encrypted);
    return true;
  }
  return false;
}

/**
 * Retrieves and decrypts data from localStorage
 */
export function secureRetrieve(key) {
  const encrypted = localStorage.getItem(key);
  return decrypt(encrypted);
}

/**
 * Removes data from localStorage
 */
export function secureRemove(key) {
  localStorage.removeItem(key);
}

/**
 * Clears all auth-related data from localStorage
 */
export function clearAuthStorage() {
  secureRemove('authToken');
  secureRemove('refreshToken');
  secureRemove('authUser');
}
