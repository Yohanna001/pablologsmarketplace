export type UserRole = 'buyer' | 'merchant' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isApprovedMerchant?: boolean; // Merchants must be approved by admin
  createdAt: string;
}

export interface CredentialEntry {
  email?: string;
  username?: string;
  password?: string;
  rawText?: string; // fallback raw credential detail e.g. license keys
  isSold: boolean;
}

export interface ProductListing {
  id: string;
  title: string;
  platform: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  credentials?: CredentialEntry[]; // List of accounts for instant delivery (encrypted/decrypted)
  deliveryMethod?: 'instant' | 'manual' | 'email';
  category?: string;
  status?: 'active' | 'inactive';
  merchantId?: string;       // NEW: link to merchant
  merchantName?: string;     // NEW: merchant display name
  isDeleted?: boolean;       // NEW: soft delete flag
  deletedAt?: string | null; // NEW: timestamp when deleted
  updatedAt?: string;        // NEW: timestamp when updated
}

export interface Merchant {
  id: string;
  userId: string;        // Link to auth user
  fullName: string;
  email: string;
  phone: string;
  storeName: string;
  storeDescription: string;
  typesOfAssets?: string[]; // Streaming, Gaming, etc.
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  totalAssets: number;
  totalSales: number;
  totalRevenue: number;
  appliedAt: string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export interface TrashItem {
  id: string;
  assetId: string;
  assetData: ProductListing;  // Full asset data before deletion
  deletedBy: string;
  deletedAt: string;
  expiresAt: string;  // Auto-delete after 30 days
}

export interface Order {
  id: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
  productId: string;
  productTitle: string;
  productPlatform: string;
  amount: number;
  status: 'pending' | 'paid' | 'delivered';
  paymentGateway: 'paystack' | 'stripe' | 'paypal';
  credentialsShared?: string; // The login/account details delivered on success
  deliveryInstructions?: string; // Delivery instructions for this order
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  stars: number;
  feedback: string;
  avatarUrl?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}
