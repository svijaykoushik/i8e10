/**
 * Account Manager — manages wallet/account CRUD operations.
 *
 * Replaces the old settings.wallets string array with proper Account entities
 * in the accounts store. Wallets are accounts with subtype === 'wallet'.
 */

import { db } from './db';
import type { Account, AccountType } from '../src/db/accounts';
import { walletAccountId } from '../src/db/accounts';

// --- Query ---

/**
 * Get all active wallet accounts (both asset and liability wallets).
 * Replaces the old settings.wallets array.
 */
export async function getWalletAccounts(): Promise<Account[]> {
  const allAccounts = await db.accounts.toArray();
  return allAccounts.filter(
    (a) => a.subtype === 'wallet' && a.isActive
  );
}

/**
 * Get wallet names for UI display.
 * Backward compatible with components expecting string[].
 */
export async function getWalletNames(): Promise<string[]> {
  const wallets = await getWalletAccounts();
  return wallets.map((w) => w.name);
}

/**
 * Resolve a wallet name to its accountId.
 * Used by UI forms that still display wallet names.
 */
export async function resolveWalletAccountId(walletName: string): Promise<string> {
  const wallets = await getWalletAccounts();
  const match = wallets.find((w) => w.name === walletName);
  if (!match) throw new Error(`Wallet not found: ${walletName}`);
  return match.id;
}

/**
 * Resolve an accountId to the account's display name.
 */
export async function resolveAccountName(accountId: string): Promise<string> {
  const account = await db.accounts.get(accountId);
  return account?.name ?? 'Unknown';
}

/**
 * Build a Map of accountId → Account for efficient lookups.
 */
export async function buildAccountMap(): Promise<Map<string, Account>> {
  const allAccounts = await db.accounts.toArray();
  const map = new Map<string, Account>();
  for (const acc of allAccounts) {
    map.set(acc.id, acc);
  }
  return map;
}

// --- Mutations ---

/**
 * Add a new wallet account.
 * Defaults to asset type; pass 'liability' for credit cards.
 */
export async function addWallet(
  name: string,
  type: AccountType = 'asset'
): Promise<Account> {
  const account: Account = {
    id: walletAccountId(name),
    name,
    type,
    subtype: 'wallet',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  await db.accounts.add(account);
  return account;
}

/**
 * Rename a wallet. Updates Account.name only.
 * All transactions reference accountId, so they're unaffected.
 */
export async function renameWallet(accountId: string, newName: string): Promise<void> {
  await db.accounts.update(accountId, { name: newName });
}

/**
 * Remove a wallet (soft delete).
 * Sets isActive = false to preserve referential integrity.
 */
export async function removeWallet(accountId: string): Promise<void> {
  await db.accounts.update(accountId, { isActive: false });
}

/**
 * Get the default wallet account ID from settings.
 * Falls back to the first active wallet if no default is set.
 */
export async function getDefaultWalletAccountId(): Promise<string | null> {
  const setting = await db.settings.get('defaultWallet');
  if (setting?.value) return setting.value;

  // Fallback: first active wallet
  const wallets = await getWalletAccounts();
  if (wallets.length > 0) return wallets[0].id;

  return null;
}

/**
 * Set the default wallet account ID in settings.
 */
export async function setDefaultWalletAccountId(accountId: string): Promise<void> {
  await db.settings.put({ key: 'defaultWallet', value: accountId });
}
