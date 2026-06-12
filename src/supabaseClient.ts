import { createClient } from '@supabase/supabase-js';
import { ProductListing, User, Order } from './types';

let rawSupabaseUrl = (((import.meta as any).env?.VITE_SUPABASE_URL) || '').trim();
const supabaseAnonKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '').trim();

// Sanitize common copy-paste formatting errors
if (rawSupabaseUrl) {
  // 1. Check if user accidentally pasted their PostgreSQL database connection string (starts with postgres:// or postgresql://)
  if (rawSupabaseUrl.startsWith('postgres://') || rawSupabaseUrl.startsWith('postgresql://')) {
    // Standard format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@...
    const matchRef = rawSupabaseUrl.match(/postgres\.([^:@]+)/);
    if (matchRef && matchRef[1]) {
      rawSupabaseUrl = `https://${matchRef[1]}.supabase.co`;
    } else {
      // Direct database host format db.[PROJECT_REF].supabase.co
      const matchDb = rawSupabaseUrl.match(/db\.([^.]+)\.supabase/);
      if (matchDb && matchDb[1]) {
        rawSupabaseUrl = `https://${matchDb[1]}.supabase.co`;
      }
    }
  }

  // 2. Remove standard trailing REST endpoints /rest/v1/ or /rest/v1
  if (rawSupabaseUrl.endsWith('/rest/v1/')) {
    rawSupabaseUrl = rawSupabaseUrl.slice(0, -9);
  } else if (rawSupabaseUrl.endsWith('/rest/v1')) {
    rawSupabaseUrl = rawSupabaseUrl.slice(0, -8);
  }

  // 3. Trim trailing slash
  if (rawSupabaseUrl.endsWith('/')) {
    rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
  }
}

export const supabaseUrl = rawSupabaseUrl;

export const isConfigured = supabaseUrl && 
                     supabaseUrl !== 'https://your-project-ref.supabase.co' && 
                     supabaseAnonKey && 
                     supabaseAnonKey !== 'your-anon-public-api-key';

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!isConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set or are using placeholder values. falling back to localStorage.'
  );
} else {
  console.log('Supabase successfully initialized with URL:', supabaseUrl);
}

