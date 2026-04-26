import "fake-indexeddb/auto";
import { vi } from 'vitest';

// Mock cryptoService so that DB encryption middleware doesn't fail in tests
// since there's no actual session key setup during test runs.
vi.mock('../utils/cryptoService', () => {
  return {
    encrypt: async (val: string) => {
      // Dummy encrypt: just return the string as ciphertext
      return { iv: 'dummy-iv', ciphertext: `encrypted-${val}` };
    },
    decrypt: async (encryptedData: { iv: string, ciphertext: string }) => {
      // Dummy decrypt
      if (encryptedData.ciphertext.startsWith('encrypted-')) {
        return encryptedData.ciphertext.replace('encrypted-', '');
      }
      return encryptedData.ciphertext;
    },
    getKey: () => {
      // Return a dummy object to satisfy the CryptoKey check
      return { type: 'secret', extractable: true, algorithm: { name: 'AES-GCM' }, usages: ['encrypt', 'decrypt'] } as unknown as CryptoKey;
    },
    setupEncryption: vi.fn(),
    verifyPasswordAndGetKey: vi.fn(),
    recoverAndResetPassword: vi.fn(),
    clearKey: vi.fn()
  };
});
