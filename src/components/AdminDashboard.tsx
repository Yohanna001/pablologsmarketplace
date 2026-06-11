import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, Trash2, Edit, CheckCircle, Clock, ShieldAlert, Users, 
  ShoppingBag, TrendingUp, AlertCircle, RefreshCw, Layers, ShieldCheck,
  Eye, EyeOff, UploadCloud, Check, X, HelpCircle, Lock, Unlock,
  Database, Trash, Download, FileText, Store, UserX, ToggleLeft, ToggleRight,
  Clipboard, Search, AlertTriangle, Globe
} from 'lucide-react';
import { ProductListing, User, Order, CredentialEntry, Merchant, TrashItem } from '../types';
import { db, formatNaira } from '../data';
import { encryptCredentials, decryptCredentials } from '../utils/crypto';
import { supabase, supabaseUrl, isConfigured } from '../supabaseClient';

interface AdminDashboardProps {
  currentUser: User | null;
  listings: ProductListing[];
  orders: Order[];
  users: User[];
  onRefreshData: () => void;
  adminSession?: any;
  adminToken?: string;
  onAdminLogout?: () => void;
  activeTab?: 'listings' | 'merchants' | 'orders' | 'users' | 'trash' | 'create' | 'supabase' | 'settings' | 'webhooks';
  onTabChange?: (tab: 'listings' | 'merchants' | 'orders' | 'users' | 'trash' | 'create' | 'supabase' | 'settings' | 'webhooks') => void;
}

