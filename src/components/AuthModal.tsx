import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ToggleLeft, ShieldCheck, ArrowRight, CornerDownRight } from 'lucide-react';
import { User, UserRole } from '../types';
import { db } from '../data';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialView?: 'login' | 'signup';
}

export default function AuthModal({ onClose, onLoginSuccess, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(initialView);
  const [role, setRole] = useState<UserRole>('buyer');
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle standard submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (view === 'signup') {
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Please complete all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      
      const users = db.getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('This email address is already registered.');
        return;
      }

      // Create new user
      const isApproved = role === 'buyer' ? undefined : false; // Merchants start unapproved
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: fullName,
        email: email.toLowerCase(),
        role: role,
        isApprovedMerchant: isApproved,
        createdAt: new Date().toISOString()
      };

      db.addUser(newUser);
      setSuccess(
        role === 'merchant'
          ? 'Registration successful! Your merchant request is pending admin approval.'
          : 'Registration successful! Proceeding to log in.'
      );
      
      // Auto transition
      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 1800);

    } else {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }

      const users = db.getUsers();
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!matched) {
        setError('Email address not registered. Please sign up or try Quick Login profiles!');
        return;
      }

      // Simulation accepts any matching email password for demo simplicity, but prompts errors otherwise
      if (password.length < 5) {
        setError('Invalid password length. Must be 5+ characters.');
        return;
      }

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(matched);
        onClose();
      }, 800);
    }
  };


  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        id="auth-modal-card" 
        className="relative bg-white border border-[#E0E0E0] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8 animate-[fadeIn_0.2s_ease]"
      >
        
        {/* Banner header inside deep navy theme */}
        <div className="bg-[#1A1A2E] text-white p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_to_right,rgba(15,52,96,0.15),transparent_40%)]" />
          <button
            id="auth-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-[#0F3460]/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <span className="text-xs text-[#0F3460] font-bold tracking-widest uppercase block mb-1">
            Pablologsmarketplace
          </span>
          <h3 className="text-xl font-heading font-medium tracking-tight">
            {view === 'login' ? 'Welcome Back!' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {view === 'login' 
              ? 'Access digital escrow listings with high convenience.' 
              : 'Join the premier ecosystem for premium web memberships.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div id="auth-error-banner" className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}
          {success && (
            <div id="auth-success-banner" className="mb-4 p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded-lg font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {view === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4A4A6A]/70">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="signup-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-[#E0E0E0] text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Role Toggle Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                    Account Type (Register Role)
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      id="role-btn-buyer"
                      onClick={() => setRole('buyer')}
                      className={`py-2.5 text-xs font-semibold border rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        role === 'buyer'
                          ? 'bg-slate-50 border-[#0F3460] text-[#1A1A2E]'
                          : 'bg-white border-[#E0E0E0] text-[#4A4A6A] hover:bg-slate-50'
                      }`}
                    >
                      Buyer Acc
                    </button>
                    <button
                      type="button"
                      id="role-btn-merchant"
                      onClick={() => setRole('merchant')}
                      className={`py-2.5 text-xs font-semibold border rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
                        role === 'merchant'
                          ? 'bg-slate-50 border-[#0F3460] text-[#1A1A2E]'
                          : 'bg-white border-[#E0E0E0] text-[#4A4A6A] hover:bg-slate-50'
                      }`}
                    >
                      Merchant Acc
                      <span className="absolute -top-1.5 -right-1 px-1 bg-[#E94560] text-white font-bold rounded text-[8px] uppercase tracking-wider scale-90">Pending Auth</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4A4A6A]/70">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="auth-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@domain.com"
                  className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-[#E0E0E0] text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] min-h-[44px]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4A4A6A]/70">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="auth-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 5 characters"
                  className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-[#E0E0E0] text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] min-h-[44px]"
                />
              </div>
            </div>

            {view === 'signup' && (
              /* Confirm Password */
              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4A4A6A]/70">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="signup-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Verify secure details"
                    className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-[#E0E0E0] text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {/* Submit btn */}
            <button
              type="submit"
              id="auth-submit-btn"
              className="w-full py-3 bg-[#0F3460] hover:bg-[#16213E] text-white font-semibold text-sm rounded-full transition-all flex items-center justify-center gap-1 shadow-md min-h-[44px]"
            >
              {view === 'login' ? 'Login to Portal' : 'Register Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle View Link */}
          <div className="mt-4 text-center">
            <button
              id="toggle-auth-view-btn"
              onClick={() => {
                setError('');
                setSuccess('');
                setView(view === 'login' ? 'signup' : 'login');
              }}
              className="text-xs text-[#4A4A6A] hover:text-[#0F3460] font-medium transition cursor-pointer"
            >
              {view === 'login' 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"}
            </button>
          </div>


        </div>

      </div>
    </div>
  );
}
