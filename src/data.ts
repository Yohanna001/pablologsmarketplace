import { ProductListing, User, Order, Testimonial, Merchant, TrashItem } from './types';
import { supabase, supabaseDb, stringToUuid } from './supabaseClient';

// Global formatter helper displaying Nigerian Naira with sign before the amount
export const formatNaira = (value: number): string => {
  return `₦${Math.round(value).toLocaleString('en-US')}`;
};

// Seed product listings (in Nigerian Naira ₦)
export const INITIAL_LISTINGS: ProductListing[] = [
  {
    id: 'prod-1',
    title: 'Netflix Premium Ultra 4K UHD (Private Screen)',
    platform: 'Streaming',
    price: 15000,
    stock: 12,
    description: 'Enjoy premium Ultra HD 4K content with direct dedicated screen access, matching profile locks, and PIN features.',
    imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8fed85?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sellerId: 'system-merchant',
    sellerName: 'System Core Account Provider',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-2',
    title: 'Spotify Premium Individual (3 Months)',
    platform: 'Streaming',
    price: 10000,
    stock: 8,
    description: 'Ad-free premium music, unlimited skips, high-fidelity offline playback mode with customized plan setup.',
    imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sellerId: 'merchant-1',
    sellerName: 'Premium Sounds Ltd.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-3',
    title: 'Disney+ Premium High-Def (Shared Screen)',
    platform: 'Streaming',
    price: 12000,
    stock: 15,
    description: 'Unlock breathtaking Disney, Pixar, Marvel, Star Wars, and Nat Geo streams with high speed direct connections.',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sellerId: 'system-merchant',
    sellerName: 'System Core Account Provider',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-4',
    title: 'Xbox Game Pass Ultimate Core Membership',
    platform: 'Gaming',
    price: 25000,
    stock: 10,
    description: 'Unlimited access to over 100 high-quality console and PC games, including new day-one releases.',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sellerId: 'merchant-1',
    sellerName: 'Premium Sounds Ltd.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    title: 'Gmail Verified Legacy Account (Bulk Checked)',
    platform: 'Productivity',
    price: 8000,
    stock: 35,
    description: 'Aged verified Google account complete with recovery links, API-eligible status, and clean historical log integrity.',
    imageUrl: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sellerId: 'merchant-2',
    sellerName: 'FastStream Resellers',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod-6',
    title: 'Amazon Prime Video Private Account (1 Year)',
    platform: 'Streaming',
    price: 18500,
    stock: 6,
    description: 'Watch global Prime Originals, movies, award-winning series, plus super-fast free shipping perks.',
    imageUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    sellerId: 'system-merchant',
    sellerName: 'System Core Account Provider',
    createdAt: new Date().toISOString()
  }
];

// Seed users database
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Platform Administrator',
    email: 'admin@pablologs.com',
    role: 'admin',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'usr-buyer-live',
    name: 'Live Buyer',
    email: 'YohannaIsaac90@gmail.com',
    role: 'buyer',
    createdAt: new Date().toISOString()
  }
];

// Seed merchants database matching wireframe examples
export const INITIAL_MERCHANTS: Merchant[] = [];

// Seed orders database in Naira (₦)
export const INITIAL_ORDERS: Order[] = [];

// Seed testimonials for landing page
export const LANDING_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Alex Johnson',
    role: 'Verified Buyer',
    stars: 5,
    feedback: 'Amazing platform! Got my premium account instantly. The credentials work flawlessly and the pricing is unbeatable. Highly recommended for digital buyers!',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'test-2',
    name: 'Sarah Chen',
    role: 'Top Merchant',
    stars: 5,
    feedback: 'As a seller, Pablologsmarketplace has been fantastic. The escrow protection is highly reliable, payout streams are transparent, and the support team is incredible.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'test-3',
    name: 'Mike Rodriguez',
    role: 'Productivity Expert',
    stars: 5,
    feedback: 'The best marketplace for digital accounts. Found multiple design resources and premium platform codes safely. Customer service is lightning fast and solid.',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80'
  }
];

