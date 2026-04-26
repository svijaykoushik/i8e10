import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../utils/db';
import * as accountManager from '../utils/accountManager';
import { walletAccountId } from '../src/db/accounts';

describe('accountManager', () => {
  beforeEach(async () => {
    // Clear all stores before each test
    await db.accounts.clear();
    await db.settings.clear();
  });

  describe('Wallet Management', () => {
    it('should add a new wallet', async () => {
      const added = await accountManager.addWallet('My New Wallet');
      expect(added.id).toBe(walletAccountId('My New Wallet'));

      const accounts = await db.accounts.toArray();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe('My New Wallet');
      expect(accounts[0].type).toBe('asset');
      expect(accounts[0].subtype).toBe('wallet');
      
      const wallets = await accountManager.getWalletAccounts();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].name).toBe('My New Wallet');
    });

    it('should not add a duplicate wallet', async () => {
      await accountManager.addWallet('Duplicate Wallet');
      await expect(accountManager.addWallet('Duplicate Wallet')).rejects.toThrow();

      const accounts = await db.accounts.toArray();
      expect(accounts).toHaveLength(1);
    });

    it('should rename an existing wallet', async () => {
      await accountManager.addWallet('Old Name');
      const oldId = walletAccountId('Old Name');
      
      await accountManager.renameWallet(oldId, 'New Name');

      const accounts = await db.accounts.toArray();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe('New Name');
      // ID should remain the same
      expect(accounts[0].id).toBe(oldId);
    });

    it('should remove a wallet by marking it inactive', async () => {
      await accountManager.addWallet('To Be Removed');
      const id = walletAccountId('To Be Removed');

      await accountManager.removeWallet(id);

      const accounts = await db.accounts.toArray();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].isActive).toBe(false);

      // Should not be returned by getWalletAccounts
      const activeWallets = await accountManager.getWalletAccounts();
      expect(activeWallets).toHaveLength(0);
    });

    it('should resolve wallet account ID from name', async () => {
      await accountManager.addWallet('Test Wallet');
      const id = await accountManager.resolveWalletAccountId('Test Wallet');
      expect(id).toBe(walletAccountId('Test Wallet'));
    });

    it('should resolve account name from ID', async () => {
      await accountManager.addWallet('Test Wallet');
      const id = walletAccountId('Test Wallet');
      const name = await accountManager.resolveAccountName(id);
      expect(name).toBe('Test Wallet');
    });

    it('should fall back to cash wallet ID if default is not set', async () => {
      await accountManager.addWallet('Cash / ரொக்கம்');
      const defaultId = await accountManager.getDefaultWalletAccountId();
      expect(defaultId).toBe(walletAccountId('Cash / ரொக்கம்'));
    });

    it('should get default wallet ID from settings if set', async () => {
      await accountManager.addWallet('Bank Wallet');
      const bankId = walletAccountId('Bank Wallet');
      await db.settings.put({ key: 'defaultWallet', value: bankId });

      const defaultId = await accountManager.getDefaultWalletAccountId();
      expect(defaultId).toBe(bankId);
    });
  });
});
