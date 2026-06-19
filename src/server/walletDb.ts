import fs from 'fs';
import path from 'path';
import { supabaseDb, isConfigured } from '../supabaseClient';

export interface Wallet {
  userEmail: string;
  balance: number; // in Naira (₦)
}

export interface WalletTransaction {
  id: string;
  userEmail: string;
  amount: number; // in Naira (₦)
  type: 'fund' | 'purchase';
  description: string;
  timestamp: string;
  paystackReference?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'wallet-transactions.json');

let walletsCache: Record<string, Wallet> | null = null;
let transactionsCache: WalletTransaction[] | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[Wallet DB] Could not create data directory:', err);
  }
}

export const walletDb = {
  getWallets(): Record<string, Wallet> {
    if (walletsCache) {
      return walletsCache;
    }

    ensureDataDir();
    let wallets: Record<string, Wallet> = {};

    let fileExists = false;
    try {
      fileExists = fs.existsSync(WALLETS_FILE);
    } catch (_) {
      fileExists = false;
    }

    if (fileExists) {
      try {
        const content = fs.readFileSync(WALLETS_FILE, 'utf-8');
        wallets = JSON.parse(content);
      } catch (err) {
        console.error('[Wallet DB] Failed to parse wallets.json, using empty object', err);
        wallets = {};
      }
    }

    walletsCache = wallets;
    return wallets;
  },

  saveWallets(wallets: Record<string, Wallet>) {
    walletsCache = wallets;
    ensureDataDir();
    try {
      fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Wallet DB] Failed to save wallets.json (filesystem may be read-only):', err);
    }
  },

  getTransactions(): WalletTransaction[] {
    if (transactionsCache) {
      return transactionsCache;
    }

    ensureDataDir();
    let transactions: WalletTransaction[] = [];

    let fileExists = false;
    try {
      fileExists = fs.existsSync(TRANSACTIONS_FILE);
    } catch (_) {
      fileExists = false;
    }

    if (fileExists) {
      try {
        const content = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
        transactions = JSON.parse(content);
      } catch (err) {
        console.error('[Wallet DB] Failed to parse wallet-transactions.json, using empty array', err);
        transactions = [];
      }
    }

    transactionsCache = transactions;
    return transactions;
  },

  saveTransactions(transactions: WalletTransaction[]) {
    transactionsCache = transactions;
    ensureDataDir();
    try {
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Wallet DB] Failed to save wallet-transactions.json (filesystem may be read-only):', err);
    }
  },

  getOrCreateWallet(email: string): Wallet {
    const cleanEmail = email.toLowerCase().trim();
    const wallets = this.getWallets();

    if (!wallets[cleanEmail]) {
      wallets[cleanEmail] = {
        userEmail: cleanEmail,
        balance: 0
      };
      this.saveWallets(wallets);
    }

    // Dynamic clean wallet calculation based on formula:
    // Total credits minus Total debits strictly from real transactions of this user (excluding legacy 'tx-seed')
    const txs = this.getTransactions().filter(t => t.userEmail === cleanEmail && !t.id.startsWith('tx-seed'));
    const balance = txs.reduce((sum, tx) => sum + tx.amount, 0);
    wallets[cleanEmail].balance = balance;
    this.saveWallets(wallets);

    return wallets[cleanEmail];
  },

  getTransactionsForUser(email: string): WalletTransaction[] {
    const cleanEmail = email.toLowerCase().trim();
    // Ensure wallet exists
    this.getOrCreateWallet(cleanEmail);
    const transactions = this.getTransactions();
    return transactions.filter(t => t.userEmail === cleanEmail && !t.id.startsWith('tx-seed'));
  },

  hasPaystackReferenceBeenUsed(reference: string): boolean {
    if (!reference) return false;
    const transactions = this.getTransactions();
    return transactions.some(t => t.paystackReference === reference);
  },

  getEmailForPaystackReference(reference: string): string | null {
    if (!reference) return null;
    const transactions = this.getTransactions();
    const found = transactions.find(t => t.paystackReference === reference);
    return found ? found.userEmail : null;
  },

  creditWallet(email: string, amount: number, reference: string): { success: boolean; message: string; balance?: number } {
    if (!email) return { success: false, message: 'Invalid email address' };
    if (amount <= 0) return { success: false, message: 'Funding amount must be greater than zero' };

    const cleanEmail = email.toLowerCase().trim();
    const wallets = this.getWallets();
    const wallet = this.getOrCreateWallet(cleanEmail);

    // Prevent duplicate credits from identical Paystack references, with smart self-owning fallback
    if (reference) {
      const existingOwner = this.getEmailForPaystackReference(reference);
      if (existingOwner) {
        if (existingOwner === cleanEmail) {
          console.log(`[Wallet DB] Duplicate credit request: Reference ${reference} already credited to ${cleanEmail}. Returning cached success.`);
          return { 
            success: true, 
            message: 'This transaction was already successfully verified and credited.', 
            balance: wallet.balance 
          };
        } else {
          console.warn(`[Wallet DB] Security Warning: Reference ${reference} already used by ${existingOwner}, but requested by ${cleanEmail}.`);
          return { 
            success: false, 
            message: 'This transaction reference is already linked to another account.', 
            balance: wallet.balance 
          };
        }
      }
    }

    // Update wallet balance
    wallet.balance += amount;
    wallets[cleanEmail] = wallet;
    this.saveWallets(wallets);

    // Log the transaction
    const txs = this.getTransactions();
    const newTx: WalletTransaction = {
      id: `wallet-fund-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userEmail: cleanEmail,
      amount: amount,
      type: 'fund',
      description: 'Wallet Funding',
      timestamp: new Date().toISOString(),
      paystackReference: reference
    };

    txs.unshift(newTx);
    this.saveTransactions(txs);

    console.log(`[Wallet DB] Securing Account Credit: user ${cleanEmail} credited with NGN ${amount}. Balance is now ${wallet.balance}.`);
    return { success: true, message: `Successfully loaded ₦${amount.toLocaleString()} into your wallet!`, balance: wallet.balance };
  },

  purchaseProductFromWallet(email: string, productId: string, productPrice: number, productTitle: string): { success: boolean; message: string; balance?: number; transactionId?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const wallets = this.getWallets();
    const wallet = this.getOrCreateWallet(cleanEmail);

    if (wallet.balance < productPrice) {
      return { success: false, message: 'Insufficient Wallet Balance' };
    }

    // Deduct balance
    wallet.balance -= productPrice;
    wallets[cleanEmail] = wallet;
    this.saveWallets(wallets);

    // Log the transaction
    const txId = `wallet-purchase-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const txs = this.getTransactions();
    const newTx: WalletTransaction = {
      id: txId,
      userEmail: cleanEmail,
      amount: -productPrice,
      type: 'purchase',
      description: `Product Purchase: ${productTitle}`,
      timestamp: new Date().toISOString()
    };
    txs.unshift(newTx);
    this.saveTransactions(txs);

    console.log(`[Wallet DB] Securing Account Debit: user ${cleanEmail} purchased ${productTitle} for NGN ${productPrice}. Remaining balance: ${wallet.balance}.`);
    return { 
      success: true, 
      message: `Product purchased successfully! Deducted ₦${productPrice.toLocaleString()} from wallet balance.`, 
      balance: wallet.balance, 
      transactionId: txId 
    };
  },

  async syncFromSupabase() {
    if (!isConfigured) return;
    try {
      console.log('[Wallet DB] Pulling down state from Supabase...');
      const sWallets = await supabaseDb.getWallets();
      if (sWallets) {
        const walletsMap: Record<string, Wallet> = {};
        for (const w of sWallets) {
          walletsMap[w.user_email] = {
            userEmail: w.user_email,
            balance: Number(w.balance)
          };
        }
        walletsCache = walletsMap;
      }

      const sTxs = await supabaseDb.getWalletTransactions();
      if (sTxs) {
        transactionsCache = sTxs;
      }

      const sPurchases = await supabaseDb.getPurchases();
      if (sPurchases) {
        purchasesCache = sPurchases;
      }
      console.log('[Wallet DB] Sync from Supabase complete. Wallets:', Object.keys(walletsCache || {}).length, 'Transactions:', (transactionsCache || []).length);
    } catch (e) {
      console.error('[Wallet DB] Sync from Supabase failed (ignoring for resilience):', e);
    }
  },

  async syncToSupabase() {
    if (!isConfigured) return;
    try {
      console.log('[Wallet DB] Pushing modified state to Supabase...');
      // 1. Push all wallets in cache
      if (walletsCache) {
        for (const key of Object.keys(walletsCache)) {
          await supabaseDb.saveWallet(walletsCache[key]);
        }
      }
      // 2. Push all transactions in cache
      if (transactionsCache) {
        for (const tx of transactionsCache) {
          await supabaseDb.saveWalletTransaction(tx);
        }
      }
      // 3. Push all purchases in cache
      if (purchasesCache) {
        for (const p of purchasesCache) {
          await supabaseDb.savePurchase(p);
        }
      }
      console.log('[Wallet DB] Sync to Supabase complete.');
    } catch (e) {
      console.error('[Wallet DB] Sync to Supabase failed (ignoring for resilience):', e);
    }
  }
};

