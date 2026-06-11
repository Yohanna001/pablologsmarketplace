import React, { useState, useEffect } from 'react';
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
  HelpCircle, Trash2, ArrowRight, UserPlus, Sparkles, RefreshCcw, Database, X, Lock
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

// Parse initial route checking both physical paths and hash fallback for GitHub Pages
const getInitialPath = (): string => {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    const target = hash.substring(1);
    return basePath ? `${basePath}${target}` : target;
  }
  return window.location.pathname;
};

export default function App() {
  // Navigation & Pathname Physical Routing
  const [currentPath, setCurrentPath] = useState(getInitialPath());
  const [view, setView] = useState<'landing' | 'marketplace' | 'admin' | 'payment-callback' | 'deployment-assets'>('landing');
  const [activeNavTab, setActiveNavTab] = useState('home');

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

  // Physical routing navigate helper
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
      window.history.pushState(null, '', targetWithBase);
      setCurrentPath(targetWithBase);
    }
  };

  // Physical Router Path synchronizer
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/')) {
        const target = hash.substring(1);
        setCurrentPath(basePath ? `${basePath}${target}` : target);
      } else {
        setCurrentPath(window.location.pathname);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

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

    if (rel === '/' || rel === '/index.html') {
      setView('landing');
    } else if (rel === '/marketplace') {
      setView('marketplace');
      setActiveNavTab('marketplace');
    } else if (rel === '/deployment' || rel === '/deployment-assets') {
      setView('deployment-assets');
      setActiveNavTab('deployment');
    } else if (rel.startsWith('/admin') || rel === '/admin-login') {
      setView('admin');
      setActiveNavTab('admin');
    } else if (rel === '/payment/callback') {
      setView('payment-callback');
    }
  }, [currentPath]);

  // Unified view + path change handler
  const handleViewChange = (v: 'landing' | 'marketplace' | 'admin' | 'deployment-assets') => {
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

  // Inactivity tracking protocol (30m timeout, warning at 25m)
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

    // Track state every 10 seconds
    const checkInterval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivity;
      const inactiveMinutes = inactiveMs / 1000 / 60;

      if (inactiveMinutes >= 30) {
        handleAdminLogout();
        triggerAlert('Security Session Expired: Signed out automatically after 30 minutes of inactivity.', 'error');
      } else if (inactiveMinutes >= 25) {
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
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
        <div className="bg-[#1A1A2E] text-white/90 border-t border-[#0F3460]/25 text-xs px-4 py-2 flex items-center justify-between gap-4">
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

            {currentUser.role === 'buyer' && buyerOrders.length > 0 && (
              <button
                id="header-drawer-trigger"
                onClick={() => setShowMyAccounts(true)}
                className="bg-white/10 px-3 py-1 rounded hover:bg-white/20 text-[#0F3460] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5" />
                My Purchased Accounts ({buyerOrders.length})
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
                  {buyerOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="p-4 bg-slate-50 border border-[#E0E0E0] rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400">ID: {order.id}</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-800 uppercase font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                          {order.status}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-[#1A1A2E] text-xs">{order.productTitle}</h4>
                      
                      <div className="p-2.5 bg-[#1A1A2E] text-emerald-400 font-mono text-[10px] rounded border border-[#0F3460]/20 break-all select-all">
                        {order.credentialsShared || 'Pending server delivery details. Please notify admin helper.'}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-[#4A4A6A] border-t pt-2 mt-2">
                        <span>Paid: <b className="text-[#1A1A2E]">{formatNaira(order.amount)}</b></span>
                        <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
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

    </div>
  );
}