// SQL code to copy-paste into Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- Copy and paste this into your Supabase SQL Editor:

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  is_approved_merchant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT,
  price NUMERIC,
  stock INTEGER,
  description TEXT,
  image_url TEXT,
  seller_id TEXT,
  seller_name TEXT,
  delivery_method TEXT DEFAULT 'instant',
  category TEXT,
  status TEXT DEFAULT 'active',
  credentials TEXT, -- serialized JSON array of credentials [{email, password, isSold}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  buyer_email TEXT,
  buyer_name TEXT,
  customer_name TEXT, -- Included for multi-schema and third-party custom template compatibility
  customer_email TEXT, -- Included for multi-schema and third-party custom template compatibility
  product_id TEXT,
  product_title TEXT,
  product_platform TEXT,
  amount NUMERIC,
  status TEXT,
  credentials_shared TEXT,
  payment_gateway TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable all inserts and queries from front-end by disabling Row Level Security (RLS)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
`;

// Helper conversion functions (database snake_case to typescript camelCase)
function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as 'admin' | 'merchant' | 'buyer',
    isApprovedMerchant: row.is_approved_merchant,
    createdAt: row.created_at,
  };
}

function mapUserToDb(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_approved_merchant: user.isApprovedMerchant,
    created_at: user.createdAt,
  };
}

function mapProductFromDb(row: any): ProductListing {
  let credentialsList = undefined;
  if (row.credentials) {
    try {
      credentialsList = typeof row.credentials === 'string' ? JSON.parse(row.credentials) : row.credentials;
    } catch (e) {
      console.warn('Failed to parse credentials column from Supabase:', e);
    }
  }
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    price: Number(row.price),
    stock: row.stock,
    description: row.description,
    imageUrl: row.image_url,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    deliveryMethod: row.delivery_method || 'instant',
    category: row.category || 'Streaming',
    status: row.status || 'active',
    credentials: credentialsList,
    createdAt: row.created_at,
  };
}

function mapProductToDb(prod: ProductListing) {
  return {
    id: prod.id,
    title: prod.title,
    platform: prod.platform,
    price: prod.price,
    stock: prod.stock,
    description: prod.description,
    image_url: prod.imageUrl,
    seller_id: prod.sellerId,
    seller_name: prod.sellerName,
    delivery_method: prod.deliveryMethod || 'instant',
    category: prod.category || 'Streaming',
    status: prod.status || 'active',
    credentials: prod.credentials ? JSON.stringify(prod.credentials) : null,
    created_at: prod.createdAt,
  };
}

function mapOrderFromDb(row: any): Order {
  return {
    id: row.id,
    buyerEmail: row.buyer_email || row.customer_email || 'buyer@pablologs.com',
    buyerName: row.buyer_name || row.customer_name || 'Verified Buyer',
    productId: row.product_id,
    productTitle: row.product_title,
    productPlatform: row.product_platform,
    amount: Number(row.amount),
    status: row.status as 'pending' | 'paid' | 'delivered',
    credentialsShared: row.credentials_shared,
    paymentGateway: row.payment_gateway,
    createdAt: row.created_at,
  };
}

function mapOrderToDb(order: Order) {
  const finalEmail = order.buyerEmail || 'buyer@pablologs.com';
  const finalName = order.buyerName || 'Verified Buyer';
  return {
    id: order.id,
    buyer_email: finalEmail,
    buyer_name: finalName,
    customer_name: finalName, // Satisfy any non-null constraint on either column name
    customer_email: finalEmail, // Satisfy any non-null constraint on either column name
    product_id: order.productId,
    product_title: order.productTitle,
    product_platform: order.productPlatform,
    amount: order.amount,
    status: order.status,
    credentials_shared: order.credentialsShared,
    payment_gateway: order.paymentGateway,
    created_at: order.createdAt,
  };
}

// Helper to dynamically strip unrecognized columns from payload when table has divergent schema (PGRST204)
async function resilientUpsert(tableName: string, payload: any): Promise<{ error: any }> {
  if (!supabase) return { error: new Error('Supabase is not initialized') };
  const currentPayload = { ...payload };
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const { error } = await supabase.from(tableName).upsert(currentPayload);
    if (!error) {
      return { error: null };
    }
    
    const errMsg = error.message || '';
    const match = errMsg.match(/Could not find the '([^']+)' column/);
    if (match && match[1]) {
      const offendingColumn = match[1];
      console.warn(`[Supabase Auto-Heal] Auto-stripped missing column "${offendingColumn}" from table "${tableName}"`);
      delete currentPayload[offendingColumn];
      attempts++;
    } else {
      return { error };
    }
  }
  return { error: new Error(`Failed to save to "${tableName}" after removing unrecognized columns.`) };
}

// Supabase synchronization methods
export const supabaseDb = {
  async getProducts(): Promise<ProductListing[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching products from Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'products', error }
          }));
        }
        return null;
      }
      return data.map(mapProductFromDb);
    } catch (e: any) {
      console.error('Failed to sync products with Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'products', error: e }
        }));
      }
      return null;
    }
  },

  async saveProduct(product: ProductListing): Promise<boolean> {
    if (!supabase) return false;
    try {
      const dbRow = mapProductToDb(product);
      const { error } = await resilientUpsert('products', dbRow);
      if (error) {
        console.error('Error saving product to Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'products', error }
          }));
        }
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('Failed to save product to Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'products', error: e }
        }));
      }
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Error deleting product from Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'products', error }
          }));
        }
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('Failed to delete product from Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'products', error: e }
        }));
      }
      return false;
    }
  },

  async getUsers(): Promise<User[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Error fetching users from Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'users', error }
          }));
        }
        return null;
      }
      return data.map(mapUserFromDb);
    } catch (e: any) {
      console.error('Failed to sync users with Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'users', error: e }
        }));
      }
      return null;
    }
  },

  async saveUser(user: User): Promise<boolean> {
    if (!supabase) return false;
    try {
      const dbRow = mapUserToDb(user);
      const { error } = await resilientUpsert('users', dbRow);
      if (error) {
        console.error('Error saving user to Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'users', error }
          }));
        }
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('Failed to save user to Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'users', error: e }
        }));
      }
      return false;
    }
  },

  async getOrders(): Promise<Order[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching orders from Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'orders', error }
          }));
        }
        return null;
      }
      return data.map(mapOrderFromDb);
    } catch (e: any) {
      console.error('Failed to sync orders with Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'orders', error: e }
        }));
      }
      return null;
    }
  },

  async saveOrder(order: Order): Promise<boolean> {
    if (!supabase) return false;
    try {
      const dbRow = mapOrderToDb(order);
      const { error } = await resilientUpsert('orders', dbRow);
      if (error) {
        console.error('Error saving order to Supabase:', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-sync-error', {
            detail: { table: 'orders', error }
          }));
        }
        return false;
      }
      return true;
    } catch (e: any) {
      console.error('Failed to save order to Supabase:', e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabase-sync-error', {
          detail: { table: 'orders', error: e }
        }));
      }
      return false;
    }
  }
};