export interface Purchase {
  id: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  amountPaid: number;
  transactionReference: string;
  credentialsShared: string;
  purchasedAt: string;
}

const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');
let purchasesCache: Purchase[] | null = null;

export const purchasesDb = {
  getPurchases(): Purchase[] {
    if (purchasesCache) {
      return purchasesCache;
    }

    ensureDataDir();
    let purchases: Purchase[] = [];

    let fileExists = false;
    try {
      fileExists = fs.existsSync(PURCHASES_FILE);
    } catch (_) {
      fileExists = false;
    }

    if (fileExists) {
      try {
        const content = fs.readFileSync(PURCHASES_FILE, 'utf-8');
        purchases = JSON.parse(content);
      } catch (err) {
        console.error('[Purchases DB] Failed to parse purchases.json, using empty array', err);
        purchases = [];
      }
    }

    purchasesCache = purchases;
    return purchases;
  },

  savePurchases(purchases: Purchase[]) {
    purchasesCache = purchases;
    ensureDataDir();
    try {
      fs.writeFileSync(PURCHASES_FILE, JSON.stringify(purchases, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Purchases DB] Failed to save purchases.json:', err);
    }
  },

  addPurchase(purchase: Purchase) {
    const list = this.getPurchases();
    // Prevent duplicate purchases with same transactionReference or credentials if already exists to keep DB perfectly clean
    const exists = list.some(p => p.id === purchase.id || (purchase.transactionReference && p.transactionReference === purchase.transactionReference));
    if (!exists) {
      list.unshift(purchase);
      this.savePurchases(list);
    }
  },

  getPurchasesForUser(email: string): Purchase[] {
    const cleanEmail = email.toLowerCase().trim();
    return this.getPurchases().filter(p => p.userEmail === cleanEmail);
  }
};
