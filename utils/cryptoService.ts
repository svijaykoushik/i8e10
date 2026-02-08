import { setupInWorker, verifyInWorker, recoverInWorker, encryptInWorker, decryptInWorker } from './cryptoWorkerClient';

// --- Helper Functions ---
const stringToArrayBuffer = (str: string): ArrayBuffer => new TextEncoder().encode(str).buffer;
const arrayBufferToString = (buffer: ArrayBuffer): string => new TextDecoder().decode(buffer);
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(buffer)));
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- In-memory Key Storage ---
let sessionKey: CryptoKey | null = null;

// --- Crypto utilities to serialize key (for use in worker) ---
const exportKey = async(key: CryptoKey)=>{
  if (!key.extractable) {
    throw new Error("Key is not extractable and cannot be sent to the worker via export/import.");
  }
  
  // Use 'jwk' format for easy serialization
  const exportedKey = await crypto.subtle.exportKey(
    "jwk",
    key
  );
  
  return exportedKey;
}

// --- Core Crypto Functions (for session use) ---
export const encrypt = async (data: string, key: CryptoKey): Promise<{ iv: string; ciphertext: string }> => {
  // const iv = crypto.getRandomValues(new Uint8Array(12));
  // const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, stringToArrayBuffer(data));
  // return { iv: arrayBufferToBase64(iv), ciphertext: arrayBufferToBase64(encryptedData) };
  const jwk = await exportKey(key);
  const { iv, ciphertext } = await encryptInWorker(data, jwk);
  return { iv, ciphertext };
};

export const decrypt = async (encryptedData: { iv: string; ciphertext: string }, key: CryptoKey): Promise<string> => {
  const jwk = await exportKey(key);
  const plainText = await decryptInWorker(encryptedData, jwk);
  return plainText;
};


// --- Session and Setup Functions (using Worker) ---

/**
 * Imports a raw key from the worker and stores it for the session.
 * @param rawMasterKeyB64 The base64 encoded raw master key.
 * @returns The imported CryptoKey.
 */
const importAndStoreKey = async (rawMasterKeyB64: string): Promise<CryptoKey> => {
    const key = await crypto.subtle.importKey(
        'raw',
        base64ToArrayBuffer(rawMasterKeyB64),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
    sessionKey = key;
    return key;
};

export const setupEncryption = async (password: string) => {
    const result = await setupInWorker(password);
    await importAndStoreKey(result.rawMasterKey);
    // Don't return the raw key from here, just the data needed for storage.
    const { rawMasterKey, ...storageData } = result;
    return storageData;
};

export const verifyPasswordAndGetKey = async (password: string, saltB64: string, wrappedMasterKeyB64: string, verifierJSON: string): Promise<CryptoKey> => {
  const result = await verifyInWorker(password, saltB64, wrappedMasterKeyB64, verifierJSON);
  return importAndStoreKey(result.rawMasterKey);
};

export const recoverAndResetPassword = async (
    phrase: string,
    newPassword: string,
    saltB64: string,
    wrappedMasterKeyByRecoveryB64: string,
    storedPhraseHash: string
) => {
    const result = await recoverInWorker(phrase, newPassword, saltB64, wrappedMasterKeyByRecoveryB64, storedPhraseHash);
    await importAndStoreKey(result.rawMasterKey);
    // Return only the data needed for DB update.
    return { newWrappedMasterKey: result.newWrappedMasterKey };
};

export const getKey = (): CryptoKey | null => sessionKey;
export const clearKey = (): void => { sessionKey = null; };