export default function AdminDashboard({ 
  currentUser, 
  listings, 
  orders, 
  users, 
  onRefreshData,
  adminSession,
  adminToken,
  onAdminLogout,
  activeTab: propActiveTab,
  onTabChange
}: AdminDashboardProps) {
  // Tabs Navigation: listings, merchants, orders, users, trash, create, supabase, settings, webhooks
  const [localActiveTab, setLocalActiveTab] = useState<'listings' | 'merchants' | 'orders' | 'users' | 'trash' | 'create' | 'supabase' | 'settings' | 'webhooks'>('listings');

  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = (tab: any) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  // State hooks for password changes
  const [currentPassword, setCurrentPassword] = useState('');
  const [settingNewPassword, setSettingNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // State hooks for administration log entries
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  // State hooks for new admin creation (super admin helper)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'moderator'>('admin');
  const [newAdminLoading, setNewAdminLoading] = useState(false);
  const [newAdminError, setNewAdminError] = useState('');
  const [newAdminSuccess, setNewAdminSuccess] = useState('');

  // Fetch security activity logs
  const fetchLogs = async () => {
    if (!adminToken) return;
    setLogsLoading(true);
    setLogsError('');
    try {
      const response = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setActivityLogs(data.logs);
      } else {
        setLogsError(data.message || 'Failed to retrieve administrative action logs.');
      }
    } catch (err) {
      setLogsError('Failed to call security logs endpoint due to networking problems.');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' && adminToken) {
      fetchLogs();
    }
  }, [activeTab, adminToken]);

  // --- FLUTTERWAVE WEBHOOK SIMULATION ENGINE STATICS & ACTIONS ---
  const [webhookSimSecret, setWebhookSimSecret] = useState('MyEscrowSecureHash2026');
  const [webhookSimRef, setWebhookSimRef] = useState('');
  const [webhookSimAmount, setWebhookSimAmount] = useState('25000');
  const [webhookSimStatus, setWebhookSimStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [webhookSimFeedback, setWebhookSimFeedback] = useState('');

  useEffect(() => {
    if (orders && orders.length > 0 && !webhookSimRef) {
      setWebhookSimRef(orders[0].id || '');
      setWebhookSimAmount(String(orders[0].amount || '25000'));
    }
  }, [orders, activeTab]);

  const runWebhookSimulation = async () => {
    if (!webhookSimRef) {
      setWebhookSimStatus('failed');
      setWebhookSimFeedback('Please select or specify a clean transaction reference code.');
      return;
    }

    setWebhookSimStatus('testing');
    setWebhookSimFeedback('Constructing and transmitting mock charge.completed event payload containing secure headers. Please wait...');

    try {
      const payload = {
        event: 'charge.completed',
        data: {
          id: Math.floor(1000000 + Math.random() * 9000000).toString(),
          tx_ref: webhookSimRef,
          amount: Number(webhookSimAmount),
          currency: 'NGN',
          status: 'successful',
          customer: {
            email: 'buyer@customer.com',
            name: 'Sarah Customer'
          }
        }
      };

      const response = await fetch('/api/flutterwave/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'verif-hash': webhookSimSecret
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setWebhookSimStatus('success');
        setWebhookSimFeedback(`🎉 Webhook validated and verified successfully!\n\nStatus code: ${response.status} OK\nServer Response Payload:\n${JSON.stringify(data, null, 2)}`);
        onRefreshData();
      } else {
        setWebhookSimStatus('failed');
        setWebhookSimFeedback(`❌ Webhook payload rejected or signature unmatched!\n\nStatus code: ${response.status}\nServer Error Response:\n${JSON.stringify(data, null, 2)}\n\n💡 Reason:\n1. If a FLUTTERWAVE_WEBHOOK_SECRET has been loaded in your .env or server environment, your simulator input signature "${webhookSimSecret}" must match it exactly.\n2. In production setups, Flutterwave's transaction validation service will crosscheck fake transactions against real API logs and reject fraud attempts.`);
      }
    } catch (err: any) {
      setWebhookSimStatus('failed');
      setWebhookSimFeedback(`⚠️ Network Connection Refused: ${err.message || err}`);
    }
  };

  // Execute password change query
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !settingNewPassword || !settingsConfirmPassword) {
      setSettingsError('Please fill out all password fields.');
      return;
    }

    if (settingNewPassword !== settingsConfirmPassword) {
      setSettingsError('New passwords do not match.');
      return;
    }

    // Requirements validation
    const hasEightChars = settingNewPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(settingNewPassword);
    const hasNumber = /[0-9]/.test(settingNewPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(settingNewPassword);

    if (!hasEightChars || !hasUppercase || !hasNumber || !hasSpecial) {
      setSettingsError('Complexity mismatch: New password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.');
      return;
    }

    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword: settingNewPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setSettingsSuccess('Excellent! Your administrator password was updated successfully.');
        setCurrentPassword('');
        setSettingNewPassword('');
        setSettingsConfirmPassword('');
        fetchLogs(); // refresh audit logs since action is logged
      } else {
        setSettingsError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setSettingsError('CORS / adblock or Network failure occurred during password update.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Execute additional admin creation
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword || !newAdminFullName) {
      setNewAdminError('All admin account properties are required.');
      return;
    }

    setNewAdminLoading(true);
    setNewAdminError('');
    setNewAdminSuccess('');

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          fullName: newAdminFullName,
          role: newAdminRole
        })
      });

      const data = await response.json();
      if (response.ok) {
        setNewAdminSuccess(`Admin account created successfully for "${data.admin.fullName}" (${data.admin.email})!`);
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminFullName('');
        setNewAdminRole('admin');
        fetchLogs(); // refresh security logs
      } else {
        setNewAdminError(data.message || 'Failed to create administration account.');
      }
    } catch (err) {
      setNewAdminError('Network error connecting to administration creation endpoint.');
    } finally {
      setNewAdminLoading(false);
    }
  };

  // Local state persisted inside LocalStorage via db
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);

  // Selection states for Bulk actions
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // Modals Overlay Control state
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<ProductListing | null>(null);
  const [reuploadAsset, setReuploadAsset] = useState<ProductListing | null>(null);
  const [rejectionMerchant, setRejectionMerchant] = useState<Merchant | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [csvExportData, setCsvExportData] = useState<string | null>(null);

  // Quick Reupload Inner states
  const [reuploadCredentialsText, setReuploadCredentialsText] = useState('');
  const [reuploadImageUrlLocal, setReuploadImageUrlLocal] = useState('');

  // Form Fields State (Upload Form Tab)
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Netflix');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [credentialsText, setCredentialsText] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'instant' | 'manual' | 'email'>('instant');
  const [category, setCategory] = useState('Streaming');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedCredsId, setRevealedCredsId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Supabase Connection Diagnostics state
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed_fetch' | 'unconfigured' | 'error'>('idle');
  const [testFeedback, setTestFeedback] = useState<string>('');

  const runConnectionTest = async () => {
    if (!isConfigured || !supabase) {
      setTestStatus('unconfigured');
      setTestFeedback('Supabase credentials are not configured or are using default placeholders in environment variables.');
      return;
    }
    setTestStatus('testing');
    setTestFeedback('Initiating connection test to Supabase REST and Ping endpoints...');
    try {
      const start = Date.now();
      const { error } = await supabase.from('products').select('id').limit(1);
      const duration = Date.now() - start;
      if (error) {
        setTestStatus('error');
        setTestFeedback(`Successfully connected to Supabase in ${duration}ms, but database returned SQL Error: [${error.code}] ${error.message}`);
      } else {
        setTestStatus('success');
        setTestFeedback(`Superb! Successfully connected to Supabase in ${duration}ms. Rest query completed with 200 OK.`);
      }
    } catch (err: any) {
      console.error('Supabase diagnostic probe error:', err);
      // Determine if it looks like a failed to fetch
      setTestStatus('failed_fetch');
      setTestFeedback('CORS Block / Network Error (TypeError: Failed to fetch). This is a client browser request failure, usually caused by ad-blockers (such as uBlock Origin, Brave Shield, Privacy Badger, or AdBlock Plus) blocking access to your Supabase host.');
    }
  };

  // Merchant search & status filters
  const [merchantFilter, setMerchantFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [merchantSearch, setMerchantSearch] = useState('');

  // Load and sync database arrays internally
  const refreshLocalState = () => {
    setMerchants(db.getMerchants());
    setTrash(db.getTrash());
  };

  useEffect(() => {
    refreshLocalState();
  }, [listings, orders, users]);

  // Image preset list
  const imagePresets = [
    { label: 'Netflix', url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8fed85?w=500&auto=format&fit=crop&q=60' },
    { label: 'Spotify', url: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&auto=format&fit=crop&q=60' },
    { label: 'Disney+', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=60' },
    { label: 'Xbox', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60' },
    { label: 'ChatGPT / AI', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60' },
    { label: 'Canva Design', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' },
    { label: 'Amazon Prime', url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=500&auto=format&fit=crop&q=60' }
  ];

  // Active items (listings that are NOT soft deleted)
  const activeProductsList = useMemo(() => {
    return listings.filter(l => !l.isDeleted);
  }, [listings]);

  // Deleted items
  const deletedProductsList = useMemo(() => {
    return listings.filter(l => l.isDeleted);
  }, [listings]);

  // Gross Escrow Sales Calculations
  const revenue = useMemo(() => {
    return orders
      .filter(o => o.status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);

  const activeAssetsCount = useMemo(() => {
    return activeProductsList.filter(p => p.status === 'active').length;
  }, [activeProductsList]);

  const totalMerchantsCount = useMemo(() => {
    return merchants.length;
  }, [merchants]);

  const pendingMerchantsCount = useMemo(() => {
    return merchants.filter(m => m.status === 'pending').length;
  }, [merchants]);

  // File drag & drop setup
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file, setImageUrl);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, imageSetter: (url: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0], imageSetter);
    }
  };

  const processUploadedFile = (file: File, imageSetter: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file formats (PNG, JPG, JPEG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        imageSetter(event.target.result as string);
        alert(`Successfully processed and compressed image key: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Synchronize stock on catalog form
  const handleCredentialsTextChange = (text: string) => {
    setCredentialsText(text);
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      setStock(lines.length.toString());
    }
  };

  // Main Asset Catalog saving trigger
  const handleSaveListing = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title || !price || !description) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock) || 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price structure.');
      return;
    }

    let parsedCredentials: CredentialEntry[] = [];
    if (credentialsText.trim()) {
      const lines = credentialsText.split('\n').filter(line => line.trim() !== '');
      parsedCredentials = lines.map(line => {
        const parts = line.split(':');
        return {
          email: encryptCredentials(parts[0]?.trim() || ''),
          password: encryptCredentials(parts.slice(1).join(':')?.trim() || ''),
          rawText: encryptCredentials(line.trim()),
          isSold: false
        };
      });
    }

    const finalImg = imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';

    if (editingId) {
      const existing = listings.find(p => p.id === editingId);
      if (existing) {
        const mergedCreds = parsedCredentials.map(newC => {
          const rawPlain = decryptCredentials(newC.rawText || '');
          const matchedSold = existing.credentials?.find(oldC => decryptCredentials(oldC.rawText || '') === rawPlain && oldC.isSold);
          if (matchedSold) {
            return { ...newC, isSold: true };
          }
          return newC;
        });

        const finalStock = mergedCreds.length > 0 ? mergedCreds.filter(c => !c.isSold).length : stockNum;

        const updated: ProductListing = {
          ...existing,
          title,
          platform,
          price: priceNum,
          stock: finalStock,
          description,
          imageUrl: finalImg,
          deliveryMethod,
          category,
          status,
          credentials: mergedCreds.length > 0 ? mergedCreds : existing.credentials,
          updatedAt: new Date().toISOString()
        };
        db.updateProduct(updated);
        setFormSuccess('Asset listings optimized and updated inside store directory!');
      }
      setEditingId(null);
    } else {
      const newListing: ProductListing = {
        id: `prod-${Date.now()}`,
        title,
        platform,
        price: priceNum,
        stock: parsedCredentials.length > 0 ? parsedCredentials.length : stockNum,
        description,
        imageUrl: finalImg,
        sellerId: currentUser?.id || 'admin-system',
        sellerName: currentUser?.name || 'Platform Administrator',
        createdAt: new Date().toISOString(),
        deliveryMethod,
        category,
        status,
        credentials: parsedCredentials,
        isDeleted: false
      };
      db.addProduct(newListing);
      setFormSuccess('New digital asset listing published successfully in marketplace!');
    }

    // Reset fields
    setTitle('');
    setPrice('');
    setStock('');
    setCredentialsText('');
    setDescription('');
    setImageUrl('');
    setDeliveryMethod('instant');
    setCategory('Streaming');
    setStatus('active');

    onRefreshData();

    setTimeout(() => {
      setActiveTab('listings');
      setFormSuccess('');
    }, 1000);
  };

  const startEdit = (prod: ProductListing) => {
    setEditingId(prod.id);
    setTitle(prod.title);
    setPlatform(prod.platform);
    setPrice(prod.price.toString());
    setStock(prod.stock.toString());
    setDescription(prod.description);
    setImageUrl(prod.imageUrl);
    setDeliveryMethod(prod.deliveryMethod || 'instant');
    setCategory(prod.category || 'Streaming');
    setStatus(prod.status || 'active');

    if (prod.credentials && prod.credentials.length > 0) {
      const reconstituted = prod.credentials.map(c => {
        const plainEmail = decryptCredentials(c.email || '');
        const plainPassword = decryptCredentials(c.password || '');
        const plainRaw = decryptCredentials(c.rawText || '');
        return plainEmail && plainPassword ? `${plainEmail}:${plainPassword}` : plainRaw;
      }).join('\n');
      setCredentialsText(reconstituted);
    } else {
      setCredentialsText('');
    }

    setActiveTab('create');
  };

  const handleRevealCredentials = (prod: ProductListing) => {
    setRevealedCredsId(revealedCredsId === prod.id ? null : prod.id);
  };

  const handleToggleStatusDirectly = (prod: ProductListing) => {
    const nextStatus = prod.status === 'inactive' ? 'active' : 'inactive';
    const updated = { ...prod, status: nextStatus as 'active' | 'inactive' };
    db.updateProduct(updated);
    onRefreshData();
  };

  // Asset deleting confirmation workflow
  const openDeleteModal = (prod: ProductListing) => {
    setDeleteConfirmAsset(prod);
  };

  const executeSoftDelete = (prod: ProductListing) => {
    const trashItem: TrashItem = {
      id: `trash-${Date.now()}`,
      assetId: prod.id,
      assetData: prod,
      deletedBy: currentUser?.name || 'Administrator',
      deletedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    db.addTrash(trashItem);

    const updated = { 
      ...prod, 
      isDeleted: true, 
      status: 'inactive' as const, 
      deletedAt: new Date().toISOString() 
    };
    db.updateProduct(updated);
    onRefreshData();
    setDeleteConfirmAsset(null);
    alert('Listing moved safely into the Trash 📦 and hidden from buyers.');
  };

  const executeHardDelete = (prodId: string) => {
    db.deleteProduct(prodId);
    onRefreshData();
    setDeleteConfirmAsset(null);
    alert('Asset record permanently wiped out of both local indices and Supabase catalogs!');
  };

  // Bulk actions triggers
  const handleSelectAsset = (id: string) => {
    if (selectedAssets.includes(id)) {
      setSelectedAssets(selectedAssets.filter(x => x !== id));
    } else {
      setSelectedAssets([...selectedAssets, id]);
    }
  };

  const handleSelectAllAssets = () => {
    if (selectedAssets.length === activeProductsList.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(activeProductsList.map(p => p.id));
    }
  };

  const executeBulkSoftDelete = () => {
    if (selectedAssets.length === 0) return;
    if (window.confirm(`Are you sure you want to move ${selectedAssets.length} selected assets to the trash?`)) {
      selectedAssets.forEach(id => {
        const prod = listings.find(p => p.id === id);
        if (prod) {
          const trashItem: TrashItem = {
            id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            assetId: prod.id,
            assetData: prod,
            deletedBy: currentUser?.name || 'Administrator',
            deletedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          };
          db.addTrash(trashItem);

          const updated = { ...prod, isDeleted: true, status: 'inactive' as const, deletedAt: new Date().toISOString() };
          db.updateProduct(updated);
        }
      });
      setSelectedAssets([]);
      onRefreshData();
      alert('Selected listings moved safely to trash storage!');
    }
  };

  const executeBulkHardDelete = () => {
    if (selectedAssets.length === 0) return;
    if (window.confirm(`⚠️ CRITICAL IRREVERSIBLE ACTION: Permanently wipe ${selectedAssets.length} assets out of the database?`)) {
      selectedAssets.forEach(id => {
        db.deleteProduct(id);
      });
      setSelectedAssets([]);
      onRefreshData();
      alert('Wiped specified items successfully.');
    }
  };

  // Trash recovery / restoration
  const handleRestoreFromTrash = (trashCol: TrashItem) => {
    const updated = { 
      ...trashCol.assetData, 
      isDeleted: false, 
      status: 'active' as const, 
      deletedAt: null 
    };
    db.updateProduct(updated);
    db.removeTrash(trashCol.id);
    onRefreshData();
    alert('Asset listing restored perfectly back to standard Active marketplace lobby!');
  };

  const handleHardDeleteTrashItem = (trashCol: TrashItem) => {
    if (window.confirm('Wipe this item from the face of the earth permanently?')) {
      db.deleteProduct(trashCol.assetId);
      db.removeTrash(trashCol.id);
      onRefreshData();
      alert('Permanently eliminated trash cache record.');
    }
  };

  // Reupload Inner Modal
  const openReuploadModal = (prod: ProductListing) => {
    setReuploadAsset(prod);
    setReuploadImageUrlLocal(prod.imageUrl || '');
    if (prod.credentials && prod.credentials.length > 0) {
      const plainText = prod.credentials.map(c => {
        const emails = decryptCredentials(c.email || '');
        const passwords = decryptCredentials(c.password || '');
        const raws = decryptCredentials(c.rawText || '');
        return emails && passwords ? `${emails}:${passwords}` : raws;
      }).join('\n');
      setReuploadCredentialsText(plainText);
    } else {
      setReuploadCredentialsText('');
    }
  };

  const handleSaveQuickReupload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadAsset) return;

    let parsed: CredentialEntry[] = [];
    if (reuploadCredentialsText.trim()) {
      parsed = reuploadCredentialsText.split('\n').filter(line => line.trim() !== '').map(line => {
        const parts = line.split(':');
        return {
          email: encryptCredentials(parts[0]?.trim() || ''),
          password: encryptCredentials(parts.slice(1).join(':')?.trim() || ''),
          rawText: encryptCredentials(line.trim()),
          isSold: false
        };
      });
    }

    const updated: ProductListing = {
      ...reuploadAsset,
      credentials: parsed,
      stock: parsed.length > 0 ? parsed.filter(p => !p.isSold).length : reuploadAsset.stock,
      imageUrl: reuploadImageUrlLocal || reuploadAsset.imageUrl,
      status: 'active', // Automatically make active on stock replenishment
      updatedAt: new Date().toISOString()
    };

    db.updateProduct(updated);
    onRefreshData();
    setReuploadAsset(null);
    alert('Credential inventory and preview image reuploaded successfully!');
  };

  // Merchant operations
  const filteredMerchantsList = useMemo(() => {
    return merchants.filter(m => {
      const matchSearch = m.fullName.toLowerCase().includes(merchantSearch.toLowerCase()) || 
                          m.storeName.toLowerCase().includes(merchantSearch.toLowerCase()) || 
                          m.email.toLowerCase().includes(merchantSearch.toLowerCase());
      if (merchantFilter === 'all') return matchSearch;
      return m.status === merchantFilter && matchSearch;
    });
  }, [merchants, merchantFilter, merchantSearch]);

  const handleApprovePartner = (mId: string, email: string) => {
    const list = merchants.map(m => {
      if (m.id === mId) {
        return { ...m, status: 'approved' as const, approvedAt: new Date().toISOString() };
      }
      return m;
    });
    db.saveMerchants(list);

    // Sync with store users role approval
    db.approveMerchant(email);
    onRefreshData();
    alert(`🎉 Merchant Approved! Automated Verification Email status triggered and dispatched to ${email}!`);
  };

  const handleOpenRejectModal = (m: Merchant) => {
    setRejectionMerchant(m);
    setRejectionReasonInput('');
  };

  const executeRejectPartner = () => {
    if (!rejectionMerchant) return;
    const reason = rejectionReasonInput.trim() || 'Did not meet platform safety and validation criteria.';

    const list = merchants.map(m => {
      if (m.id === rejectionMerchant.id) {
        return { ...m, status: 'rejected' as const, rejectionReason: reason };
      }
      return m;
    });
    db.saveMerchants(list);
    onRefreshData();
    
    setRejectionMerchant(null);
    alert(`❌ Application Rejected. Stated reason dispatched inside rejection mail to ${rejectionMerchant.email}!`);
  };

  const handleToggleSuspendPartner = (m: Merchant) => {
    const nextStatus = m.status === 'suspended' ? 'approved' : 'suspended';
    
    // Update merchant status
    const mList = merchants.map(x => {
      if (x.id === m.id) return { ...x, status: nextStatus };
      return x;
    });
    db.saveMerchants(mList);

    // If suspended, deactivate all their listed assets instantly
    if (nextStatus === 'suspended') {
      const updatedProducts = listings.map(p => {
        if (p.sellerId === m.userId || p.merchantId === m.id) {
          return { ...p, status: 'inactive' as const };
        }
        return p;
      });
      db.saveProducts(updatedProducts);
    }
    
    onRefreshData();
    alert(`Merchant state modified to: ${nextStatus.toUpperCase()}. Associated inventory items disabled.`);
  };

  const handlePermanentDeletePartner = (m: Merchant) => {
    if (window.confirm(`🔮 IRREVERSIBLE: Delete Merchant '${m.fullName}' and purge ALL their design listings?`)) {
      db.deleteMerchant(m.id);
      onRefreshData();
      alert('Merchant and all their assets deleted successfully.');
    }
  };

  // CSV Exporter engine
  const handleExportMerchantsCSV = () => {
    const sorted = [...merchants].sort((a, b) => b.totalRevenue - a.totalRevenue);
    let csv = 'Merchant ID,Full Name,Email,Store Name,Status,Applied At,Total Assets,Sales Volume,Gross Revenue (Naira)\n';
    
    sorted.forEach(m => {
      csv += `"${m.id}","${m.fullName}","${m.email}","${m.storeName}","${m.status}","${m.appliedAt}",${m.totalAssets},${m.totalSales},${m.totalRevenue}\n`;
    });

    setCsvExportData(csv);
  };

  const handleOrderStatusToggle = (orderId: string, currentStatus: 'pending' | 'paid' | 'delivered') => {
    let nextStatus: 'pending' | 'paid' | 'delivered' = 'pending';
    if (currentStatus === 'pending') nextStatus = 'paid';
    else if (currentStatus === 'paid') nextStatus = 'delivered';

    db.updateOrderStatus(orderId, nextStatus);
    onRefreshData();
  };

  return (
    <div id="admin-dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-normal text-[#1A1A2E] flex items-center gap-2">
            <Layers className="w-8 h-8 text-[#0F3460]" />
            Control Hub & Administration
          </h1>
          <p className="text-sm text-[#4A4A6A] mt-1">
            Logged in as <b className="text-[#1D3460] font-bold">{adminSession ? `${adminSession.fullName} (${adminSession.role === 'super_admin' ? 'Super Admin' : adminSession.role})` : `${currentUser?.name} (${currentUser?.role})`}</b>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {adminSession && onAdminLogout && (
            <button
              id="admin-logout-btn"
              onClick={onAdminLogout}
              className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold bg-[#E94560]/10 hover:bg-[#E94560]/20 text-[#E94560] border border-[#E94560]/20 rounded-full transition cursor-pointer min-h-[40px] shadow-xs"
            >
              Sign Out Securely 🔓
            </button>
          )}

          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white border border-[#E0E0E0] hover:bg-slate-50 text-[#4A4A6A] rounded-full shadow-xs cursor-pointer min-h-[40px]"
          >
            <RefreshCw className="w-4 h-4 text-[#0F3460]" />
            Synchronize Indices
          </button>
        </div>
      </div>

      {/* KPI DASHBOARD CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Card 1: Sales */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#4A4A6A] uppercase tracking-wider block mb-1">Gross Escrow Volume</span>
            <span className="text-2xl font-extrabold text-[#1A1A2E]">{formatNaira(revenue)}</span>
          </div>
          <div className="p-3 bg-slate-50 text-[#0F3460] rounded-xl border border-[#E0E0E0]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active items */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#4A4A6A] uppercase tracking-wider block mb-1">Active Assets Published</span>
            <span className="text-2xl font-extrabold text-[#1A1A2E]">{activeProductsList.length} Listings</span>
          </div>
          <div className="p-3 bg-slate-50 text-[#0F3460] rounded-xl border border-[#E0E0E0]">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total partners */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#4A4A6A] uppercase tracking-wider block mb-1">Registered Partners</span>
            <span className="text-2xl font-extrabold text-[#1A1A2E]">{totalMerchantsCount} Merchants</span>
          </div>
          <div className="p-3 bg-slate-50 text-[#4A4A6A] rounded-xl border border-[#E0E0E0]">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pending reviews */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#4A4A6A] uppercase tracking-wider block mb-1">Pending Requests</span>
            <span className={`text-2xl font-extrabold ${pendingMerchantsCount > 0 ? 'text-[#E94560]' : 'text-slate-700'}`}>
              {pendingMerchantsCount} Pending
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${pendingMerchantsCount > 0 ? 'bg-rose-50 text-[#E94560] border-rose-100' : 'bg-slate-50 text-[#4A4A6A] border-[#E0E0E0]'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* DASHBOARD NAVIGATION MENUS (UPDATED) */}
      <div className="border-b border-[#E0E0E0] mb-8 flex overflow-x-auto gap-2 scrollbar-none">
        
        {/* Assets Tab button */}
        <button
          id="admin-tab-listings"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'listings' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          📂 Assets ({activeProductsList.length})
        </button>

        {/* Merchants Tab button with Notification badge */}
        <button
          id="admin-tab-merchants"
          onClick={() => setActiveTab('merchants')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'merchants' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          👥 Merchants
          {pendingMerchantsCount > 0 && (
            <span className="bg-[#E94560] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full select-none animate-bounce">
              🔴 {pendingMerchantsCount}
            </span>
          )}
        </button>

        {/* Orders Tab button */}
        <button
          id="admin-tab-orders"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          🛒 Orders ({orders.length})
        </button>

        {/* Users Tab button */}
        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          👤 Users ({users.length})
        </button>

        {/* Trash Tab button with notification badge */}
        <button
          id="admin-tab-trash"
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'trash' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          📦 Trash Soft Storage
          {trash.length > 0 && (
            <span className="bg-slate-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
              {trash.length}
            </span>
          )}
        </button>

        {/* Upload Button */}
        <button
          id="admin-tab-create"
          onClick={() => {
            setEditingId(null);
            setTitle('');
            setPlatform('Netflix');
            setPrice('');
            setStock('');
            setCredentialsText('');
            setDescription('');
            setImageUrl('');
            setDeliveryMethod('instant');
            setCategory('Streaming');
            setStatus('active');
            setActiveTab('create');
          }}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeTab === 'create' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          {editingId ? 'Edit Asset' : 'Upload Digital Asset'}
        </button>

        {/* Supabase Doctor Button */}
        <button
          id="admin-tab-supabase"
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'supabase' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          <Database className="w-4 h-4 text-[#0F3460]" />
          Supabase Doctor
        </button>

        {/* Settings Tab Button */}
        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'settings' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          ⚙️ Settings & Logs
        </button>

        {/* Webhooks Tab Button */}
        <button
          id="admin-tab-webhooks"
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'webhooks' ? 'border-[#0F3460] text-[#0F3460] font-bold' : 'border-transparent text-slate-400 hover:text-[#0F3460]'
          }`}
        >
          ⚓ Flutterwave Webhooks
        </button>

      </div>

      {/* VIEW PANEL ROUTER SWITCHES */}

      {/* Tab 1: DIGITAL ASSETS MANAGER (Active items list) */}
      {activeTab === 'listings' && (
        <div id="admin-listings-view" className="space-y-4">
          
          {/* BULK ACTION HEADLINES BAR */}
          {selectedAssets.length > 0 && (
            <div className="bg-[#1A1A2E]/5 border border-slate-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-[slideIn_0.2s_ease]">
              <span className="text-xs font-semibold text-[#1A1A2E]">
                💼 <b>{selectedAssets.length}</b> digital assets selected for bulk processing
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={executeBulkSoftDelete}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Move to Trash 📦
                </button>
                <button
                  type="button"
                  onClick={executeBulkHardDelete}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-[#E94560] hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Permanent Wipe ❌
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAssets([])}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-[#4A4A6A] rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#F5F5F7] border-b border-[#E0E0E0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-sm text-[#1A1A2E]">Digital Assets Inventory & Credentials Ledger</h3>
                <p className="text-[11px] text-[#4A4A6A] mt-0.5">Use selection checkboxes for bulk soft deletes or permanent assets purging.</p>
              </div>
              <span className="text-[10px] text-[#4A4A6A] font-extrabold uppercase bg-white px-2.5 py-1 rounded-full border border-[#E0E0E0] tracking-wider">
                {activeProductsList.length} Active Listings
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-[#E0E0E0] text-[10px] uppercase font-bold tracking-wider select-none">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox"
                        checked={selectedAssets.length === activeProductsList.length && activeProductsList.length > 0}
                        onChange={handleSelectAllAssets}
                        className="cursor-pointer rounded border-slate-300"
                        title="Select All"
                      />
                    </th>
                    <th className="p-4">Product Name & Title</th>
                    <th className="p-4">Platform</th>
                    <th className="p-4">Price (₦)</th>
                    <th className="p-4">Cred Stock</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Inventory Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]/60 text-[#4A4A6A]">
                  {activeProductsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 font-medium italic">
                        No active digital assets listed inside the database. Click "+ Add Asset" tab to begin uploads!
                      </td>
                    </tr>
                  ) : (
                    activeProductsList.map(prod => {
                      const encryptedCount = prod.credentials?.length || 0;
                      const soldCount = prod.credentials?.filter(c => c.isSold).length || 0;
                      const unsoldCount = encryptedCount - soldCount;
                      const isChecked = selectedAssets.includes(prod.id);

                      return (
                        <React.Fragment key={prod.id}>
                          <tr className={`hover:bg-slate-50/50 transition-all ${isChecked ? 'bg-slate-50' : ''}`}>
                            {/* Checkbox column */}
                            <td className="p-4 text-center">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectAsset(prod.id)}
                                className="cursor-pointer"
                              />
                            </td>

                            {/* Title & info */}
                            <td className="p-4 font-medium text-[#1A1A2E]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-[#E0E0E0]">
                                  <img 
                                    src={prod.imageUrl} 
                                    alt={prod.title} 
                                    referrerPolicy="no-referrer" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'; }} 
                                  />
                                </div>
                                <div>
                                  <span className="line-clamp-1 max-w-[200px] font-semibold text-neutral-800" title={prod.title}>
                                    {prod.title}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[9px] text-[#4A4A6A] select-all">ID: {prod.id}</span>
                                    {prod.sellerName && (
                                      <span className="text-[9px] font-bold text-[#0F3460] bg-slate-100 px-1 py-0.2 rounded">
                                        👤 {prod.sellerName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Platform badge */}
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-[#0F3460] font-sans border font-extrabold uppercase tracking-wide">
                                {prod.platform}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="p-4 font-extrabold text-[#E94560]">{formatNaira(prod.price)}</td>

                            {/* Stock & Creds details count */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  prod.stock === 0 ? 'bg-red-50 text-red-600 border border-red-100' : 
                                  prod.stock <= 3 ? 'bg-rose-50 text-[#E94560] border border-rose-100' : 'bg-[#F2FAF5] text-emerald-800'
                                }`}>
                                  {prod.stock} units
                                </span>
                                {encryptedCount > 0 && (
                                  <div className="text-[9px] text-[#4A4A6A] font-medium font-mono">
                                    ({unsoldCount} unsold / {soldCount} sold)
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Delivery Method */}
                            <td className="p-4 capitalize font-semibold text-slate-500">
                              {prod.deliveryMethod || 'instant'}
                            </td>

                            {/* Status logic */}
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleStatusDirectly(prod)}
                                className="flex items-center gap-1 hover:opacity-80 transition cursor-pointer"
                                title="Click to quickly toggle catalog status visibility"
                              >
                                {prod.status !== 'inactive' ? (
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 font-extrabold text-[10px] px-2 py-1 rounded inline-flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active
                                  </span>
                                ) : (
                                  <span className="text-rose-700 bg-rose-50 border border-rose-100 font-extrabold text-[10px] px-2 py-1 rounded inline-flex items-center gap-1">
                                    <X className="w-3.5 h-3.5 text-rose-500" /> Inactive
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Row Action Actions */}
                            <td className="p-4 text-right">
                              <div className="items-center justify-end gap-1 border-slate-100 justify-items-end inline-flex">
                                
                                <button
                                  onClick={() => handleRevealCredentials(prod)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    revealedCredsId === prod.id 
                                      ? 'bg-[#1A1A2E] border-slate-700 text-emerald-400 font-bold' 
                                      : 'bg-white border-[#E0E0E0] text-slate-500 hover:text-[#0F3460] hover:bg-slate-50'
                                  }`}
                                  title="Reveal decrypt codes"
                                >
                                  {revealedCredsId === prod.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => openReuploadModal(prod)}
                                  className="p-1.5 rounded-lg border border-[#E0E0E0] hover:bg-slate-50 text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                                  title="Quick Reupload Credentials / Stock"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => startEdit(prod)}
                                  className="p-1.5 rounded-lg border border-[#E0E0E0] hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition cursor-pointer"
                                  title="Edit full asset details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => openDeleteModal(prod)}
                                  className="p-1.5 rounded-lg border border-[#E0E0E0] hover:bg-rose-50 text-slate-500 hover:text-[#E94560] transition cursor-pointer"
                                  title="Delete options"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            </td>
                          </tr>

                          {/* Reveal Decrypted credentials panel */}
                          {revealedCredsId === prod.id && (
                            <tr key={`creds-${prod.id}`}>
                              <td colSpan={8} className="p-4 bg-[#1A1A2E] border-t border-[#0F3460]/20 animate-[fadeIn_0.2s_ease]">
                                <div className="max-w-4xl mx-auto space-y-3 text-slate-300">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                      <Lock className="w-4 h-4 text-emerald-400" />
                                      Symmetric Base64 shifted Decrypted Credentials
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded font-bold">
                                      SHIFTOBFLIGHT: Base64 rot(+4)
                                    </span>
                                  </div>

                                  {prod.credentials && prod.credentials.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                      {prod.credentials.map((entry, index) => {
                                        const emailDec = decryptCredentials(entry.email || '');
                                        const passDec = decryptCredentials(entry.password || '');
                                        const rawDec = decryptCredentials(entry.rawText || '');
                                        const output = emailDec && passDec ? `${emailDec}:${passDec}` : rawDec;

                                        return (
                                          <div 
                                            key={index} 
                                            className="p-2.5 rounded bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-[11px]"
                                          >
                                            <span className="font-mono text-emerald-300 select-all truncate shrink-0 max-w-[180px]" title={output}>
                                              {output}
                                            </span>
                                            <span className={`px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded ${
                                              entry.isSold ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                              {entry.isSold ? 'Sold' : 'Avail'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic">No automated digital keys linked of instant type. Edit to add credentials.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: MERCHANTS MANAGEMENT VIEW (NEW) */}
      {activeTab === 'merchants' && (
        <div id="admin-merchants-view" className="space-y-6">
          
          {/* Filters & Export Options Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E0E0E0] shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#4A4A6A] uppercase tracking-wide mr-2">Filter State:</span>
              {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(f => {
                const count = f === 'all' ? merchants.length : merchants.filter(m => m.status === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setMerchantFilter(f)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition cursor-pointer ${
                      merchantFilter === f 
                        ? 'bg-[#0F3460] text-white border-transparent shadow' 
                        : 'bg-slate-50 border-slate-200 text-[#4A4A6A] hover:bg-slate-100'
                    }`}
                  >
                    <span className="capitalize">{f === 'all' ? 'All Partners' : f}</span> ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  placeholder="Search merchant name, store..."
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[38px]"
                />
              </div>

              <button
                type="button"
                onClick={handleExportMerchantsCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#0F3460] hover:bg-[#16213E] text-white rounded-xl shadow-xs transition cursor-pointer shrink-0 min-h-[38px]"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Merchants Table List */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden">
            <div className="p-4 bg-[#F5F5F7] border-b border-[#E0E0E0] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-sm text-[#1A1A2E]">Digital Merchants Approval Directory</h3>
                <p className="text-[11px] text-[#4A4A6A]">Verify store requests, suspend bad actors, and compile calculations.</p>
              </div>
              <span className="text-[10px] text-[#4A2E60] font-bold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                {filteredMerchantsList.length} Partners Matching
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-[#E0E0E0] text-[10px] uppercase font-bold tracking-wider select-none">
                    <th className="p-4">Owner Name</th>
                    <th className="p-4">Store Identity</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Asset types</th>
                    <th className="p-4">Date Applied</th>
                    <th className="p-4">Verification Flow</th>
                    <th className="p-4">Sales/Revenue</th>
                    <th className="p-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]/60 text-[#4A4A6A]">
                  {filteredMerchantsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 font-medium italic">
                        No digital merchants found matching specified requirements filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchantsList.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        {/* Name and user relation */}
                        <td className="p-4">
                          <span className="font-semibold text-neutral-800 block text-xs">{m.fullName}</span>
                          <span className="text-[9px] text-[#4A4A6A] font-mono block select-all">{m.email}</span>
                        </td>

                        {/* Store info */}
                        <td className="p-4">
                          <span className="font-bold text-[#0F3460] text-xs block">{m.storeName}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[150px]" title={m.storeDescription}>
                            {m.storeDescription}
                          </span>
                        </td>

                        {/* Contact details */}
                        <td className="p-4 font-mono select-all text-neutral-600">{m.phone}</td>

                        {/* Assets category */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {m.typesOfAssets && m.typesOfAssets.length > 0 ? (
                              m.typesOfAssets.map(t => (
                                <span key={t} className="px-1 text-[8.5px] bg-[#F5F5FC] border text-[#0F3460] font-semibold rounded truncate">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] italic text-slate-400">Undefined</span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-slate-500 font-mono text-[10px]">
                          {new Date(m.appliedAt).toLocaleDateString()}
                        </td>

                        {/* status indicator */}
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase inline-flex items-center gap-1 ${
                            m.status === 'approved' ? 'bg-[#F2FAF5] text-emerald-800 border border-emerald-200' :
                            m.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            m.status === 'suspended' ? 'bg-slate-100 text-[#4A4A6A] border' :
                            'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {m.status === 'approved' && <CheckCircle className="w-3 h-3 text-emerald-600 animate-pulse" />}
                            {m.status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                            {m.status === 'suspended' && <UserX className="w-3 h-3 text-slate-500" />}
                            {m.status === 'rejected' && <HelpCircle className="w-3 h-3 text-rose-500" />}
                            {m.status}
                          </span>
                          {m.rejectionReason && (
                            <span className="block text-[8.5px] text-rose-500 max-w-[140px] truncate mt-1" title={m.rejectionReason}>
                              Reason: {m.rejectionReason}
                            </span>
                          )}
                        </td>

                        {/* Calculated sales and revenue */}
                        <td className="p-4">
                          <span className="font-extrabold text-[#E94560] block">{formatNaira(m.totalRevenue)}</span>
                          <span className="text-[9.5px] text-slate-400 block font-medium font-mono">
                            {m.totalSales} sales ({m.totalAssets} assets)
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            
                            {/* APPROVE action */}
                            {m.status !== 'approved' && m.status !== 'suspended' && (
                              <button
                                onClick={() => handleApprovePartner(m.id, m.email)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition cursor-pointer min-h-[28px]"
                                title="Approve Request"
                              >
                                Approve
                              </button>
                            )}

                            {/* REJECT action */}
                            {m.status === 'pending' && (
                              <button
                                onClick={() => handleOpenRejectModal(m)}
                                className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-[10px] rounded-lg transition cursor-pointer min-h-[28px]"
                                title="Reject application"
                              >
                                Reject
                              </button>
                            )}

                            {/* SUSPEND logic toggle */}
                            {(m.status === 'approved' || m.status === 'suspended') && (
                              <button
                                onClick={() => handleToggleSuspendPartner(m)}
                                className={`px-2 py-1 font-bold text-[10px] rounded-lg transition cursor-pointer min-h-[28px] ${
                                  m.status === 'suspended' 
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                    : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {m.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>
                            )}

                            {/* DELETE PERMANENT */}
                            <button
                              onClick={() => handlePermanentDeletePartner(m)}
                              className="p-1 rounded bg-[#FDFDFE] border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-[#E94560] transition cursor-pointer min-h-[28px] flex items-center justify-center w-7"
                              title="Delete Merchant Cascaded"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: TRACK ESDROW ORDERS */}
      {activeTab === 'orders' && (
        <div id="admin-orders-view" className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden">
          <div className="p-4 bg-[#F5F5F7] border-b border-[#E0E0E0] flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-[#1A1A2E]">Escrow Orders Ledger</h3>
            <span className="text-[10px] text-[#4A4A6A] font-bold uppercase bg-white border px-2.5 py-1 rounded-full">
              {orders.length} transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#E0E0E0] text-[10px] uppercase font-bold tracking-wider select-none">
                  <th className="p-4">Order Account ID</th>
                  <th className="p-4">Buyer Email</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Escrow Status</th>
                  <th className="p-4">Delivered Key Details</th>
                  <th className="p-4 text-right">Progress Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]/40 text-[#4A4A6A]">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-[#1A1A2E]">{o.id}</td>
                    <td className="p-4 font-medium text-[#1A1A2E]">{o.buyerEmail}</td>
                    <td className="p-4 max-w-[150px] truncate font-semibold" title={o.productTitle}>{o.productTitle}</td>
                    <td className="p-4 font-extrabold text-[#E94560]">{formatNaira(o.amount)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        o.status === 'delivered' ? 'bg-[#EBF7FC] text-[#0F3460] border border-[#C6EBFA]' : 
                        o.status === 'paid' ? 'bg-emerald-50 text-emerald-850 border border-emerald-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono select-all text-[10.5px] text-[#0F3460] max-w-[180px] truncate" title={o.credentialsShared || ''}>
                      {o.credentialsShared || 'No automated coordinates delivered.'}
                    </td>
                    <td className="p-4 text-right">
                      {o.status !== 'delivered' ? (
                        <button
                          onClick={() => handleOrderStatusToggle(o.id, o.status)}
                          className="px-3 py-1 bg-white border border-[#E0E0E0] hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 transition cursor-pointer min-h-[30px]"
                        >
                          Advance State
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 block pr-2">✓ Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: USERS STORE DIRECTORY */}
      {activeTab === 'users' && (
        <div id="admin-users-view" className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden">
          <div className="p-4 bg-[#F5F5F7] border-b border-[#E0E0E0] flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-[#1A1A2E]">Platform User Ledger Directory</h3>
            <span className="text-[10px] text-[#4A4A6A] font-bold uppercase bg-white border px-2.5 py-1 rounded-full">
              {users.length} Users Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#E0E0E0] text-[10px] uppercase font-bold tracking-wider select-none">
                  <th className="p-4 font-bold">User Identifier</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Platform Role</th>
                  <th className="p-4">Verification State</th>
                  <th className="p-4 text-right">Date Signed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]/40 text-[#4A4A6A]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-[#1A1A2E]">{u.name}</td>
                    <td className="p-4 font-mono select-all text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-[#1A1A2E] text-emerald-400' :
                        u.role === 'merchant' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-[#0F3460]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role === 'buyer' && (
                        <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Account Activated
                        </span>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-[#0F3460] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0F3460]" /> Full Authority Keys
                        </span>
                      )}
                      {u.role === 'merchant' && (
                        u.isApprovedMerchant ? (
                          <span className="text-[#0F3460] font-semibold inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Approved Store partner
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Awaiting Verification
                          </span>
                        )
                      )}
                    </td>
                    <td className="p-4 text-right text-slate-500 font-mono text-[10px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: TRASH RECOVERY DRAWER (NEW) */}
      {activeTab === 'trash' && (
        <div id="admin-trash-view" className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden animate-[fadeIn_0.15s_ease]">
          <div className="p-4 bg-[#F5F5F7] border-b border-[#E0E0E0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-semibold text-sm text-[#1A1A2E]">Trash Recovery Center 📦</h3>
              <p className="text-[11px] text-[#4A4A6A] mt-0.5">Assets shown here are soft-deleted and automatically purged after 30 days of storage.</p>
            </div>
            <span className="text-[10px] text-slate-600 font-extrabold bg-slate-100 border px-3 py-1 rounded-full uppercase">
              {trash.length} Soft Deleted Items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-[#E0E0E0] text-[10px] uppercase font-bold tracking-wider select-none">
                  <th className="p-4">Deleted Asset Name</th>
                  <th className="p-4">Platform category</th>
                  <th className="p-4">Deleted By</th>
                  <th className="p-4">Deleted On</th>
                  <th className="p-4">Force Expiry Date</th>
                  <th className="p-4 text-right">Recovery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]/50 text-[#4A4A6A]">
                {trash.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                      Trash storage is empty. No soft-deleted items found.
                    </td>
                  </tr>
                ) : (
                  trash.map(t => (
                    <tr key={t.id} className="hover:bg-rose-50/10">
                      
                      {/* Name */}
                      <td className="p-4 font-bold text-neutral-800">
                        <div className="flex items-center gap-3">
                          <img 
                            src={t.assetData.imageUrl} 
                            className="w-8 h-8 rounded border object-cover" 
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'; }}
                          />
                          <div>
                            <span className="block truncate max-w-[180px]">{t.assetData.title}</span>
                            <span className="text-[8.5px] block font-mono text-slate-400 mt-0.5">Asset ID: {t.assetId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="px-1.5 py-0.2 bg-slate-100 border rounded text-[9px] font-semibold">
                          {t.assetData.platform}
                        </span>
                      </td>

                      {/* Deleted By */}
                      <td className="p-4 font-semibold text-neutral-700">{t.deletedBy}</td>

                      {/* Deleted on */}
                      <td className="p-4 font-mono text-[10px] text-slate-500">
                        {new Date(t.deletedAt).toLocaleString()}
                      </td>

                      {/* Expiry countdown */}
                      <td className="p-4 text-[#E94560] font-semibold">
                        {new Date(t.expiresAt).toLocaleDateString()} (30 Days)
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestoreFromTrash(t)}
                            className="px-3 py-1 bg-white border border-[#E0E0E0] hover:bg-emerald-50 text-emerald-800 hover:border-emerald-200 rounded-lg text-[10px] font-bold transition cursor-pointer min-h-[30px]"
                            title="Restore back to store catalog"
                          >
                            Restore Asset
                          </button>
                          
                          <button
                            onClick={() => handleHardDeleteTrashItem(t)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-extrabold transition cursor-pointer min-h-[30px]"
                            title="Hard delete"
                          >
                            Wipe
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: DIGITAL ASSETS UPLOAD / EDIT FORM TYPE */}
      {activeTab === 'create' && (
        <div id="admin-create-view" className="max-w-2xl bg-white rounded-xl border border-[#E0E0E0] shadow-md overflow-hidden animate-[fadeIn_0.15s_ease] mx-auto">
          <div className="p-5 bg-[#FDFDFE] border-b border-[#E0E0E0]">
            <h3 className="font-heading font-semibold text-sm text-[#1A1A2E] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0F3460]" />
              {editingId ? 'Edit Digital Asset Listing Details' : 'Upload Digital Asset Form'}
            </h3>
            <p className="text-xs text-[#4A4A6A] mt-1">
              Add premium credentials into the marketplace category ledger safely with complete encryption algorithms.
            </p>
          </div>

          <form onSubmit={handleSaveListing} className="p-6 space-y-5">
            {formError && (
              <div id="form-error-banner" className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg font-medium">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div id="form-success-banner" className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Account Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Account Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="form-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Netflix Premium 1 Month"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px]"
                />
              </div>

              {/* Platform Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Platform Dropdown <span className="text-rose-500">*</span>
                </label>
                <select
                  id="form-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px] cursor-pointer font-semibold"
                >
                  <option value="Netflix">Netflix</option>
                  <option value="Spotify">Spotify</option>
                  <option value="Disney+">Disney+</option>
                  <option value="Xbox">Xbox</option>
                  <option value="Gmail">Gmail</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Canva">Canva</option>
                  <option value="ChatGPT">ChatGPT</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Price rate */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Price (₦) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="1"
                  min="1"
                  id="form-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="15000"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px]"
                />
              </div>

              {/* Account Credentials Textarea */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1.5 bg-white">
                  <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wide">
                    Account Credentials <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#4A4A6A] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                    Encrypted At Rest
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  id="form-credentials"
                  value={credentialsText}
                  onChange={(e) => handleCredentialsTextChange(e.target.value)}
                  placeholder="Format: email:password (Multiple accounts? Enter one per line)"
                  className="w-full text-xs p-3 font-mono bg-slate-50 border border-[#E0E0E0] text-emerald-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                />
                <span className="text-[10px] text-slate-500 leading-relaxed block mt-1">
                  💡 Enter multiple credentials here, one per line. Stock quantity automatically synchronized dynamically below.
                </span>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide font-sans">
                  Stock Units Available <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  id="form-stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Computed from line entries"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px]"
                />
              </div>

              {/* Delivery Category */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Delivery Method <span className="text-rose-500">*</span>
                </label>
                <select
                  id="form-delivery-method"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as any)}
                  className="w-full text-xs p-3 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px] cursor-pointer font-semibold"
                >
                  <option value="instant">Instant Delivery</option>
                  <option value="manual">Manual Escrow Dispatch</option>
                  <option value="email">Direct Email coordinate</option>
                </select>
              </div>

              {/* Category Dropdown (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Category (Optional)
                </label>
                <select
                  id="form-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px] cursor-pointer font-semibold"
                >
                  <option value="Streaming">Streaming</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Email">Email</option>
                  <option value="Design">Design</option>
                  <option value="Other">Other Category</option>
                </select>
              </div>

              {/* Status Toggle (Active / Inactive) */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Status Toggle <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 mt-1.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                    className="flex items-center gap-1.5 font-bold text-xs pointer transition cursor-pointer"
                  >
                    {status === 'active' ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Active (Visible in Shop)
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-500" /> Inactive (Hidden from Shop)
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Account Image */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Account Image / Logo <span className="text-rose-500">*</span>
                </label>
                
                {/* Drag zone */}
                <div 
                  id="asset-image-dropzone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer min-h-[140px] ${
                    dragActive ? 'border-[#0F3460] bg-slate-50' : 'border-[#E0E0E0] bg-[#FAFAFC] hover:bg-slate-50'
                  }`}
                  onClick={() => document.getElementById('drag-file-input')?.click()}
                >
                  <input 
                    type="file" 
                    id="drag-file-input" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileInputChange(e, setImageUrl)} 
                  />
                  <UploadCloud className="w-8 h-8 text-[#0F3460] mb-2" />
                  <p className="text-xs font-semibold text-neutral-800">
                    Drag & Drop account logo here, or <span className="text-[#0F3460] underline">browse documents</span>
                  </p>
                  <p className="text-[10px] text-[#4A4A6A] mt-1">Supports PNG, JPG, GIF folders up to 5MB (automatically compressed)</p>
                </div>

                {/* Direct Image URL input as backup */}
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-sans">
                    Or Paste Image URL directly
                  </label>
                  <input
                    type="url"
                    id="form-image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/your-provided-image-reference"
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[40px]"
                  />
                </div>
              </div>

              {/* Image Presets block */}
              <div className="sm:col-span-2">
                <span className="block text-[10px] font-bold text-[#4A4A6A] uppercase tracking-widest mb-1.5 font-sans">Quick Platform Logo Presets</span>
                <div className="flex flex-wrap gap-2 bg-white">
                  {imagePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      id={`preset-btn-${preset.label.replace(/\s/g, '-')}`}
                      onClick={() => setImageUrl(preset.url)}
                      className={`px-3 py-1.5 text-[10px] font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
                        imageUrl === preset.url
                          ? 'bg-[#0F3460] text-white border-transparent shadow'
                          : 'bg-[#F2F2F5] border-[#E0E0E0] text-[#4A4A6A] hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  id="form-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of what the buyer receives after escrow release"
                  className="w-full text-xs p-3 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                />
              </div>

            </div>

            {/* Cancel and Save triggers */}
            <div className="pt-4 border-t border-[#E0E0E0] flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                id="form-cancel-btn"
                onClick={() => setActiveTab('listings')}
                className="px-5 py-2.5 text-xs font-semibold border border-[#E0E0E0] hover:bg-slate-50 text-[#4A4A6A] rounded-full transition min-h-[44px] cursor-pointer"
              >
                Cancel Action
              </button>
              <button
                type="submit"
                id="form-save-btn"
                className="px-8 py-2.5 bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-xs rounded-full transition shadow-md min-h-[44px] cursor-pointer"
              >
                {editingId ? 'Save Digital Asset Details' : 'Upload Digital Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 7: SUPABASE DIAGNOSTIC DOCTOR */}
      {activeTab === 'supabase' && (
        <div id="admin-supabase-doctor" className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm overflow-hidden p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-medium text-base text-[#1A1A2E]">Supabase Schema Troubleshooting Doctor</h3>
              <p className="text-xs text-[#4A4A6A]">Diagnose connection issues, missing database columns, and PGRST errors.</p>
            </div>
          </div>

          {/* Active Network & Adblock Probe Panel */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="block text-sm font-semibold text-slate-900">Interactive Supabase Connection Probe</span>
                <p className="text-xs text-slate-500">
                  Click to test your browser's direct network communication with the remote Supabase API endpoint.
                </p>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Target Endpoint: <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold break-all">{supabaseUrl || 'Not configured'}</code>
                </div>
              </div>

              <button
                onClick={runConnectionTest}
                disabled={testStatus === 'testing'}
                className="bg-[#0F3460] hover:bg-[#16213E] text-white text-xs font-bold px-4 py-2 rounded-lg transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 min-h-[36px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                {testStatus === 'testing' ? 'Probing...' : 'Test Connection'}
              </button>
            </div>

            {testStatus !== 'idle' && (
              <div className={`p-4 rounded-lg border text-xs leading-relaxed space-y-2 animate-[fadeIn_0.2s_ease] ${
                testStatus === 'testing' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                testStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' :
                testStatus === 'failed_fetch' ? 'bg-rose-50 border-rose-250 text-rose-950' :
                testStatus === 'unconfigured' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                'bg-red-50 border-red-200 text-red-950'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {testStatus === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {(testStatus === 'failed_fetch' || testStatus === 'error') && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                  {testStatus === 'unconfigured' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
                  {testStatus === 'testing' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />}
                  <span>
                    Status: {
                      testStatus === 'testing' ? 'Contacting Supabase...' :
                      testStatus === 'success' ? 'Connection Successful!' :
                      testStatus === 'failed_fetch' ? 'Blocked (TypeError: Failed to fetch)' :
                      testStatus === 'unconfigured' ? 'Credentials Missing' : 'Connection Error'
                    }
                  </span>
                </div>

                <p className="font-medium text-[11px] whitespace-pre-wrap">{testFeedback}</p>

                {testStatus === 'failed_fetch' && (
                  <div className="mt-3 pt-3 border-t border-rose-150 space-y-2 text-[11px] text-rose-800">
                    <span className="font-bold uppercase tracking-wide block text-rose-900 text-[10px]">🛑 Action Plan: How to Unblock Connection</span>
                    <ul className="list-disc list-inside space-y-1 bg-white/50 p-2.5 rounded border border-rose-100">
                      <li>
                        <b>Disable Brave Shield / Ad-Blockers:</b> Extensions like <i>uBlock Origin</i> or <i>Brave Shield</i> identify Supabase database endpoints in third-party embedded environments (iframes) as trackers and block them. Toggle them <b>OFF</b> for this tab.
                      </li>
                      <li>
                        <b>Verify your secrets configuration:</b> Make sure you have configured <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> correctly in your secrets.
                      </li>
                      <li>
                        <b>No quotes in secrets:</b> Ensure your values do not contain wrapped quotes (e.g. paste <code>https://xyz.supabase.co</code>, NOT <code>"https://xyz.supabase.co"</code>).
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RLS 42501 Policy Section */}
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl space-y-4">
            <div className="flex items-start gap-2.5 text-amber-850 font-bold text-xs select-none">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
              <div className="space-y-0.5 animate-pulse">
                <span className="block text-sm font-semibold">Fix: "new row violates row-level security policy for table 'users'" (Error 42501)</span>
                <span className="text-[10px] text-amber-600 font-medium font-mono">Row-Level Security (RLS) is Blocking Client Operations</span>
              </div>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Choose one of the solutions below to run in your <b>Supabase SQL Editor</b> to resolve the RLS blockages on users or merchants tables:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/40 p-1.5 rounded-lg">
              {/* Option A: Disable RLS */}
              <div className="bg-white border border-amber-200/60 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Option 1: Disable RLS (Easiest)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
`ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;`
                      );
                      alert('Option 1 SQL copied!');
                    }}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] px-2.5 py-1 rounded transition select-none cursor-pointer font-bold"
                  >
                    Copy SQL
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">Recommended for prototyping. Completely unlocks client read/write interactions.</p>
              </div>

              {/* Option B: Add Permissive Policies */}
              <div className="bg-white border border-amber-200/60 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Option 2: Add RLS Policies</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
`CREATE POLICY "Allow public insert to users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select from users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public update of users" ON public.users FOR UPDATE USING (true);`
                      );
                      alert('Option 2 SQL copied!');
                    }}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] px-2.5 py-1 rounded transition select-none cursor-pointer font-bold"
                  >
                    Copy SQL
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">Retains security while enabling insert permissions for client-level codes.</p>
              </div>
            </div>
          </div>

          {/* Missing Column (PGRST204) Section */}
          <div className="bg-rose-50/70 border border-rose-200 p-5 rounded-xl space-y-4">
            <div className="flex items-start gap-2.5 text-rose-850 font-bold text-xs select-none">
              <Database className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <span className="block text-sm font-semibold text-rose-950">Fix: "Could not find the 'category' column of 'products' in the schema cache" (Error PGRST204)</span>
                <span className="text-[10px] text-rose-600 font-medium font-mono">Schema Cache Desynchronization / Missing Columns</span>
              </div>
            </div>
            
            <p className="text-xs text-rose-700 leading-relaxed">
              If you see schema cache errors like PGRST204, this indicates that your local code is trying to insert or select columns (like <code className="bg-rose-150 px-1 py-0.5 rounded font-mono font-bold">category</code>, <code className="bg-rose-150 px-1 py-0.5 rounded font-mono font-bold">delivery_method</code>, or <code className="bg-rose-150 px-1 py-0.5 rounded font-mono font-bold">amount</code>) that do not yet exist in your live Supabase database tables (because the tables were created under an older schema version).
            </p>

            <div className="bg-white border border-rose-200/60 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">Database Migration SQL script</span>
                  <span className="text-[10px] text-slate-400 block">Safely adds missing columns to your products and orders tables and refreshes the cache.</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
`-- 1. Safely add missing columns to products table if they don't already exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'instant';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Streaming';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS credentials TEXT;

-- 2. Safely add missing columns to orders table if they don't already exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS credentials_shared TEXT;

-- NOTE: Running DDL alterations in Supabase SQL editor automatically triggers a PostgREST schema cache reload.`
                    );
                    alert('Safe Migration SQL copied to clipboard! Paste and run this in your Supabase SQL Editor.');
                  }}
                  className="bg-rose-100 hover:bg-rose-250 text-rose-950 text-[10px] px-3 py-1.5 rounded-lg transition select-none cursor-pointer font-extrabold shadow-sm"
                >
                  Copy Migration SQL
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-3 rounded-md overflow-x-auto border max-h-40">
{`-- Safely add missing columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'instant';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Streaming';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS credentials TEXT;

-- Safely add missing columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paystack';`}
              </pre>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                💡 <b>How to run:</b> Go to your <b>Supabase Dashboard</b> → <b>SQL Editor</b> → create a <b>New Query</b> → paste this script and click <b>Run</b>. Your product saves will work immediately after running!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: SETTINGS & ACTIVITY SECURITY AUDIT LOGS */}
      {activeTab === 'settings' && (
        <div id="admin-settings-logs-view" className="space-y-8 animate-[fadeIn_0.25s_ease]">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Action Card A: Password update Panel */}
            <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-5">
              <div className="border-b pb-4">
                <h3 className="font-heading font-extrabold text-[#1A1A2E] text-base flex items-center gap-1.5">
                  <Lock className="w-5 h-5 text-[#0F3460]" />
                  Change Administrator Password
                </h3>
                <p className="text-xs text-[#4A4A6A] mt-1">
                  Ensure your administrative access credentials meet the global standard complexity policies.
                </p>
              </div>

              {settingsError && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-xs text-rose-950 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl text-xs text-emerald-950 flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{settingsSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 font-sans text-xs">
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    required
                    value={settingNewPassword}
                    onChange={(e) => setSettingNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={settingsConfirmPassword}
                    onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                  />
                </div>

                {/* Password Directives Checklist */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-[10px] space-y-1 text-slate-500">
                  <span className="font-bold text-slate-600 mb-1 block uppercase tracking-wide">Security Mandates Checklist:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={settingNewPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-slate-300"}>✓</span>
                    <span>At least 8 characters length</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[A-Z]/.test(settingNewPassword) ? "text-emerald-600 font-bold" : "text-slate-300"}>✓</span>
                    <span>At least 1 uppercase alphabetical letter (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[0-9]/.test(settingNewPassword) ? "text-emerald-600 font-bold" : "text-slate-300"}>✓</span>
                    <span>At least 1 numerical digit (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(settingNewPassword) ? "text-emerald-600 font-bold" : "text-slate-300"}>✓</span>
                    <span>At least 1 special character (!@#$%^&*)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="w-full min-h-[40px] bg-[#0F3460] hover:bg-[#16213E] text-white py-2 rounded-lg font-bold transition flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {settingsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Update Administrator Password"}
                </button>

              </form>
            </div>

            {/* Action Card B: Administrative provision box (Only for super_admin role) */}
            <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-5">
              <div className="border-b pb-4">
                <h3 className="font-heading font-extrabold text-[#1A1A2E] text-base flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-[#0F3460]" />
                  Provision Administrative Account
                </h3>
                <p className="text-xs text-[#4A4A6A] mt-1">
                  {adminSession?.role === 'super_admin' 
                    ? "Add a new trusted administrative or team moderator account to the escrow control system." 
                    : "Only Super Administrators can create or provision other administrator access lines."}
                </p>
              </div>

              {adminSession?.role !== 'super_admin' ? (
                <div className="bg-amber-50/70 border border-amber-200 text-amber-900 p-5 rounded-xl text-center text-xs space-y-2 select-none">
                  <ShieldAlert className="w-8 h-8 mx-auto text-amber-600" />
                  <p className="font-bold">Access Denied: Super Admin Role Required</p>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Your current account state role is listed as <b>"{adminSession?.role || 'moderator'}"</b>. You do not have permissions to register other team members. Thank you.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newAdminError && (
                    <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-xs text-rose-950 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{newAdminError}</span>
                    </div>
                  )}

                  {newAdminSuccess && (
                    <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl text-xs text-emerald-950 flex gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{newAdminSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateAdminSubmit} className="space-y-4 font-sans text-xs">
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Full Human Name</label>
                      <input
                        type="text"
                        required
                        value={newAdminFullName}
                        onChange={(e) => setNewAdminFullName(e.target.value)}
                        placeholder="e.g. John Administrator"
                        className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Admin Email Address</label>
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="john@purelogsmartketaplace.com"
                        className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Primary Access Password</label>
                      <input
                        type="password"
                        required
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Administrative Role Scope</label>
                      <select
                        value={newAdminRole}
                        onChange={(e) => setNewAdminRole(e.target.value as any)}
                        className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                      >
                        <option value="admin">Admin (Manage Assets, Merchants, Orders)</option>
                        <option value="moderator">Moderator (View Only Permissions)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={newAdminLoading}
                      className="w-full min-h-[40px] bg-[#0F3460] hover:bg-[#16213E] text-white py-2 rounded-lg font-bold transition flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {newAdminLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Provision Account Lines"}
                    </button>

                  </form>
                </div>
              )}

            </div>

          </div>

          {/* Table Container C: Interactive Audit Activity Logs Table */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="font-heading font-extrabold text-[#1A1A2E] text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0F3460]" />
                  System Audit Tracker logs
                </h3>
                <p className="text-xs text-[#4A4A6A] mt-1">
                  Track and examine authentication checks, configuration, and security-relevant admin events.
                </p>
              </div>

              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg shadow-xs cursor-pointer min-h-[34px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                Reload Logs
              </button>
            </div>

            {logsLoading && activityLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 select-none space-y-2 animate-pulse">
                <RefreshCw className="w-8 h-8 mx-auto text-slate-300 animate-spin" />
                <p className="text-xs">Fanning audit database trails...</p>
              </div>
            ) : logsError ? (
              <div className="bg-rose-50 border border-rose-100 text-rose-950 p-6 rounded-xl text-center text-xs space-y-1.5">
                <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
                <p className="font-bold">Failed to Extract Log Registry</p>
                <p className="text-[11px] text-rose-800">{logsError}</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans border border-dashed rounded-xl select-none space-y-1.5 gray">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Log Registry is Empty</p>
                <p className="text-[10px] text-slate-400">Security login logs will naturally print on this console once admins log in.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E0E0E0] rounded-xl">
                <table className="w-full text-left text-xs text-[#1A1A2E]">
                  <thead className="bg-slate-50 border-b border-[#E0E0E0] font-bold text-[#4A4A6A] text-[9.5px] uppercase tracking-wider select-none">
                    <tr>
                      <th className="p-4">Time (UTC)</th>
                      <th className="p-4">Operator</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Details Summary</th>
                      <th className="p-4">Network Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0] font-sans">
                    {activityLogs.map((log) => {
                      const isBad = log.action.includes('failed') || log.action.includes('unauthorized');
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition border-b border-dashed border-[#E0E0E0]">
                          <td className="p-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 font-semibold text-[#1A1A2E]">
                            <div className="font-bold">{log.adminEmail}</div>
                            <div className="text-[9px] text-slate-400 font-mono font-medium">{log.adminId}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide select-none ${
                              isBad ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              log.action === 'login' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                              'bg-indigo-50 text-indigo-800 border border-indigo-100'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-[11.5px] text-[#4A4A6A]">
                            {log.details}
                          </td>
                          <td className="p-4 whitespace-nowrap text-[10px] font-mono text-slate-400">
                            <div>IP: <b>{log.ipAddress}</b></div>
                            <div className="text-[9px] select-all truncate max-w-[150px]" title={log.userAgent}>
                              {log.userAgent}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 9: DEDICATED FLUTTERWAVE WEBHOOK MONITOR & INTEGRATION WORKSPACE */}
      {activeTab === 'webhooks' && (
        <div id="admin-webhooks-view" className="space-y-8 animate-[fadeIn_0.25s_ease]">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] p-6 rounded-2xl border border-slate-700/35 text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] bg-[#0F3460] text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold tracking-wider uppercase">Integration Hub</span>
                </div>
                <div className="space-y-1">
                  <h2 className="font-heading font-extrabold text-[#FAFAFC] text-xl tracking-tight flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400 animate-pulse" />
                    Flutterwave Webhooks System
                  </h2>
                  <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
                    Configure real-time automated order delivery, handle escrow deposits, and secure payment signals using verified signature hashes.
                  </p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4.5 rounded-2xl max-w-sm shrink-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Production Webhook URL</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-xs text-emerald-400 select-all truncate max-w-[180px]">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/flutterwave/webhook` : '/api/flutterwave/webhook'}
                  </span>
                  <button 
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/api/flutterwave/webhook`);
                        alert('Dynamic webhook path successfully copied to clipboard!');
                      }
                    }}
                    className="p-1.5 px-3 bg-[#0F3460] hover:bg-emerald-600 text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1 shrink-0 text-white"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Guide column (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-6">
              
              <div className="border-b pb-4">
                <h3 className="font-heading font-extrabold text-[#1A1A2E] text-base flex items-center gap-1.5">
                  🛡️ How To Create / Secure a Flutterwave Webhook Secret
                </h3>
                <p className="text-xs text-[#4A4A6A] mt-1">
                  Follow these step-by-step instructions to link, authenticate, and run your automated escrow payment updates.
                </p>
              </div>

              <div className="space-y-5 font-sans">
                
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-none w-7 h-7 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center font-bold text-xs text-[#1A1A2E]">
                    1
                  </div>
                  <div className="space-y-1 mt-0.5">
                    <h4 className="text-xs font-extrabold text-[#1A1A2E]">Log In to Flutterwave</h4>
                    <p className="text-xs text-[#4A4A6A]">
                      Navigate to your <strong>official Flutterwave Dashboard</strong> (either in Test or Production Mode) at <a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener noreferrer" className="text-[#0F3460] font-bold hover:underline">dashboard.flutterwave.com</a>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-none w-7 h-7 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center font-bold text-xs text-[#1A1A2E]">
                    2
                  </div>
                  <div className="space-y-1 mt-0.5">
                    <h4 className="text-xs font-extrabold text-[#1A1A2E]">Navigate to Webhooks Settings</h4>
                    <p className="text-xs text-[#4A4A6A]">
                      From the left sidebar, click on <strong>Settings</strong>, and select the <strong>Webhooks</strong> tab option from the top preferences menu.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-none w-7 h-7 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center font-bold text-xs text-[#1A1A2E]">
                    3
                  </div>
                  <div className="space-y-1 mt-0.5">
                    <h4 className="text-xs font-extrabold text-[#1A1A2E]">Configure the Webhook URL</h4>
                    <p className="text-xs text-[#4A4A6A]">
                      Paste the dynamic callback URL below. When your application is deployed on Vercel, it routes all backend notifications instantly:
                    </p>
                    <div className="bg-[#FAFAFC] border border-slate-200 p-2.5 rounded-lg flex items-center justify-between mt-1 text-[11px] font-mono select-all">
                      <span className="text-[#0F3460] truncate mr-2 font-bold">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/flutterwave/webhook` : 'https://your-site.vercel.app/api/flutterwave/webhook'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-none w-7 h-7 bg-[#0F3460] rounded-full border border-[#0F3460] flex items-center justify-center font-bold text-xs text-white">
                    4
                  </div>
                  <div className="space-y-1 mt-0.5">
                    <h4 className="text-xs font-extrabold text-[#1A1A2E]">Create a Secret Hash (Your Webhook Secret Key)</h4>
                    <p className="text-xs text-[#4A4A6A] leading-relaxed">
                      In the <strong>Secret Hash</strong> text field on Flutterwave, type a custom hidden key (random alphanumeric code of your choice). For example: <code className="bg-rose-50 border border-rose-150 px-1.5 py-0.5 rounded text-[#E94560] font-mono font-bold text-[10px]">MyEscrowSecureHash2026</code>.
                      Flutterwave will sign all callback notifications with this secret so that other servers are prevented from sending fraudulent reports.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-none w-7 h-7 bg-slate-100 rounded-full border border-slate-300 flex items-center justify-center font-bold text-xs text-[#1A1A2E]">
                    2
                  </div>
                  <div className="space-y-1 mt-0.5">
                    <h4 className="text-xs font-extrabold text-[#1A1A2E]">Subscribe to Events</h4>
                    <p className="text-xs text-[#4A4A6A]">
                      Check the box labeled <strong><code>charge.completed</code></strong>. Save the setting on Flutterwave to prime the automatic triggers.
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-4">
                  <div className="flex-none w-7 h-7 bg-emerald-600 rounded-full border border-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                    ✓
                  </div>
                  <div className="space-y-1 mt-0.5">
                    <h4 className="text-xs font-extrabold text-emerald-800">Add key to Vercel/Server Config</h4>
                    <p className="text-xs text-[#4A4A6A] leading-relaxed">
                      On Vercel, open your project settings dashboard and register the signature under <strong>Environment Variables</strong>:
                    </p>
                    <div className="bg-slate-900 text-slate-100 p-3 rounded-xl mt-1.5 text-[10.5px] font-mono space-y-1 border border-white/5">
                      <div><span className="text-pink-400">Key:</span> FLUTTERWAVE_WEBHOOK_SECRET</div>
                      <div><span className="text-pink-400">Value:</span> (Paste the exact same Secret Hash you typed in Step 4)</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Sandbox Simulator & Diagnostics column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-sm space-y-5">
                <div className="border-b pb-3.5">
                  <h3 className="font-heading font-extrabold text-[#1A1A2E] text-sm flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                    Interactive Sandbox Webhook Simulator
                  </h3>
                  <p className="text-[11px] text-[#4A4A6A] mt-1 leading-relaxed">
                    Manually payload-test signature verification compliance and post-payment inventory release rules.
                  </p>
                </div>

                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Test Signature Input */}
                  <div className="space-y-1 mr-0.5">
                    <label className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Signature Hash (verif-hash Header)</label>
                    <input
                      type="text"
                      value={webhookSimSecret}
                      onChange={(e) => setWebhookSimSecret(e.target.value)}
                      placeholder="MyEscrowSecureHash2026"
                      className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                    />
                    <div className="text-[9px] text-[#4A4A6A]">
                      Secures dynamic simulation matching.
                    </div>
                  </div>

                  {/* Test Reference No */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Order Reference ID (tx_ref)</label>
                    <div className="flex gap-2">
                      <select
                        value={webhookSimRef}
                        onChange={(e) => {
                          setWebhookSimRef(e.target.value);
                          const chosen = orders.find(o => o.id === e.target.value);
                          if (chosen) setWebhookSimAmount(String(chosen.amount));
                        }}
                        className="flex-1 bg-[#FAFAFC] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#1A1A2E]"
                      >
                        <option value="">-- Choose Active Order --</option>
                        {orders.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.id} ({o.buyerName.split(' ')[0]} - {formatNaira(o.amount)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={webhookSimRef}
                        onChange={(e) => setWebhookSimRef(e.target.value)}
                        placeholder="Custom Ref"
                        className="w-1/3 bg-[#FAFAFC] border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono text-[#1A1A2E]"
                      />
                    </div>
                  </div>

                  {/* Amount to Simulate */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Simulated Transaction Amount (NGN)</label>
                    <input
                      type="number"
                      value={webhookSimAmount}
                      onChange={(e) => setWebhookSimAmount(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-[#1A1A2E]"
                    />
                  </div>

                  <button
                    onClick={runWebhookSimulation}
                    disabled={webhookSimStatus === 'testing'}
                    className="w-full min-h-[40px] px-5 py-2.5 bg-[#0F3460] hover:bg-[#16213E] disabled:bg-slate-300 text-white font-bold text-xs rounded-full transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {webhookSimStatus === 'testing' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Transmitting Simulation...
                      </>
                    ) : (
                      <>
                        ⚡ Fire Webhook Event Signal
                      </>
                    )}
                  </button>

                  {/* Simulator Response Pane */}
                  {webhookSimStatus !== 'idle' && (
                    <div className="space-y-2 animate-[fadeIn_0.2s_ease]">
                      <span className="text-[10px] font-bold text-[#4A4A6A] uppercase tracking-wider block">Simulator Log Console</span>
                      <div className={`p-3.5 rounded-xl border text-[11px] font-mono whitespace-pre-wrap max-h-56 overflow-y-auto ${
                        webhookSimStatus === 'success' 
                          ? 'bg-emerald-50 border-emerald-150 text-emerald-950 font-bold' 
                          : webhookSimStatus === 'testing'
                          ? 'bg-slate-50 border-slate-200 text-slate-700 animate-pulse'
                          : 'bg-rose-50 border-rose-150 text-rose-950'
                      }`}>
                        {webhookSimFeedback}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Secure Handshake Logic Info */}
              <div className="bg-[#FAFAFC] p-4.5 rounded-2xl border border-slate-200 text-[11px] text-[#4A4A6A] space-y-2">
                <span className="font-bold text-[#1A1A2E] flex items-center gap-1">
                  🔒 Anti-Fraud Handshake Checklist
                </span>
                <p className="leading-relaxed">
                  Your server executes a strict Double-Verification model. When a Webhook reports an order payment, the system is designed to immediately connect back to the official <code>api.flutterwave.com</code> gateways to double-verify the transaction details against original logs before releasing credentials. This blocks injection and payload attacks completely.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* OVERLAY MODAL 1: CONFIRMED SOFT vs HARD DELETE MODAL */}
      {deleteConfirmAsset && (
        <div id="delete-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[zoomIn_0.15s_ease]">
            <div className="px-6 py-5 bg-[#1A1A2E] text-white border-b border-white/5 flex items-center justify-between">
              <span className="font-bold text-sm tracking-wide uppercase flex items-center gap-1.5 text-rose-400">
                <AlertTriangle className="w-4 h-4 text-[#E94560]" />
                Confirm Digital Asset Delete
              </span>
              <button onClick={() => setDeleteConfirmAsset(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                You are about to delete <b>'{deleteConfirmAsset.title}'</b>.
                Choose whether you want to soft-delete this item into the recovery trash or permanently eradicate it:
              </p>

              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">🚨 Notice:</span>
                <p className="text-[10px] text-rose-700 leading-relaxed">
                  Soft deleting shifts the listing details into <b>Trash 📦</b>, keeping it recovery-safe for 30 days. Hard delete permanently cleans database slots.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => executeSoftDelete(deleteConfirmAsset)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                >
                  Move to Trash 📦 (Soft Delete)
                </button>
                <button
                  type="button"
                  onClick={() => executeHardDelete(deleteConfirmAsset.id)}
                  className="w-full py-2.5 bg-[#E94560] hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                >
                  Wipe Permanently ❌ (Hard Delete)
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmAsset(null)}
                  className="w-full py-2.5 bg-white border hover:bg-slate-50 text-slate-500 rounded-xl transition font-semibold text-xs cursor-pointer"
                >
                  Cancel and Retain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 2: QUICK REUPLOAD MODAL */}
      {reuploadAsset && (
        <div id="quick-reupload-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form 
            onSubmit={handleSaveQuickReupload}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden animate-[zoomIn_0.15s_ease]"
          >
            <div className="px-6 py-5 bg-[#1A1A2E] text-white border-b border-[#0F3460]/20 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm tracking-wide">Quick Inventory Reupload</h4>
                <p className="text-[10px] text-slate-300 mt-0.5 font-sans font-medium">Replenish key credentials and customize logo preset.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setReuploadAsset(null)} 
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="block text-xs font-semibold text-slate-800">
                Asset Title: <b className="text-[#0F3460]">{reuploadAsset.title}</b>
              </span>

              {/* Paste Credentials Textarea */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-widest mb-1.5 font-sans">
                  Paste Account Lines (One Per Line)
                </label>
                <textarea
                  required
                  rows={4}
                  value={reuploadCredentialsText}
                  onChange={(e) => setReuploadCredentialsText(e.target.value)}
                  placeholder="Format: email:password or code-key (One account details per line)"
                  className="w-full text-xs p-3 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                />
              </div>

              {/* Edit Image Field optionally */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 uppercase tracking-widest mb-1.5 font-sans">
                  Quick Preview Image URL
                </label>
                <input
                  type="url"
                  value={reuploadImageUrlLocal}
                  onChange={(e) => setReuploadImageUrlLocal(e.target.value)}
                  placeholder="Paste direct URL"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#E0E0E0] rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReuploadAsset(null)}
                  className="px-4 py-2 border hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-full cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow transition cursor-pointer"
                >
                  Replenish Stock
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* OVERLAY MODAL 3: REJECTION REASON MODAL */}
      {rejectionMerchant && (
        <div id="rejection-reason-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[zoomIn_0.15s_ease]">
            <div className="px-6 py-5 bg-[#1A1A2E] text-white border-b border-white/5 flex items-center justify-between">
              <span className="font-bold text-xs tracking-wider uppercase text-rose-400">
                Reject Application: {rejectionMerchant.fullName}
              </span>
              <button onClick={() => setRejectionMerchant(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="block text-xs text-slate-700">
                Provide the validation failure justification. This details why the application was declined and is simulated inside of system notifications:
              </span>

              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Phone number check failed, duplicate store name, or suspicious category selection."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectionMerchant(null)}
                  className="px-4 py-2.5 border hover:bg-slate-50 text-slate-500 font-semibold rounded-full text-xs cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  onClick={executeRejectPartner}
                  className="px-6 py-2.5 bg-[#E94560] hover:bg-rose-700 text-white font-bold rounded-full text-xs shadow transition cursor-pointer min-h-[40px]"
                >
                  Reject & Notify Mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL 4: CSV EXPORT DISPLAY BOX */}
      {csvExportData && (
        <div id="csv-export-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden animate-[zoomIn_0.15s_ease]">
            <div className="px-6 py-5 bg-[#1A1A2E] text-white border-b border-[#0F3460]/20 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm tracking-wide">Exported Partners CSV (Revenue Ranked)</h4>
                <p className="text-[10px] text-slate-300">Copy table text directly to compile metrics inside Excel or Google Sheets.</p>
              </div>
              <button onClick={() => setCsvExportData(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                readOnly
                rows={10}
                value={csvExportData}
                placeholder="No merchants to rank."
                className="w-full text-xs p-3 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 select-all"
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(csvExportData);
                    alert('Copied CSV contents successfully to standard clipboard!');
                  }}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0F3460] hover:bg-[#16213E] text-white text-xs font-bold rounded-full shadow transition cursor-pointer min-h-[40px]"
                >
                  <Clipboard className="w-4 h-4" />
                  Copy CSV Code
                </button>

                <button
                  type="button"
                  onClick={() => setCsvExportData(null)}
                  className="px-5 py-2.5 bg-white border hover:bg-slate-50 text-slate-500 rounded-full font-semibold text-xs cursor-pointer min-h-[40px]"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
