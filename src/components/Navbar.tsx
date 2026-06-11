import React, { useState } from 'react';
import { Menu, X, User, LogOut, Shield, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenAuth: (view: 'login' | 'signup') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onGoToMarketplace: () => void;
  onGoToAdmin: () => void;
  onGoToHome: () => void;
  onBecomeMerchant: () => void;
  onGoToDeployment?: () => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onOpenAuth,
  activeTab,
  setActiveTab,
  onGoToMarketplace,
  onGoToAdmin,
  onGoToHome,
  onBecomeMerchant,
  onGoToDeployment,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Features', id: 'features' },
    { name: 'How It Works', id: 'how-it-works' },
    { name: 'Testimonials', id: 'testimonials' },
  ];

  const handleLinkClick = (id: string) => {
    onGoToHome();
    setActiveTab(id);
    setIsOpen(false);
    
    // Smooth scroll to element
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const isMerchantPending = currentUser?.role === 'merchant' && !currentUser.isApprovedMerchant;

  return (
    <nav id="app-navbar" className="sticky top-0 z-50 bg-[#1A1A2E] border-b border-[#E0E0E0]/20 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={onGoToHome}>
            <span className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#0F3460] flex items-center justify-center text-white text-base">P</span>
              Pablologsmarketplace
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => handleLinkClick(link.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-white hover:bg-white/10 ${
                    activeTab === link.id ? 'text-white font-bold bg-white/15' : 'text-white/80'
                  }`}
                >
                  {link.name}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4 border-l border-[#E0E0E0]/20 pl-6">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-medium text-white max-w-[150px] truncate">{currentUser.name}</span>
                    <span className="text-[10px] text-[#4A4A6A] uppercase tracking-widest font-semibold">
                      {currentUser.role} {isMerchantPending && '(Pending)'}
                    </span>
                  </div>
                  
                  {/* Quick Action Navigation links */}
                  <button
                    id="nav-btn-marketplace"
                    onClick={onGoToMarketplace}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0F3460] text-white hover:bg-[#16213E] rounded-full transition-all shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Marketplace
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      id="nav-btn-admin"
                      onClick={onGoToAdmin}
                      className="flex items-center gap-1 bg-white/10 p-2 rounded-full hover:bg-white/20 transition"
                      title="Admin Dashboard"
                    >
                      <LayoutDashboard className="w-4 h-4 text-white" />
                    </button>
                  )}

                  <button
                    id="nav-btn-logout"
                    onClick={onLogout}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAFAFC] hover:text-red-400 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    id="nav-btn-login"
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-2 text-sm font-medium text-[#FAFAFC] hover:text-white transition"
                  >
                    Login
                  </button>
                  <button
                    id="nav-btn-register"
                    onClick={() => onOpenAuth('signup')}
                    className="px-5 py-2 text-sm font-semibold bg-[#0F3460] text-white hover:bg-[#16213E] rounded-full transition shadow-sm"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex lg:hidden items-center">
            {currentUser && (
              <button
                id="mobile-nav-marketplace-shortcut"
                onClick={onGoToMarketplace}
                className="mr-3 px-3 py-1.5 text-xs font-semibold bg-[#0F3460] text-white rounded-full flex items-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                Shop
              </button>
            )}
            <button
              id="mobile-menu-hamburger"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0F3460] text-[#FAFAFC] hover:text-white transition"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu, show/hide based on hamburger click */}
      {isOpen && (
        <div id="mobile-menu-container" className="lg:hidden bg-[#1A1A2E] border-t border-[#E0E0E0]/15 py-3 px-4 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                id={`mobile-nav-link-${link.id}`}
                onClick={() => handleLinkClick(link.id)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                  activeTab === link.id
                    ? 'bg-white/15 text-white pl-5 font-bold'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 pb-2">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center px-3 space-x-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">{currentUser.name}</div>
                    <div className="text-xs text-[#4A4A6A] capitalize">
                      {currentUser.role} {isMerchantPending && '(Pending Approval)'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 px-2 pt-2">
                  <button
                    id="mobile-btn-marketplace"
                    onClick={() => {
                      onGoToMarketplace();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-[#0F3460] text-white hover:bg-[#16213E] rounded-lg transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Marketplace
                  </button>

                  {currentUser.role === 'admin' ? (
                    <button
                      id="mobile-btn-admin"
                      onClick={() => {
                        onGoToAdmin();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/5"
                    >
                      <Shield className="w-4 h-4" />
                      Dashboard
                    </button>
                  ) : (
                    <button
                      id="mobile-btn-logout"
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-red-400 rounded-lg transition border border-white/5"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  )}
                </div>

                {currentUser.role === 'admin' && (
                  <div className="px-2 pb-1">
                    <button
                      id="mobile-btn-logout-extra"
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                      className="w-full py-2 text-center text-xs text-[#4A4A6A] border-t border-white/10 mt-2 hover:text-red-400"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-2">
                <button
                  id="mobile-btn-login"
                  onClick={() => {
                    onOpenAuth('login');
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-base font-medium border border-[#E0E0E0]/20 hover:bg-white/5 rounded-lg transition"
                >
                  Login
                </button>
                <button
                  id="mobile-btn-register"
                  onClick={() => {
                    onOpenAuth('signup');
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-base font-semibold bg-[#0F3460] text-white hover:bg-[#16213E] rounded-lg transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
