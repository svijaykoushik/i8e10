/**
 * Tests for accounts.ts — ID generation and account factory functions.
 */
import { describe, it, expect } from 'vitest';
import {
  walletAccountId,
  debtAccountId,
  investmentAccountId,
  createSystemAccounts,
  createWalletAccount,
  createDebtAccount,
  createInvestmentAccount,
  SYSTEM_ACCOUNT_IDS,
} from '../src/db/accounts';

describe('walletAccountId', () => {
  it('generates deterministic slug-based ID', () => {
    expect(walletAccountId('Cash')).toBe('acc_wallet_cash');
  });

  it('handles special characters', () => {
    expect(walletAccountId('Cash / ரொக்கம்')).toBe('acc_wallet_cash');
  });

  it('handles spaces and mixed case', () => {
    expect(walletAccountId('Bank Account')).toBe('acc_wallet_bank_account');
  });

  it('is deterministic (same input → same output)', () => {
    expect(walletAccountId('My Wallet')).toBe(walletAccountId('My Wallet'));
  });
});

describe('debtAccountId', () => {
  it('generates payable ID for owed debt', () => {
    expect(debtAccountId('d1', 'owed')).toBe('acc_debt_payable_d1');
  });

  it('generates receivable ID for lent debt', () => {
    expect(debtAccountId('d2', 'lent')).toBe('acc_debt_receivable_d2');
  });
});

describe('investmentAccountId', () => {
  it('generates investment ID', () => {
    expect(investmentAccountId('inv1')).toBe('acc_investment_inv1');
  });
});

describe('createSystemAccounts', () => {
  it('creates exactly 4 system accounts', () => {
    const accounts = createSystemAccounts();
    expect(accounts).toHaveLength(4);
  });

  it('creates expense, income, equity, and credit card accounts', () => {
    const accounts = createSystemAccounts();
    const ids = accounts.map((a) => a.id);
    expect(ids).toContain(SYSTEM_ACCOUNT_IDS.EXPENSE);
    expect(ids).toContain(SYSTEM_ACCOUNT_IDS.INCOME);
    expect(ids).toContain(SYSTEM_ACCOUNT_IDS.EQUITY_OPENING);
    expect(ids).toContain(SYSTEM_ACCOUNT_IDS.CREDIT_CARD);
  });

  it('credit card account is liability type with wallet subtype', () => {
    const accounts = createSystemAccounts();
    const cc = accounts.find((a) => a.id === SYSTEM_ACCOUNT_IDS.CREDIT_CARD)!;
    expect(cc.type).toBe('liability');
    expect(cc.subtype).toBe('wallet');
  });

  it('all accounts are active', () => {
    const accounts = createSystemAccounts();
    expect(accounts.every((a) => a.isActive)).toBe(true);
  });
});

describe('createWalletAccount', () => {
  it('creates asset-type wallet', () => {
    const acc = createWalletAccount('Cash');
    expect(acc.id).toBe('acc_wallet_cash');
    expect(acc.type).toBe('asset');
    expect(acc.subtype).toBe('wallet');
    expect(acc.isActive).toBe(true);
  });
});

describe('createDebtAccount', () => {
  it('creates liability for owed debt', () => {
    const acc = createDebtAccount('d1', 'owed', 'Alice');
    expect(acc.id).toBe('acc_debt_payable_d1');
    expect(acc.type).toBe('liability');
    expect(acc.subtype).toBe('debt_payable');
    expect(acc.name).toContain('Alice');
  });

  it('creates asset for lent debt', () => {
    const acc = createDebtAccount('d2', 'lent', 'Bob');
    expect(acc.id).toBe('acc_debt_receivable_d2');
    expect(acc.type).toBe('asset');
    expect(acc.subtype).toBe('debt_receivable');
    expect(acc.name).toContain('Bob');
  });
});

describe('createInvestmentAccount', () => {
  it('creates asset investment account', () => {
    const acc = createInvestmentAccount('inv1', 'NIFTY 50');
    expect(acc.id).toBe('acc_investment_inv1');
    expect(acc.type).toBe('asset');
    expect(acc.subtype).toBe('investment');
    expect(acc.name).toContain('NIFTY 50');
  });
});