// Database utility manager using localStorage
export const db = {
  // Products
  getProducts(): ProductListing[] {
    const data = localStorage.getItem('pm_products_v5');
    if (!data) {
      localStorage.setItem('pm_products_v5', JSON.stringify(INITIAL_LISTINGS));
      return INITIAL_LISTINGS;
    }
    return JSON.parse(data);
  },
  saveProducts(products: ProductListing[]) {
    localStorage.setItem('pm_products_v5', JSON.stringify(products));
  },
  addProduct(product: ProductListing) {
    const list = this.getProducts();
    list.unshift(product);
    this.saveProducts(list);
    supabaseDb.saveProduct(product).catch(e => console.error('Supabase write-back error:', e));
  },
  updateProduct(updated: ProductListing) {
    const list = this.getProducts().map(p => {
      const matchExact = p.id === updated.id;
      const matchUuid = stringToUuid(p.id) === stringToUuid(updated.id);
      return (matchExact || matchUuid) ? { ...p, ...updated, id: p.id } : p;
    });
    this.saveProducts(list);
    supabaseDb.saveProduct(updated).catch(e => console.error('Supabase update error:', e));
  },
  deleteProduct(id: string) {
    const list = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(list);
    supabaseDb.deleteProduct(id).catch(e => console.error('Supabase delete error:', e));
  },

  // Merchants
  getMerchants(): Merchant[] {
    const data = localStorage.getItem('pm_merchants_v5');
    if (!data) {
      localStorage.setItem('pm_merchants_v5', JSON.stringify(INITIAL_MERCHANTS));
      return INITIAL_MERCHANTS;
    }
    return JSON.parse(data);
  },
  saveMerchants(merchants: Merchant[]) {
    localStorage.setItem('pm_merchants_v5', JSON.stringify(merchants));
  },
  addMerchant(merch: Merchant) {
    const list = this.getMerchants();
    list.unshift(merch);
    this.saveMerchants(list);
  },
  updateMerchant(updated: Merchant) {
    const list = this.getMerchants().map(m => m.id === updated.id ? updated : m);
    this.saveMerchants(list);
  },
  deleteMerchant(id: string) {
    // Permanently remove merchant and ALL their assets
    const list = this.getMerchants().filter(m => m.id !== id);
    this.saveMerchants(list);
    
    // Also mark all product listings associated with this merchant profile as soft-deleted / status 'inactive'
    const products = this.getProducts().map(p => {
      if (p.sellerId === id || p.merchantId === id) {
        return { ...p, isDeleted: true, status: 'inactive' as const, deletedAt: new Date().toISOString() };
      }
      return p;
    });
    this.saveProducts(products);
  },

  // Trash
  getTrash(): TrashItem[] {
    const data = localStorage.getItem('pm_trash_v5');
    if (!data) {
      localStorage.setItem('pm_trash_v5', JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  },
  saveTrash(trash: TrashItem[]) {
    localStorage.setItem('pm_trash_v5', JSON.stringify(trash));
  },
  addTrash(item: TrashItem) {
    const list = this.getTrash();
    list.unshift(item);
    this.saveTrash(list);
  },
  removeTrash(id: string) {
    const list = this.getTrash().filter(t => t.id !== id);
    this.saveTrash(list);
  },

  // Users
  getUsers(): User[] {
    const data = localStorage.getItem('pm_users_v5');
    if (!data) {
      localStorage.setItem('pm_users_v5', JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  saveUsers(users: User[]) {
    localStorage.setItem('pm_users_v5', JSON.stringify(users));
  },
  addUser(user: User) {
    const list = this.getUsers();
    list.push(user);
    this.saveUsers(list);
    supabaseDb.saveUser(user).catch(e => console.error('Supabase user save error:', e));
  },
  approveMerchant(email: string) {
    const list = this.getUsers().map(u => {
      if (u.email === email) {
        const updated = { ...u, isApprovedMerchant: true };
        supabaseDb.saveUser(updated).catch(e => console.error('Supabase merchant approval error:', e));
        return updated;
      }
      return u;
    });
    this.saveUsers(list);
  },

  // Orders
  getOrders(): Order[] {
    const data = localStorage.getItem('pm_orders_v5');
    if (!data) {
      localStorage.setItem('pm_orders_v5', JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(data);
  },
  saveOrders(orders: Order[]) {
    localStorage.setItem('pm_orders_v5', JSON.stringify(orders));
  },
  addOrder(order: Order) {
    const list = this.getOrders();
    list.unshift(order);
    this.saveOrders(list);
    supabaseDb.saveOrder(order).catch(e => console.error('Supabase order save error:', e));
  },
  updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'delivered', credentials?: string, deliveryInstructions?: string) {
    const list = this.getOrders().map(o => {
      const matchExact = o.id === orderId;
      const matchUuid = stringToUuid(o.id) === stringToUuid(orderId) || o.id === stringToUuid(orderId);
      if (matchExact || matchUuid) {
        const updated = { ...o, status };
        if (credentials) updated.credentialsShared = credentials;
        if (deliveryInstructions) updated.deliveryInstructions = deliveryInstructions;
        supabaseDb.saveOrder(updated).catch(e => console.error('Supabase order status update error:', e));
        return updated;
      }
      return o;
    });
    this.saveOrders(list);
  },

  // Supabase Sync Flow Orchestrator
  async syncFromSupabase(): Promise<boolean> {
    if (!supabase) return false;
    let changed = false;

    try {
      // 1. Sync Products
      let sProducts = await supabaseDb.getProducts();
      if (sProducts !== null) {
        if (sProducts.length === 0) {
          console.log('Seeding Supabase with initial listings...');
          for (const p of INITIAL_LISTINGS) {
            await supabaseDb.saveProduct(p);
          }
          sProducts = INITIAL_LISTINGS;
        }
        localStorage.setItem('pm_products_v5', JSON.stringify(sProducts));
        changed = true;
      }

      // 2. Sync Users
      let sUsers = await supabaseDb.getUsers();
      if (sUsers !== null) {
        if (sUsers.length === 0) {
          console.log('Seeding Supabase with initial users...');
          for (const u of INITIAL_USERS) {
            await supabaseDb.saveUser(u);
          }
          sUsers = INITIAL_USERS;
        }
        localStorage.setItem('pm_users_v5', JSON.stringify(sUsers));
        changed = true;
      }

      // 3. Sync Orders
      let sOrders = await supabaseDb.getOrders();
      if (sOrders !== null) {
        if (sOrders.length === 0) {
          console.log('Seeding Supabase with initial orders...');
          for (const o of INITIAL_ORDERS) {
            await supabaseDb.saveOrder(o);
          }
          sOrders = INITIAL_ORDERS;
        }
        localStorage.setItem('pm_orders_v5', JSON.stringify(sOrders));
        changed = true;
      }
    } catch (e) {
      console.error('Error in syncFromSupabase:', e);
    }

    return changed;
  }
};
