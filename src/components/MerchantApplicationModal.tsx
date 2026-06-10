import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { User, Merchant } from '../types';
import { db } from '../data';

interface MerchantApplicationModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSubmitSuccess: (appName: string) => void;
  onOpenAuth: () => void;
}

export default function MerchantApplicationModal({
  currentUser,
  onClose,
  onSubmitSuccess,
  onOpenAuth
}: MerchantApplicationModalProps) {
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [otherType, setOtherType] = useState('');
  const [error, setError] = useState('');

  const assetOptions = [
    'Streaming Accounts',
    'Software Licenses',
    'Gaming Accounts',
    'Email Accounts'
  ];

  const handleToggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be signed in to submit a merchant application.');
      return;
    }

    if (!fullName || !email || !phone || !storeName || !storeDescription) {
      setError('Please fill out all required fields.');
      return;
    }

    const typesToSave = [...selectedTypes];
    if (otherType.trim()) {
      typesToSave.push(`Other: ${otherType.trim()}`);
    }

    if (typesToSave.length === 0) {
      setError('Please select at least one digital asset type.');
      return;
    }

    // Check if there is already an application from this user email
    const existing = db.getMerchants().find(m => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (existing.status === 'pending') {
        setError('You already have a pending merchant application under review! Please wait for admin approval.');
        return;
      }
      if (existing.status === 'approved') {
        setError('You are already an approved merchant! Please head to your marketplace dashboard.');
        return;
      }
    }

    const newApplication: Merchant = {
      id: `merch-${Date.now()}`,
      userId: currentUser.id,
      fullName,
      email,
      phone,
      storeName,
      storeDescription,
      typesOfAssets: typesToSave,
      status: 'pending',
      totalAssets: 0,
      totalSales: 0,
      totalRevenue: 0,
      appliedAt: new Date().toISOString()
    };

    db.addMerchant(newApplication);

    // Also update current local storage user profile role indicator
    const users = db.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, role: 'merchant' as const, isApprovedMerchant: false };
      }
      return u;
    });
    db.saveUsers(updatedUsers);

    // Update session active user to match
    const activeUser = { ...currentUser, role: 'merchant' as const, isApprovedMerchant: false };
    localStorage.setItem('pm_active_user', JSON.stringify(activeUser));

    onSubmitSuccess(storeName);
  };

  return (
    <div id="merchant-application-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        id="merchant-application-modal" 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#1A1A2E] text-white border-b border-[#0F3460]/20 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg tracking-tight">Become a Purelogs Merchant</h3>
            <p className="text-xs text-slate-300 mt-1">Start selling streaming, productivity, and gaming accounts securely.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {!currentUser ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-sm text-[#4A4A6A] leading-relaxed">
                You must sign up or log in to a customer account first to become a digital merchant.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-6 py-2.5 bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-xs rounded-full shadow transition cursor-pointer"
              >
                Sign In / Sign Up Now
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A2E] bg-white mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[42px]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A2E] bg-white mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled
                    value={email}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-100 border border-[#E0E0E0] rounded-lg text-slate-500 opacity-80 min-h-[42px]"
                  />
                </div>

                {/* Phone */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1A1A2E] bg-white mb-1.5 uppercase tracking-wider">
                    Phone Number (Naira Payments Enabled) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234 801 234 5678"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[42px]"
                  />
                </div>

                {/* Store Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1A1A2E] bg-white mb-1.5 uppercase tracking-wider">
                    Store / Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. John's Premium Store"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[42px]"
                  />
                </div>

                {/* Store Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1A1A2E] bg-white mb-1.5 uppercase tracking-wider">
                    Store Description & Background <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Tell us what you plan to list and your experience selling premium keys..."
                    className="w-full text-xs p-3 bg-slate-50 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                  />
                </div>
              </div>

              {/* Types of assets checkboxes */}
              <div className="space-y-2 border-t pt-3.5">
                <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider mb-2">
                  What type of digital assets will you sell? <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {assetOptions.map(option => {
                    const isChecked = selectedTypes.includes(option);
                    return (
                      <label 
                        key={option} 
                        className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition select-none ${
                          isChecked ? 'border-[#0F3460] bg-slate-50/50 text-[#0F3460]' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => handleToggleType(option)}
                        />
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          isChecked ? 'bg-[#0F3460] border-transparent' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                        </div>
                        <span className="text-[11.5px] font-medium">{option}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Other Input */}
                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Other / Custom Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={otherType}
                    onChange={(e) => setOtherType(e.target.value)}
                    placeholder="e.g. Presets, Subtitle access, etc."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[42px]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-full font-semibold text-xs cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-xs rounded-full shadow-md transition cursor-pointer min-h-[40px]"
                >
                  Submit Application
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
