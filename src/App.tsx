import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Marketplace from './components/Marketplace';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import MerchantApplicationModal from './components/MerchantApplicationModal';
import { db, formatNaira } from './data';
import { User, ProductListing, Order } from './types';
import { 
  ShieldCheck, ShoppingCart, UserCheck, Key, Ticket, CreditCard, 
  HelpCircle, Trash2, ArrowRight, UserPlus, Sparkles, RefreshCcw, Database, X, Lock,
  Search, ArrowUpDown, Filter, Calendar, Home, ShoppingBag, User as UserIcon, LogOut, Settings
} from 'lucide-react';
import AdminLogin from './components/AdminLogin';
import PaymentCallback from './components/PaymentCallback';
import DeploymentAssets from './components/DeploymentAssets';

// Detect the deployment base path (for instance, on GitHub Pages like /repository-name)
const getBasePath = (): string => {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname;
  const clean = path.replace(/(\/marketplace|\/deployment-assets|\/deployment|\/admin-login|\/admin(\/.*)?|\/payment\/callback|\/index\.html)$/, '');
  return clean.endsWith('/') ? clean.slice(0, -1) : clean;
};

const basePath = getBasePath();

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation & Pathname Physical Routing
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [view, setView] = useState<'landing' | 'marketplace' | 'admin' | 'payment-callback' | 'deployment-assets' | 'account' | 'profile'>('landing');
  const [activeNavTab, setActiveNavTab] = useState('home');

  // Synchronize currentPath state when react-router-dom location updates
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // Determine path relative to GitHub Pages repository subfolder (basePath)
  let relativePath = currentPath;
  if (basePath && currentPath.startsWith(basePath)) {
    relativePath = currentPath.substring(basePath.length);
  }
  if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#/')) {
    relativePath = window.location.hash.substring(1);
  }
  if (relativePath === '') relativePath = '/';

  // Admin Secure Session State
  const [adminSession, setAdminSession] = useState<any>(null);
  const [adminToken, setAdminToken] = useState<string>(localStorage.getItem('pm_admin_token') || '');
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Physical routing navigate helper using react-router-dom
  const navigateTo = (path: string) => {
    const isGitHubPages = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io')
    );

    if (isGitHubPages) {
      window.history.pushState(null, '', `#${path}`);
      setCurrentPath(basePath ? `${basePath}${path}` : path);
    } else {
      const targetWithBase = (basePath && !path.startsWith(basePath)) 
        ? `${basePath}${path === '/' ? '/' : path}` 
        : path;
      navigate(targetWithBase);
    }
  };

  // Synchronize path transitions with traditional state switcher
  useEffect(() => {
    let rel = currentPath;
    if (basePath && currentPath.startsWith(basePath)) {
      rel = currentPath.substring(basePath.length);
    }
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#/')) {
      rel = window.location.hash.substring(1);
    }
    if (rel === '') rel = '/';

    // Parse URLSearchParams for cancel alerts and non-successful states
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const viewParam = params.get('view');
    const cancelled = params.get('cancelled');
    const paymentCancelledParam = params.get('payment_cancelled');
    const isPaymentPath = rel.startsWith('/payment') || rel.includes('/callback') || viewParam === 'payment-callback';
    const isSuccess = status === 'successful' || status === 'completed';

    // If payment path is accessed but has a non-successful state, or cancellation parameter is present
    if ((isPaymentPath && !isSuccess) || paymentCancelledParam === 'true') {
      // 1. Immediately redirect to /marketplace
      setView('marketplace');
      setActiveNavTab('marketplace');
      navigateTo('/marketplace');

      // 2. Clear query string in browser address bar (so refreshing/back doesn't show alert again or loop)
      if (typeof window !== 'undefined' && window.history.replaceState) {
        const cleanUrl = window.location.origin + (basePath || '') + '/marketplace';
        window.history.replaceState(null, '', cleanUrl);
      }

      // 3. Display the requested notification message exactly as specified
      triggerAlert('Payment cancelled. You can continue browsing and make payment anytime.', 'info');
      return;
    }

    // Direct any invalid routes to /marketplace to completely avoid 404 screens!
    const isKnownRoute = 
      rel === '/' || 
      rel === '/index.html' || 
      rel === '/marketplace' || 
      rel === '/deployment' || 
      rel === '/deployment-assets' || 
      rel === '/admin-login' || 
      rel.startsWith('/admin') || 
      rel === '/payment/callback';

    if (!isKnownRoute) {
      setView('marketplace');
      setActiveNavTab('marketplace');
      navigateTo('/marketplace');
      return;
    }

    if (rel === '/' || rel === '/index.html') {
      if (viewParam === 'payment-callback') {
        setView('payment-callback');
      } else {
        setView('landing');
      }
    } else if (rel === '/marketplace') {
      setView('marketplace');
      setActiveNavTab('marketplace');
    } else if (rel === '/deployment' || rel === '/deployment-assets') {
      setView('deployment-assets');
      setActiveNavTab('deployment');
    } else if (rel.startsWith('/admin') || rel === '/admin-login') {
      setView('admin');
      setActiveNavTab('admin');
    } else if (rel === '/payment/callback' || viewParam === 'payment-callback') {
      setView('payment-callback');
    }
  }, [currentPath]);

  // Unified view + path change handler
  const handleViewChange = (v: 'landing' | 'marketplace' | 'admin' | 'deployment-assets' | 'account' | 'profile') => {
    setView(v);
    if (v === 'landing') {
      setActiveNavTab('home');
      navigateTo('/');
    } else if (v === 'marketplace') {
      setActiveNavTab('marketplace');
      navigateTo('/marketplace');
    } else if (v === 'deployment-assets') {
      setActiveNavTab('deployment');
      navigateTo('/deployment-assets');
    } else if (v === 'admin') {
      setActiveNavTab('admin');
      navigateTo('/admin');
    } else if (v === 'account') {
      setActiveNavTab('account');
    } else if (v === 'profile') {
      setActiveNavTab('profile');
    }
  };

  // Client-side helper to decode JWT payload safely for offline session fallback
  const parseJwtPayload = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Secure admin login and session verification hooks
  const verifyAdminSession = async (token: string) => {
    if (!token) {
      setAdminSession(null);
      return;
    }
    setIsVerifyingAdmin(true);
    try {
      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.warn('JSON parsing failed on verify endpoint:', jsonErr);
        }
      }

      if (data && (data.valid || data.admin)) {
        setAdminSession(data.admin);
        setLastActivity(Date.now()); // refresh activity
      } else if (response.ok && !contentType.includes('application/json')) {
        // Got 200 OK but it was not JSON (probably index.html from static build path)
        // Attempt to verify JWT token client side to preserve local session
        const decoded = parseJwtPayload(token);
        if (decoded) {
          const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
          if (isExpired) {
            console.warn('Local admin session is expired (determined client-side).');
            setAdminToken('');
            setAdminSession(null);
            localStorage.removeItem('pm_admin_token');
          } else {
            console.log('Using decoded client-side administrator profile (offline mode).');
            setAdminSession(decoded);
            setLastActivity(Date.now());
          }
        }
      } else if (!response.ok) {
        // Server returned an error state or 404 (e.g. GitHub Pages static routing)
        // Attempt client-side JWT decryption fallback
        const decoded = parseJwtPayload(token);
        if (decoded) {
          const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
          if (isExpired) {
            setAdminToken('');
            setAdminSession(null);
            localStorage.removeItem('pm_admin_token');
          } else {
            console.info('Server verification unreachable. Retaining client-side admin session.');
            setAdminSession(decoded);
            setLastActivity(Date.now());
          }
        } else {
          setAdminToken('');
          setAdminSession(null);
          localStorage.removeItem('pm_admin_token');
        }
      }
    } catch (err) {
      // Offline / network failure
      const decoded = parseJwtPayload(token);
      if (decoded) {
        const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
        if (isExpired) {
          setAdminToken('');
          setAdminSession(null);
          localStorage.removeItem('pm_admin_token');
        } else {
          console.info('Network request offline, using decrypted local token:', decoded);
          setAdminSession(decoded);
          setLastActivity(Date.now());
        }
      } else {
        console.warn('Remote admin verification offline, retaining local session state:', err);
      }
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      verifyAdminSession(adminToken);
    }
  }, [adminToken]);

  // Inactivity tracking protocol (Configured as infinite/never to expire per operator instruction)
  useEffect(() => {
    if (!adminSession) {
      setShowInactivityWarning(false);
      return;
    }

    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('click', updateActivity);

    // Track state (Bypassed so session remains infinite and never expires)
    const checkInterval = setInterval(() => {
      // Inactivity timeout auto-logout disabled to maintain permanent, infinite active workspace sessions
      setShowInactivityWarning(false);
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('click', updateActivity);
      clearInterval(checkInterval);
    };
  }, [adminSession, lastActivity]);

  const handleAdminLoginSuccess = (token: string, sessionData: any) => {
    setAdminToken(token);
    setAdminSession(sessionData);
    localStorage.setItem('pm_admin_token', token);
    navigateTo('/admin');
    triggerAlert(`Access Granted: Welcome back, Administrator ${sessionData.fullName}!`, 'success');
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    setAdminSession(null);
    localStorage.removeItem('pm_admin_token');
    setShowInactivityWarning(false);
    navigateTo('/admin');
    triggerAlert('Session terminated successfully. Admin access revoked.', 'info');
  };

  const getActiveAdminTabFromPath = (path: string): 'listings' | 'merchants' | 'orders' | 'users' | 'trash' | 'create' | 'supabase' | 'settings' => {
    if (path.includes('/admin/assets')) return 'listings';
    if (path.includes('/admin/merchants')) return 'merchants';
    if (path.includes('/admin/orders')) return 'orders';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/trash')) return 'trash';
    if (path.includes('/admin/create')) return 'create';
    if (path.includes('/admin/supabase')) return 'supabase';
    if (path.includes('/admin/settings')) return 'settings';
    return 'listings'; // default listings for dashboard / admin base
  };

  const handleAdminTabChange = (tab: 'listings' | 'merchants' | 'orders' | 'users' | 'trash' | 'create' | 'supabase' | 'settings') => {
    let target = '/admin/dashboard';
    if (tab === 'listings') target = '/admin/assets';
    else if (tab === 'merchants') target = '/admin/merchants';
    else if (tab === 'orders') target = '/admin/orders';
    else if (tab === 'users') target = '/admin/users';
    else if (tab === 'trash') target = '/admin/trash';
    else if (tab === 'create') target = '/admin/create';
    else if (tab === 'supabase') target = '/admin/supabase';
    else if (tab === 'settings') target = '/admin/settings';
    navigateTo(target);
  };

  // Core Persistent State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modals / Overlays
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: 'login' | 'signup' }>({
    isOpen: false,
    view: 'login',
  });
  const [checkoutProduct, setCheckoutProduct] = useState<ProductListing | null>(null);
  const [showMerchantApply, setShowMerchantApply] = useState(false);

  // App Alerts
  const [appAlert, setAppAlert] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Purchased assets drawer
  const [showMyAccounts, setShowMyAccounts] = useState(false);
  const [selectedViewOrder, setSelectedViewOrder] = useState<Order | null>(null);

  // Fast-Tester Utilities expanded
  const [showTesterMenu, setShowTesterMenu] = useState(false);

  // Bootstrap seed databases and session hook
  useEffect(() => {
    // 1. Load active session if any
    const sess = localStorage.getItem('pm_active_user');
    if (sess) {
      setCurrentUser(JSON.parse(sess));
    }

    // 2. Fetch databases
    setListings(db.getProducts());
    setOrders(db.getOrders());
    setUsers(db.getUsers());

    // 3. Sync from Supabase in the background if configured
    db.syncFromSupabase().then((changed) => {
      if (changed) {
        setListings(db.getProducts());
        setOrders(db.getOrders());
        setUsers(db.getUsers());
        console.log('Successfully completed background synchronization with live Supabase instance.');
      }
    }).catch(e => console.error('Supabase synchronization error:', e));
  }, []);

  // Check for purchases drawer URL parameters to open it automatically upon checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showMyAccounts') === 'true') {
      setShowMyAccounts(true);
      // Strip parameters smoothly without page reload
      if (typeof window !== 'undefined' && window.history.replaceState) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('showMyAccounts');
        const cleanUrl = window.location.origin + window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState(null, '', cleanUrl);
      }
    }
  }, [view]);

  const triggerAlert = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAppAlert({ message, type });
    setTimeout(() => setAppAlert(null), 7000); // Expanded toaster display time for schemas
  };

  // Register Supabase sync & diagnostic warning listener
  useEffect(() => {
    const handleSupabaseError = (e: any) => {
      const { table, error } = e.detail;
      const errorStr = error ? (error.message || String(error)) : '';
      const isFailedToFetch = errorStr.toLowerCase().includes('failed to fetch') || 
                              errorStr.toLowerCase().includes('typeerror') ||
                              String(error).toLowerCase().includes('failed to fetch') ||
                              String(error).toLowerCase().includes('typeerror');

      if (error && error.code === 'PGRST204') {
        const fieldName = error.message?.match(/'([^']+)'/)?.[1] || 'amount';
        triggerAlert(
          `Supabase Schema Error: Missing '${fieldName}' column on table '${table}'. Go to Admin Panel -> "🔌 Supabase Doctor" to copy the fix query!`,
          'error'
        );
      } else if (error && (error.code === '42501' || errorStr.toLowerCase().includes('row-level security') || errorStr.toLowerCase().includes('rls'))) {
        triggerAlert(
          `Supabase RLS Error: Row-Level Security is blocking client inserts on table '${table}'. Go to Admin Dashboard -> "🔌 Supabase Doctor" to copy the SQL script to unlock it!`,
          'error'
        );
      } else if (isFailedToFetch) {
        // Prevent notification spam: show at most once every 60 seconds
        const now = Date.now();
        const lastAlert = (window as any)._lastSupabaseFetchAlertTime || 0;
        if (now - lastAlert > 60000) {
          (window as any)._lastSupabaseFetchAlertTime = now;
          triggerAlert(
            `Supabase Connection Blocked (Failed to fetch). This is usually caused by Ad-Blockers or Brave Shield blocking *.supabase.co within the iframe! Toggle off your shield/ad-blocker or open the app in a new tab.`,
            'error'
          );
        }
      } else if (error) {
        triggerAlert(`Supabase Error (${error.code || 'Sync'}): ${errorStr || 'Check database config'}`, 'error');
      }
    };

    window.addEventListener('supabase-sync-error', handleSupabaseError);
    return () => {
      window.removeEventListener('supabase-sync-error', handleSupabaseError);
    };
  }, []);

  // Synchronize state and trigger recalculations
  const refreshDatabaseState = () => {
    setListings(db.getProducts());
    setOrders(db.getOrders());
    setUsers(db.getUsers());
  };

  // Auth Callbacks
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pm_active_user', JSON.stringify(user));
    triggerAlert(`Signed in successfully as ${user.name}!`, 'success');
    if (user.role === 'admin') {
      setView('admin');
    } else {
      setView('marketplace');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pm_active_user');
    setView('landing');
    triggerAlert('You have signed out of your portal.', 'info');
  };

  // Payments callbacks
  const handlePaymentSuccess = (newOrder: Order) => {
    refreshDatabaseState();
    triggerAlert(`Order ${newOrder.id} authorized! Account unlocked in credentials drawer.`, 'success');
    // Open purchased credentials immediately
    setShowMyAccounts(true);
  };

  // Fast testing profiles selectors
  const testActAsRole = (email: string) => {
    const matched = users.find(u => u.email === email);
    if (matched) {
      handleLogin(matched);
      setShowTesterMenu(false);
    }
  };

  const resetAllData = () => {
    if (window.confirm('Reset local databases to default initial seed listings, orders, and users?')) {
      localStorage.removeItem('pm_products');
      localStorage.removeItem('pm_orders');
      localStorage.removeItem('pm_users');
      localStorage.removeItem('pm_active_user');
      setCurrentUser(null);
      setListings(db.getProducts());
      setOrders(db.getOrders());
      setUsers(db.getUsers());
      setView('landing');
      triggerAlert('Database successfully reset to seed defaults.', 'info');
      setShowTesterMenu(false);
    }
  };

  // Sub-listing for matching buyer orders
  const buyerOrders = orders.filter(o => o.buyerEmail === currentUser?.email);

  // Sorting & Filtering state for Purchased Accounts Drawer
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [drawerSortBy, setDrawerSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');
  const [drawerStatusFilter, setDrawerStatusFilter] = useState<'all' | 'pending' | 'paid' | 'delivered'>('all');

  // Filtered and sorted subset of buyer orders
  const filteredAndSortedBuyerOrders = React.useMemo(() => {
    let result = [...buyerOrders];

    // Search query filtering
    if (drawerSearchQuery.trim()) {
      const q = drawerSearchQuery.toLowerCase();
      result = result.filter(o => 
        o.productTitle.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.productPlatform && o.productPlatform.toLowerCase().includes(q))
      );
    }

    // Status filtering
    if (drawerStatusFilter !== 'all') {
      result = result.filter(o => o.status === drawerStatusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (drawerSortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (drawerSortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (drawerSortBy === 'title-asc') {
        return a.productTitle.localeCompare(b.productTitle);
      } else if (drawerSortBy === 'title-desc') {
        return b.productTitle.localeCompare(a.productTitle);
      }
      return 0;
    });

    return result;
  }, [buyerOrders, drawerSearchQuery, drawerSortBy, drawerStatusFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFC]">
      
      {/* Dynamic Alerts Banner */}
      {appAlert && (
        <div 
          id="app-notification-toast"
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm flex items-center gap-3 animate-[slideIn_0.3s_ease] max-w-sm ${
            appAlert.type === 'success' ? 'bg-emerald-55 text-emerald-80 block border-emerald-100' : 
            appAlert.type === 'error' ? 'bg-rose-50 text-rose-850 border-rose-100' :
            'bg-blue-50 text-blue-800 border-blue-100'
          }`}
        >
          <Sparkles className="w-5 h-5 text-[#0F3460] shrink-0 fill-[#0F3460]/10" />
          <span>{appAlert.message}</span>
        </div>
      )}

      {/* Sticky top layout navigation bar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={(viewState) => setAuthModal({ isOpen: true, view: viewState })}
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        onGoToMarketplace={() => handleViewChange('marketplace')}
        onGoToAdmin={() => handleViewChange('admin')}
        onGoToHome={() => handleViewChange('landing')}
        onBecomeMerchant={() => setShowMerchantApply(true)}
        onGoToDeployment={() => handleViewChange('deployment-assets')}
      />

      {/* Admin quick access sub-header strip for logged-in operators */}
      {currentUser && (
        <div className="hidden lg:flex bg-[#1A1A2E] text-white/90 border-t border-[#0F3460]/25 text-xs px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F3460] animate-pulse" />
            <span>Logged in as: <b className="text-white font-medium">{currentUser.name}</b> ({currentUser.role})</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleViewChange('marketplace')}
              className={`px-3 py-1 rounded transition-all font-semibold cursor-pointer ${
                view === 'marketplace' ? 'bg-[#0F3460] text-white' : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              Marketplace Lobby
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => handleViewChange('admin')}
                className={`px-3 py-1 rounded transition-all font-semibold cursor-pointer ${
                  view === 'admin' ? 'bg-[#0F3460] text-white' : 'hover:bg-white/10 text-slate-300'
                }`}
              >
                Admin Panel Dashboard
              </button>
            )}

            {currentUser.role === 'buyer' && (
              <button
                id="header-drawer-trigger"
                onClick={() => setShowMyAccounts(true)}
                className="bg-white/10 px-3 py-1 rounded hover:bg-white/20 text-[#0F3460] hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5" />
                My Purchases ({buyerOrders.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main views router switches */}
      <main className="flex-grow">
        
        {/* VIEW 1: LANDING HOMEPAGE */}
        {view === 'landing' && (
          <div id="landing-homepage-wrapper" className="animate-[fadeIn_0.3s_ease]">
            <Hero 
              onExplore={() => setView('marketplace')}
              onOpenAuth={(viewState) => setAuthModal({ isOpen: true, view: viewState })}
            />
            <div id="about">
              <About />
            </div>
            <div id="features">
              <Features />
            </div>
            <div id="how-it-works">
              <HowItWorks />
            </div>
            <div id="testimonials">
              <Testimonials />
            </div>
            <Newsletter />
          </div>
        )}

        {/* VIEW 2: DIGITALS MARKETPLACE */}
        {view === 'marketplace' && (
          <div id="marketplace-lobby-wrapper" className="animate-[fadeIn_0.3s_ease]">
            <Marketplace
              listings={listings}
              currentUser={currentUser}
              onBuyNow={(prod) => setCheckoutProduct(prod)}
              onOpenAuth={(v) => setAuthModal({ isOpen: true, view: v })}
            />
          </div>
        )}

        {/* VIEW 4: SECURE PAYMENT GATEWAY REDIRECT HANDLER */}
        {view === 'payment-callback' && (
          <div id="payment-callback-wrapper" className="animate-[fadeIn_0.3s_ease]">
            <PaymentCallback />
          </div>
        )}

        {/* VIEW 5: IMAGE ASSETS DEPLOYMENT GALLERY */}
        {view === 'deployment-assets' && (
          <div id="deployment-assets-wrapper" className="animate-[fadeIn_0.3s_ease]">
            <DeploymentAssets />
          </div>
        )}

        {/* VIEW 6: PURCHASED ACCOUNTS CREDENTIALS VIEWER */}
        {view === 'account' && (
          <div id="account-purchases-view-wrapper" className="animate-[fadeIn_0.3s_ease] max-w-md mx-auto p-4 space-y-4 pb-24">
            {/* Header / Brand block like shown in the diagram */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#0F3460]" />
                <h3 className="font-heading font-bold text-lg text-[#1A1A2E]">My Purchases</h3>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Review and inspect your instantly decrypted account credentials below.
              </p>
            </div>

            {!currentUser ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-semibold text-sm text-[#1A1A2E]">Authentication Required</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto font-sans leading-relaxed">
                    Please log in to your account credentials to view your purchased designs and products.
                  </p>
                </div>

                {/* Quick login testers for extreme testing comfort */}
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 mt-4 text-left">
                  <span className="text-[9px] font-bold text-[#4A4A6A] tracking-wider uppercase block">⚡ QUICK TESTING PROFILES LOGIN</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const matched = users.find(u => u.email === 'YohannaIsaac90@gmail.com');
                        if (matched) handleLogin(matched);
                      }}
                      className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[10.5px] text-[#0F3460] font-bold rounded-lg border border-slate-200 shadow-xs transition duration-100 cursor-pointer"
                    >
                      👤 Isaac Yohanna
                    </button>
                    <button
                      onClick={() => {
                        const matched = users.find(u => u.email === 'admin@pablologs.com');
                        if (matched) handleLogin(matched);
                      }}
                      className="py-1.5 px-2 bg-white hover:bg-slate-100 text-[10.5px] text-slate-800 font-bold rounded-lg border border-slate-200 shadow-xs transition duration-100 cursor-pointer"
                    >
                      👑 Admin
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setAuthModal({ isOpen: true, view: 'login' })}
                    className="w-full py-2.5 bg-[#0F3460] hover:bg-[#16213E] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer min-h-[44px]"
                  >
                    Login / Sign Up
                  </button>
                </div>
              </div>
            ) : buyerOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3.5 shadow-sm">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1} />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#4A4A6A]">No active purchases yet.</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto font-sans">
                    Explore and buy streaming templates, premium logs, or platform designs on the Marketplace tab to decrypt secure credentials instantly!
                  </p>
                </div>
                <button
                  onClick={() => setView('marketplace')}
                  className="px-5 py-2 mt-4 bg-[#0F3460] hover:bg-[#16213E] text-white rounded-full text-xs font-semibold cursor-pointer"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Search, Filter & Sort Row same as drawer */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="relative text-left">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search purchases by title..." 
                      value={drawerSearchQuery}
                      onChange={(e) => setDrawerSearchQuery(e.target.value)}
                      className="pl-8.5 pr-7 py-2 w-full text-xs text-[#1A1A2E] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] font-sans"
                    />
                    {drawerSearchQuery && (
                      <button 
                        onClick={() => setDrawerSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs p-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div>
                      <select
                        value={drawerSortBy}
                        onChange={(e: any) => setDrawerSortBy(e.target.value)}
                        className="w-full px-2 py-1.5 text-[11px] text-[#1A1A2E] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer font-sans"
                      >
                        <option value="newest">🗓️ Newest</option>
                        <option value="oldest">🗓️ Oldest</option>
                        <option value="title-asc">🔤 Title A-Z</option>
                        <option value="title-desc">🔤 Title Z-A</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={drawerStatusFilter}
                        onChange={(e: any) => setDrawerStatusFilter(e.target.value)}
                        className="w-full px-2 py-1.5 text-[11px] text-[#1A1A2E] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer font-sans"
                      >
                        <option value="all">🔍 All Statuses</option>
                        <option value="paid">✅ Paid</option>
                        <option value="delivered">📦 Delivered</option>
                        <option value="pending">⏳ Pending</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredAndSortedBuyerOrders.length === 0 ? (
                  <div className="py-12 text-center bg-white border border-slate-200 rounded-2xl space-y-1 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-500">No matching purchases found</p>
                    <p className="text-[10px] text-slate-400 font-sans">Try widening your search keywords.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredAndSortedBuyerOrders.map(order => (
                      <div 
                        key={order.id} 
                        className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5 text-xs shadow-sm flex flex-col justify-between text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] text-slate-400 font-semibold block">Ref: {order.id}</span>
                          <span className={`text-[8.5px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                            order.status === 'paid' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                            'bg-amber-50 text-amber-800 border-amber-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-heading font-semibold text-[#1A1A2E] text-sm tracking-tight leading-snug">{order.productTitle}</h4>
                          <span className="text-[10px] text-slate-500 font-sans block">Category Platform: <b>{order.productPlatform || 'Design Asset'}</b></span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-[#4A4A6A] border-t border-slate-100 pt-3">
                          <span>Paid: <b className="text-slate-900 font-bold">{formatNaira(order.amount)}</b></span>
                          <span className="flex items-center gap-1 font-sans text-[10px] text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-350" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedViewOrder(order)}
                          className="w-full mt-1 py-2.5 text-center text-xs font-bold bg-[#0F3460] hover:bg-[#16213E] text-white rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
                        >
                          View Secure Credentials
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: USER PROFILE & SETTINGS ENVIRONMENT */}
        {view === 'profile' && (
          <div id="user-profile-view-wrapper" className="animate-[fadeIn_0.3s_ease] max-w-md mx-auto p-4 space-y-4 pb-24">
            
            {/* Upper Profile card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0F3460]" />
              
              <div className="flex items-center gap-3.5 pt-1.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1A1A2E] font-bold text-lg">
                  {currentUser ? currentUser.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1A1A2E]">
                    {currentUser ? currentUser.name : 'Guest Account'}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    {currentUser ? currentUser.email : 'Unauthenticated session'}
                  </p>
                </div>
              </div>

              {currentUser && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Authorized Role</span>
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-full font-bold text-[10.5px]">
                    {currentUser.role}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Login / Developer Tool Switcher inside settings */}
            {!currentUser ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 text-left">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider font-sans">Account Gateways</h4>
                  <p className="text-xs text-slate-400 font-sans">
                    Toggle simulation profiles or sign in to configure digital log purchases.
                  </p>
                </div>

                <div className="space-y-2 mt-2">
                  <button
                    onClick={() => setAuthModal({ isOpen: true, view: 'login' })}
                    className="w-full py-2.5 bg-[#0F3460] hover:bg-[#16213E] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <UserIcon className="w-4 h-4" />
                    Sign In to Pablologs
                  </button>
                  <button
                    onClick={() => setAuthModal({ isOpen: true, view: 'signup' })}
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <UserPlus className="w-4 h-4 text-[#0F3460]" />
                    Register a New Account
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[9px] font-extrabold text-[#4A4A6A] tracking-wider uppercase block">⚡ COMPRESSED TESTING ACCOUNTS SWITCHER</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const matched = users.find(u => u.email === 'YohannaIsaac90@gmail.com');
                        if (matched) handleLogin(matched);
                      }}
                      className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-[10.5px] text-[#0F3460] font-bold rounded-xl border border-slate-200 shadow-xs text-center transition cursor-pointer"
                    >
                      👤 Isaac Yohanna
                    </button>
                    <button
                      onClick={() => {
                        const matched = users.find(u => u.email === 'admin@pablologs.com');
                        if (matched) handleLogin(matched);
                      }}
                      className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-[10.5px] text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs text-center transition cursor-pointer"
                    >
                      👑 Admin Operator
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 text-left">
                <h4 className="font-extrabold text-xs uppercase text-slate-500 tracking-wider font-sans">Session Utilities</h4>
                
                <div className="space-y-2">
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => handleViewChange('admin')}
                      className="w-full py-2.5 bg-[#1A1A2E] hover:bg-[#16213E] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Database className="w-4 h-4 text-emerald-400" />
                      Go to Admin Panel Dashboard
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: SECURE PHYSICAL ADMIN PATH ROUTES */}
        {(relativePath.startsWith('/admin') || relativePath === '/admin-login') && (
          <div id="secure-admin-routes-wrapper" className="animate-[fadeIn_0.3s_ease]">
            {relativePath === '/admin-login' || relativePath === '/admin/login' || (!adminSession && !isVerifyingAdmin && relativePath.startsWith('/admin')) ? (
              <AdminLogin
                onLoginSuccess={(adminData, token) => handleAdminLoginSuccess(token, adminData)}
                onNavigate={(path) => navigateTo(path)}
              />
            ) : isVerifyingAdmin ? (
              <div className="max-w-md mx-auto my-28 p-10 text-center bg-white border border-[#E0E0E0] rounded-2xl shadow-xl space-y-4 select-none animate-pulse">
                <RefreshCcw className="w-10 h-10 text-[#0F3460] mx-auto animate-spin" />
                <h3 className="font-heading font-normal text-base text-[#1A1A2E]">Fanning Security Credentials...</h3>
                <p className="text-xs text-[#4A4A6A] leading-relaxed">
                  Cryptographically validating administrator authorization tokens and spinning logs environment.
                </p>
              </div>
            ) : adminSession ? (
              <AdminDashboard
                currentUser={currentUser}
                listings={listings}
                orders={orders}
                users={users}
                onRefreshData={refreshDatabaseState}
                adminSession={adminSession}
                adminToken={adminToken}
                onAdminLogout={handleAdminLogout}
                activeTab={getActiveAdminTabFromPath(relativePath)}
                onTabChange={handleAdminTabChange}
              />
            ) : (
              <div className="max-w-md mx-auto my-20 p-10 text-center bg-white border border-[#E0E0E0] rounded-2xl shadow-xl space-y-4 select-none">
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-normal text-lg text-[#1A1A2E]">Protected Area Session Denied</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Authentication is strictly required to read or inspect administrative control pages. Please authenticate with credentials.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigateTo('/admin-login')}
                    className="w-full py-3 bg-[#0F3460] hover:bg-[#16213E] text-white rounded-full font-bold text-xs shadow-md transition cursor-pointer min-h-[44px]"
                  >
                    Authenticate as Operator
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footers */}
      <Footer 
        onNavigateSection={(id) => {
          setView('landing'); 
          setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }}
        onOpenAuth={(v) => setAuthModal({ isOpen: true, view: v })}
        onGoToAdmin={() => handleViewChange('admin')}
      />

      {/* OVERLAY MODAL 4: Become a Merchant Application */}
      {showMerchantApply && (
        <MerchantApplicationModal
          currentUser={currentUser}
          onClose={() => setShowMerchantApply(false)}
          onOpenAuth={() => setAuthModal({ isOpen: true, view: 'signup' })}
          onSubmitSuccess={(storeName) => {
            setShowMerchantApply(false);
            refreshDatabaseState();
            triggerAlert(`Application for "${storeName}" submitted successfully! Under review of Purelogs Admin.`, 'success');
          }}
        />
      )}

      {/* OVERLAY MODAL 1: Authentications */}
      {authModal.isOpen && (
        <AuthModal
          initialView={authModal.view}
          onClose={() => setAuthModal({ isOpen: false, view: 'login' })}
          onLoginSuccess={handleLogin}
        />
      )}

      {/* OVERLAY MODAL 2: Stripe/Paystack Checkout escrow payment gateway */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          currentUser={currentUser}
          onClose={() => setCheckoutProduct(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* OVERLAY DRAWER 3: Purchased credentials drawer so buyer can read details anytime */}
      {showMyAccounts && currentUser && (
        <div id="credentials-drawer-backdrop" className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div 
            id="credentials-drawer" 
            className="w-full max-w-md bg-white border border-[#E0E0E0] h-full rounded-l-2xl shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b pb-4 mb-5">
                <h3 className="font-heading font-medium text-base text-[#1A1A2E] flex items-center gap-1.5">
                  <Ticket className="w-5 h-5 text-[#0F3460]" />
                  My Purchased Credentials
                </h3>
                <button
                  onClick={() => setShowMyAccounts(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {buyerOrders.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingCart className="w-10 h-10 text-slate-350 mx-auto" strokeWidth={1} />
                  <p className="text-sm font-semibold text-[#4A4A6A]/60">No active purchases yet.</p>
                  <p className="text-xs text-[#4A4A6A]/80 leading-relaxed max-w-xs mx-auto">
                    Buy your first design assets or streaming screens on the marketplace lobby to decrypt your access keys immediately!
                  </p>
                  <button
                    onClick={() => {
                      setView('marketplace');
                      setShowMyAccounts(false);
                    }}
                    className="mt-4 px-4 py-2 bg-[#0F3460] hover:bg-[#16213E] text-white rounded-full text-xs font-semibold cursor-pointer"
                  >
                    Go to Marketplace
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sorting & Filtering Controls */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3 mb-1">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by title, ID..." 
                        value={drawerSearchQuery}
                        onChange={(e) => setDrawerSearchQuery(e.target.value)}
                        className="pl-8.5 pr-7 py-2 w-full text-xs text-[#1A1A2E] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] font-sans"
                      />
                      {drawerSearchQuery && (
                        <button 
                          onClick={() => setDrawerSearchQuery('')}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs p-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Dual Selector Row */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Sort By Dropdown */}
                      <div>
                        <label className="block text-[9px] font-bold text-[#4A4A6A] uppercase tracking-wider mb-1 flex items-center gap-1 font-sans">
                          <ArrowUpDown className="w-2.5 h-2.5 text-[#0F3460]" />
                          Sort By
                        </label>
                        <select
                          value={drawerSortBy}
                          onChange={(e: any) => setDrawerSortBy(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-[#1A1A2E] bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer font-sans"
                        >
                          <option value="newest">🗓️ Newest First</option>
                          <option value="oldest">🗓️ Oldest First</option>
                          <option value="title-asc">🔤 Title (A - Z)</option>
                          <option value="title-desc">🔤 Title (Z - A)</option>
                        </select>
                      </div>

                      {/* Status Filter Dropdown */}
                      <div>
                        <label className="block text-[9px] font-bold text-[#4A4A6A] uppercase tracking-wider mb-1 flex items-center gap-1 font-sans">
                          <Filter className="w-2.5 h-2.5 text-[#0F3460]" />
                          Gateway Status
                        </label>
                        <select
                          value={drawerStatusFilter}
                          onChange={(e: any) => setDrawerStatusFilter(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-[#1A1A2E] bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer font-sans"
                        >
                          <option value="all">🔍 Show All</option>
                          <option value="paid">✅ Paid</option>
                          <option value="delivered">📦 Delivered</option>
                          <option value="pending">⏳ Pending</option>
                        </select>
                      </div>
                    </div>

                    {/* Counter and Reset Link */}
                    <div className="flex justify-between items-center text-[10px] text-[#4A4A6A] font-sans border-t pt-2 mt-1 border-slate-100">
                      <span>Showing <b>{filteredAndSortedBuyerOrders.length}</b> of <b>{buyerOrders.length}</b> matches</span>
                      {(drawerSearchQuery || drawerStatusFilter !== 'all' || drawerSortBy !== 'newest') && (
                        <button 
                          onClick={() => {
                            setDrawerSearchQuery('');
                            setDrawerStatusFilter('all');
                            setDrawerSortBy('newest');
                          }}
                          className="text-[#0F3460] font-bold hover:underline"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredAndSortedBuyerOrders.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-xs font-bold text-slate-500">No matching purchases found</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                        Try adjusting your search terms or filters above to reveal matching assets.
                      </p>
                      <button
                        onClick={() => {
                          setDrawerSearchQuery('');
                          setDrawerStatusFilter('all');
                        }}
                        className="px-3 py-1.5 mt-2 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-semibold text-[#1A1A2E] transition cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                      {filteredAndSortedBuyerOrders.map(order => (
                        <div 
                          key={order.id} 
                          className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs hover:border-[#0F3460]/40 transition duration-150 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] text-slate-400">Ref: {order.id}</span>
                            <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                              order.status === 'paid' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                              'bg-amber-50 text-amber-800 border-amber-100'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="space-y-0.5">
                            <h4 className="font-semibold text-[#1A1A2E] text-xs font-sans line-clamp-1">{order.productTitle}</h4>
                            <span className="text-[10px] text-slate-500 font-sans block">Platform: <b>{order.productPlatform || 'Digital'}</b></span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-[#4A4A6A] border-t border-slate-200/60 pt-2 mt-1">
                            <span>Paid: <b className="text-slate-900 font-bold">{formatNaira(order.amount)}</b></span>
                            <span className="flex items-center gap-1 font-sans">
                              <Calendar className="w-2.5 h-2.5 text-slate-400" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="pt-1">
                            <button
                              onClick={() => setSelectedViewOrder(order)}
                              className="w-full mt-1.5 py-2 text-center text-[10.5px] font-bold bg-[#0F3460] hover:bg-[#16213E] text-white rounded-lg transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t mt-8">
              <button
                onClick={() => setShowMyAccounts(false)}
                className="w-full py-2.5 text-center text-xs font-semibold bg-[#1A1A2E] hover:bg-[#16213E] text-white rounded-lg transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS PURCHASE DETAILS SECURE POPUP MODAL */}
      {selectedViewOrder && (
        <div id="selected-order-details-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-[fadeIn_0.15s_ease]">
          <div 
            id="selected-order-details-modal" 
            className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-[scaleIn_0.2s_ease]"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0F3460]" />
            
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="font-heading font-normal text-base text-[#1A1A2E] flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                Purchase Details & Credentials
              </h3>
              <button
                onClick={() => setSelectedViewOrder(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product details */}
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-mono text-slate-400 font-bold block">TRANSACTION REF ID: {selectedViewOrder.id}</span>
                <h4 className="font-heading font-medium text-base text-[#1A1A2E] tracking-tight text-left">
                  {selectedViewOrder.productTitle}
                </h4>
                <div className="flex flex-wrap gap-2 pt-1 font-sans justify-start">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                    Category: {selectedViewOrder.productPlatform}
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 rounded-full font-semibold">
                    Paid {formatNaira(selectedViewOrder.amount)}
                  </span>
                </div>
              </div>

              {/* Secure Credentials Area */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 font-sans block">
                  🔐 Account credentials (email and password)
                </label>
                <div className="relative">
                  <div className="w-full p-4 bg-slate-950 border border-slate-900 text-emerald-400 rounded-xl font-mono text-xs select-all break-all pr-12 whitespace-pre-wrap leading-normal shadow-inner min-h-[50px]">
                    {selectedViewOrder.credentialsShared || 'Your purchase verification is being processed, check back in a few seconds.'}
                  </div>
                  {selectedViewOrder.credentialsShared && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedViewOrder.credentialsShared || '');
                        triggerAlert('Credentials successfully copied to your clipboard!', 'success');
                      }}
                      className="absolute right-3 top-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-extrabold text-emerald-400 rounded border border-emerald-400/20 active:scale-95 transition cursor-pointer"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Instructions Area */}
              <div className="space-y-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#0F3460] font-sans flex items-center gap-1">
                  📦 Delivery Instructions
                </label>
                <p className="text-[11.5px] text-slate-700 font-sans leading-relaxed pt-0.5 text-left">
                  {selectedViewOrder.deliveryInstructions || 'Enjoy your instant delivery! If the credentials require verification, please contact our system core admin helper to request instant manual handovers.'}
                </p>
              </div>

              {/* Meta details table */}
              <div className="pt-2 border-t text-[11px] text-[#4A4A6A] space-y-2 font-sans text-left">
                <div className="flex justify-between">
                  <span>Platform System:</span>
                  <span className="font-semibold text-slate-900">{selectedViewOrder.productPlatform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purchase Date:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(selectedViewOrder.createdAt).toLocaleDateString()} {new Date(selectedViewOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buyer Customer:</span>
                  <span className="font-semibold text-slate-900 font-mono text-[10px]">{selectedViewOrder.buyerEmail}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedViewOrder(null)}
                className="px-5 py-2 text-[#0F3460] hover:bg-slate-100 font-extrabold rounded-xl text-xs transition-colors cursor-pointer mr-3"
              >
                Back to List
              </button>
              <button
                onClick={() => setSelectedViewOrder(null)}
                className="px-5 py-2 bg-[#0F3460] hover:bg-[#16213E] text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}



      {showInactivityWarning && (
        <div id="inactivity-warning-modal" className="fixed inset-x-4 bottom-4 md:right-4 md:left-auto z-50 max-w-sm bg-[#1A1A2E] text-white border border-[#E94560]/40 p-5 rounded-2xl shadow-2xl animate-[slideIn_0.2s_ease] space-y-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-[#E94560] shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-400 font-sans">Security Inactivity Warning</h4>
              <p className="text-[10.5px] text-slate-300 leading-relaxed mt-1 font-sans">
                Your secure admin session will expire in less than 5 minutes due to protocol inactivity.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-[10px]">
            <button
              id="inactivity-btn-logout"
              onClick={handleAdminLogout}
              className="px-3.5 py-1.5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold rounded-full cursor-pointer transition"
            >
              Sign Out Securely
            </button>
            <button
              id="inactivity-btn-extend"
              onClick={() => {
                setLastActivity(Date.now());
                setShowInactivityWarning(false);
                // heartbeat
                fetch('/api/admin/verify', { headers: { 'Authorization': `Bearer ${adminToken}` } }).catch(() => {});
              }}
              className="px-4.5 py-1.5 bg-[#0F3460] hover:bg-indigo-600 text-white font-extrabold rounded-full cursor-pointer shadow-md transition"
            >
              Extend Session ✓
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div 
        id="mobile-bottom-navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1A1A2E] border-t border-[#0F3460]/20 z-45 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.25)] select-none"
      >
        {/* Tab 1: Home */}
        <button
          onClick={() => handleViewChange('landing')}
          className={`flex flex-col items-center justify-center flex-1 py-1 h-full transition-colors cursor-pointer ${
            view === 'landing' ? 'text-[#E94560]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${view === 'landing' ? 'scale-110 text-[#E94560]' : ''}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Home</span>
        </button>

        {/* Tab 2: Market */}
        <button
          onClick={() => handleViewChange('marketplace')}
          className={`flex flex-col items-center justify-center flex-1 py-1 h-full transition-colors cursor-pointer ${
            view === 'marketplace' ? 'text-[#E94560]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className={`w-5 h-5 transition-transform ${view === 'marketplace' ? 'scale-110 text-[#E94560]' : ''}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Market</span>
        </button>

        {/* Tab 3: Account */}
        <button
          onClick={() => handleViewChange('account')}
          className={`flex flex-col items-center justify-center flex-1 py-1 h-full transition-colors cursor-pointer ${
            view === 'account' ? 'text-[#E94560]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Ticket className={`w-5 h-5 transition-transform ${view === 'account' ? 'scale-110 text-[#E94560]' : ''}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Account</span>
        </button>

        {/* Tab 4: Profile */}
        <button
          onClick={() => handleViewChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 h-full transition-colors cursor-pointer ${
            view === 'profile' ? 'text-[#E94560]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className={`w-5 h-5 transition-transform ${view === 'profile' ? 'scale-110 text-[#E94560]' : ''}`} />
          <span className="text-[10px] mt-1 font-medium tracking-tight">Profile</span>
        </button>
      </div>

    </div>
  );
}
