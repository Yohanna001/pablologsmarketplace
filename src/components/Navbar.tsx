import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, Shield, ShoppingCart, LayoutDashboard, Wallet, Settings, Edit2, Check, RefreshCw, Ticket, ShoppingBag } from 'lucide-react';
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
  onGoToWallet?: () => void;
  onUpdateProfile?: (updated: UserType) => void;
  purchasedOrders?: any[];
  onViewPurchase?: (order: any) => void;
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
  onGoToWallet,
  onUpdateProfile,
  purchasedOrders = [],
  onViewPurchase
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(currentUser?.name || '');
  const [newPhone, setNewPhone] = useState(currentUser?.phone || '+234800055555');
  const [isSaving, setIsSaving] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync edits if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setNewName(currentUser.name);
      setNewPhone(currentUser.phone || '+234800055555');
    }
  }, [currentUser]);

  // Click outside detection for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
        setEditMode(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !onUpdateProfile) return;
    setIsSaving(true);
    
    // Simulate minor network sync
    setTimeout(() => {
      const updatedUser: UserType = {
        ...currentUser,
        name: newName,
        phone: newPhone
      };
      onUpdateProfile(updatedUser);
      setEditMode(false);
      setIsSaving(false);
    }, 600);
  };

  const isMerchantPending = currentUser?.role === 'merchant' && !currentUser.isApprovedMerchant;

  return (
    <nav id="app-navbar" className="sticky top-0 z-50 bg-[#1A1A2E] border-b border-[#0F3460]/20 text-white shadow-xl select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer gap-2" onClick={onGoToHome}>
            <div className="w-8 h-8 rounded-lg bg-[#E94560] flex items-center justify-center text-white font-heading font-extrabold text-base">P</div>
            <span className="text-sm sm:text-base font-heading font-extrabold text-white tracking-widest uppercase">
              Pablologs
            </span>
          </div>

          {/* Navigation Links - Center (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={onGoToHome}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-white/10 ${
                activeTab === 'home' ? 'bg-[#E94560] text-white' : 'text-slate-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={onGoToMarketplace}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-white/10 ${
                activeTab === 'marketplace' ? 'bg-[#E94560] text-white' : 'text-slate-300'
              }`}
            >
              Marketplace
            </button>
            {currentUser && onGoToWallet && (
              <button
                onClick={onGoToWallet}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-white/10 ${
                  activeTab === 'wallet' ? 'bg-[#E94560] text-white' : 'text-slate-300'
                }`}
              >
                Wallet
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onGoToAdmin}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all hover:bg-white/10 ${
                  activeTab === 'admin' ? 'bg-[#0F3460] text-white' : 'text-slate-300'
                }`}
              >
                Admin Panel
              </button>
            )}
          </div>

          {/* Right Header Controls (Always Visible Cross-Viewport) */}
          <div className="flex items-center space-x-3 relative" ref={dropdownRef}>
            {currentUser ? (
              <>
                {/* WALLET BUTTON ACCENT SHUTTLE */}
                {onGoToWallet && (
                  <button
                    onClick={onGoToWallet}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#0F3460] hover:bg-[#16213E] text-white flex items-center gap-1.5 transition-all"
                    title="Open Digital Wallet Ledger"
                  >
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline text-xs font-bold font-mono">Wallet</span>
                  </button>
                )}

                {/* USER PROFILE ACCESS TRIGER - Desktop / Tablet / Mobile */}
                <button
                  id="profile-dropdown-trigger"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-10 h-10 rounded-full bg-[#E94560] border-2 border-[#0F3460] hover:border-white transition-all flex items-center justify-center font-extrabold text-white text-sm shadow-md cursor-pointer uppercase"
                >
                  {currentUser.name.charAt(0)}
                </button>

                {/* THE UNIFIED DROPDOWN PANEL */}
                {profileOpen && (
                  <div 
                    id="profile-dropdown-panel" 
                    className="absolute right-0 top-12 w-80 bg-white border border-slate-200 text-[#1A1A2E] rounded-3xl p-5 shadow-2xl z-55 space-y-4 animate-[zoomIn_0.15s_ease] text-left"
                  >
                    
                    {/* Header Details */}
                    <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white text-base font-extrabold uppercase">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5 max-w-[170px] truncate">
                        <h4 className="font-heading font-extrabold text-sm text-[#1A1A2E] truncate">{currentUser.name}</h4>
                        <p className="text-[10px] text-slate-400 font-sans truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    {/* EDIT PROFILE OR DETAILS DISPLAY */}
                    {!editMode ? (
                      <div className="space-y-3.5">
                        <div className="space-y-2">
                          <span className="text-[9px] font-extrabold text-[#0F3460] uppercase tracking-wider block">Profile Information</span>
                          
                          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-450 text-[10.5px]">Authorised Role:</span>
                              <span className="font-extrabold text-[9.5px] uppercase tracking-wider px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-full">
                                {currentUser.role}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-450 text-[10.5px]">Telephone Code:</span>
                              <span className="font-semibold text-slate-600 truncate">{currentUser.phone || '+234800055555'}</span>
                            </div>
                          </div>
                        </div>

                        {/* MY PURCHASES SECTION (AS REQUESTED) */}
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <span className="text-[9px] font-extrabold text-[#0F3460] uppercase tracking-wider block font-sans">My Purchases</span>
                          {purchasedOrders.length === 0 ? (
                            <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                              <p className="text-[10px] text-slate-400 font-semibold font-sans">No purchases found in database.</p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {purchasedOrders.map((order) => (
                                <button
                                  key={order.id}
                                  type="button"
                                  onClick={() => {
                                    setProfileOpen(false);
                                    if (onViewPurchase) onViewPurchase(order);
                                  }}
                                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl flex items-center justify-between text-[11px] font-sans group transition-all cursor-pointer"
                                >
                                  <div className="truncate max-w-[190px]">
                                    <p className="font-semibold text-slate-800 truncate group-hover:text-[#0f3460]">{order.productTitle}</p>
                                    <p className="text-[9px] text-slate-400 font-mono truncate">Ref: {order.id}</p>
                                  </div>
                                  <span className="shrink-0 text-[10px] text-[#E94560] font-bold font-mono">View →</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Dropdown Utilities list */}
                        <div className="space-y-2 pt-1">
                          <button
                            onClick={() => setEditMode(true)}
                            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-[#1A1A2E] text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#0F3460]" />
                            Edit Profile Details
                          </button>

                          <div className="flex gap-2">
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => {
                                  onGoToAdmin();
                                  setProfileOpen(false);
                                }}
                                className="flex-1 py-2 bg-[#1A1A2E] hover:bg-[#111122] text-white text-xs font-bold rounded-lg transition text-center"
                              >
                                Admin Panel
                              </button>
                            )}
                            {onGoToWallet && (
                              <button
                                onClick={() => {
                                  onGoToWallet();
                                  setProfileOpen(false);
                                }}
                                className="flex-1 py-2 bg-emerald-70 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition text-center"
                              >
                                Wallet
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              onLogout();
                            }}
                            className="w-full py-2.5 bg-rose-55 border border-rose-220 hover:bg-rose-100 text-rose-700 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out Account
                          </button>
                        </div>
                      </div>
                    ) : (
                      // EDIT MODE COMPONENT CARD
                      <form onSubmit={handleSaveProfile} className="space-y-3.5">
                        <span className="text-[9px] font-extrabold text-[#E94560] uppercase tracking-wider block">Modify Coordinates</span>
                        
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-450 uppercase block">Preferred Full Name</label>
                            <input
                              type="text"
                              required
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-450 uppercase block">Phone Coordinate</label>
                            <input
                              type="text"
                              required
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-1.5 bg-emerald-75 hover:bg-emerald-65 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 min-h-[32px]"
                          >
                            {isSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                )}
              </>
            ) : (
              // Guest Action Trigger buttons
              <div className="flex items-center space-x-2">
                <button
                  id="nav-btn-login-header"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#FAFAFC] hover:text-white transition cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="nav-btn-register-header"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-1.5 text-xs font-extrabold bg-[#0F3460] hover:bg-[#16213E] text-white rounded-xl transition shadow-md cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
