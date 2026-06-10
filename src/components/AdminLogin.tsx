import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, AlertCircle, ArrowLeft, RefreshCw, HelpCircle, Cpu } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (adminData: any, token: string) => void;
  onNavigate: (path: string) => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigate }: AdminLoginProps) {
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Forgot Password feature state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [simulatedLink, setSimulatedLink] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Password reset implementation state
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Extract token from query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetTokenFromUrl(token);
    }
  }, []);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email and password are required');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (jsonErr) {
          data = { message: 'Unexpected non-JSON response from server' };
        }
      } else {
        // GitHub Pages or Vercel Static fallback check
        if (email.trim().toLowerCase() === 'admin@purelogsmartketaplace.com' && password === 'Admin@123') {
          console.warn('Backend is offline/static. Bypassing login in Offline Sandbox Mode.');
          const payload = {
            id: 'mock-admin',
            email: 'admin@purelogsmartketaplace.com',
            name: 'Lead Site Administrator',
            role: 'admin',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
          };
          const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + window.btoa(JSON.stringify(payload)) + '.dummy-signature';
          onLoginSuccess(payload, dummyToken);
          setLoading(false);
          return;
        }
        data = { message: 'The backend verification server could not be reached (offline or static host).' };
      }

      if (response.ok) {
        // Feed authentication data upwards
        onLoginSuccess(data.admin, data.token);
      } else {
        setErrorMsg(data.message || 'Invalid email or password');
      }
    } catch (err) {
      if (email.trim().toLowerCase() === 'admin@purelogsmartketaplace.com' && password === 'Admin@123') {
        console.warn('Backend unreachable. Bypassing login in Offline Sandbox Mode.');
        const payload = {
          id: 'mock-admin',
          email: 'admin@purelogsmartketaplace.com',
          name: 'Lead Site Administrator',
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        };
        const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + window.btoa(JSON.stringify(payload)) + '.dummy-signature';
        onLoginSuccess(payload, dummyToken);
        setLoading(false);
        return;
      }
      setErrorMsg('Login failed. Connection refused or ad-blocker interfered.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your administrator email address');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setSimulatedLink('');
    setResetSuccessMessage('');

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch {
          data = { message: 'Invalid response from server' };
        }
      } else {
        data = { message: 'The backend verification server is offline.' };
      }

      if (response.ok) {
        setResetSuccessMessage(`Password reset simulation triggered! A reset token was generated. This link is active for 1 hour.`);
        setSimulatedLink(data.resetLink);
      } else {
        setForgotError(data.message || 'We could not locate that admin account.');
      }
    } catch (err) {
      setForgotError('Action failed. Server error or network connection refused.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Confirm Reset Password handler
  const handleConfirmResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setResetError('Both password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    // Requirements validation
    const hasEightChars = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasEightChars || !hasUppercase || !hasNumber || !hasSpecial) {
      setResetError('Complexity required: At least 8 characters, 1 uppercase, 1 number, and 1 special character.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const response = await fetch('/api/admin/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenFromUrl, newPassword })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch {
          data = { message: 'Invalid response formats' };
        }
      } else {
        data = { message: 'The backend verification server is offline.' };
      }

      if (response.ok) {
        alert('Password has been successfully changed! Returning to admin login screen.');
        // Clear token from URL bar cleanly
        window.history.replaceState({}, document.title, window.location.pathname);
        setResetTokenFromUrl(null);
        setForgotMode(false);
        setPassword('');
        setErrorMsg('');
      } else {
        setResetError(data.message || 'Token is invalid or has expired.');
      }
    } catch (err) {
      setResetError('Could not connect to authentication services.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-4 bg-[#1A1A2E]" id="admin-login-layout">
      
      {/* Back home indicator */}
      <button 
        onClick={() => onNavigate('/')} 
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition duration-200 cursor-pointer"
        id="btn-admin-login-back-home"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Pablologsmartketaplace
      </button>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-700 shadow-xl overflow-hidden p-8 animate-[fadeIn_0.3s_ease]" id="admin-login-card">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 mb-8 select-none" id="admin-login-branding">
          <div className="inline-flex items-center justify-center p-3 bg-slate-50 border rounded-2xl text-[#0F3460] shadow-inner mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#1A1A2E]">🔐 ADMIN LOCKS PORTAL</h2>
          <p className="text-xs text-slate-400 font-medium">Purelogs Digital Assets Escrow Systems</p>
        </div>

        {/* ERROR SUMMARY */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-150 rounded-xl p-3.5 flex gap-2.5 text-xs text-rose-950 mb-6 animate-[shake_0.4s_ease-in-out]" id="admin-login-error">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* FORMS */}
        {resetTokenFromUrl ? (
          /* Password reset claim screen */
          <form onSubmit={handleConfirmResetSubmit} className="space-y-4" id="form-admin-reset-confirm">
            <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-xl text-[11px] leading-relaxed mb-4">
              🛡️ <b>Reset Active Session:</b> Enter a strong new password meeting security directives below to secure your admin role.
            </div>

            {resetError && (
              <div className="bg-rose-50 border border-rose-150 rounded-lg p-3 text-xs text-rose-950 flex gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{resetError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                id="reset-new-password"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                id="reset-confirm-password"
              />
            </div>

            <div className="bg-slate-50 border p-3 rounded-lg space-y-1 text-[11px] text-slate-500 select-none">
              <span className="font-bold text-slate-700 block mb-1">Password Requirements:</span>
              <div className="flex items-center gap-1.5">
                <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                <span>At least 1 uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                <span>At least 1 number</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-slate-300'}>✓</span>
                <span>At least 1 special character (!@#$%^&*)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full min-h-[44px] bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-sm py-2.5 rounded-lg border-none shadow transition cursor-pointer flex items-center justify-center gap-2"
              id="btn-submit-reset-confirm"
            >
              {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'UPDATE PASSWORD'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                setResetTokenFromUrl(null);
                setForgotMode(false);
              }}
              className="w-full text-center text-xs text-slate-400 font-bold hover:text-[#0F3460] py-1 transition"
            >
              Cancel reset and sign in
            </button>
          </form>
        ) : forgotMode ? (
          /* Forgot Password form */
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" id="form-forgot-password">
            <p className="text-xs text-slate-500 leading-relaxed text-center mb-4">
              Enter your administrator email. If verified in our backend, a sandbox recovery link will bypass SMTP and be printed here.
            </p>

            {forgotError && (
              <div className="bg-rose-50 border border-rose-150 rounded-lg p-3 text-xs text-rose-950 flex gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{forgotError}</span>
              </div>
            )}

            {resetSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 space-y-3 font-medium text-xs text-emerald-950">
                <div className="font-bold flex items-center gap-1">{resetSuccessMessage}</div>
                
                {simulatedLink && (
                  <div className="bg-white border rounded p-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Copy Simulated Reset Link</span>
                    <a
                      href={simulatedLink}
                      onClick={(e) => {
                        e.preventDefault();
                        const token = new URLSearchParams(simulatedLink.split('?')[1]).get('token');
                        if (token) setResetTokenFromUrl(token);
                      }}
                      className="text-[#0F3460] hover:underline font-mono text-[11px] font-bold break-all block py-1 border-b border-dashed"
                    >
                      {window.location.origin}{simulatedLink}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + simulatedLink);
                        alert('Simulated reset link copied! Open it, or click it above to proceed.');
                      }}
                      className="bg-emerald-150 hover:bg-emerald-250 text-[#0F3460] text-[10px] font-extrabold px-2.5 py-1 rounded transition select-none cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Admin Email Address</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="admin@purelogsmartketaplace.com"
                className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                id="forgot-admin-email"
              />
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full min-h-[44px] bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-sm py-2.5 rounded-lg border-none shadow transition cursor-pointer flex items-center justify-center gap-2"
              id="btn-submit-forgot"
            >
              {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'GENERATE RESET LINK'}
            </button>

            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setForgotError('');
                setResetSuccessMessage('');
                setSimulatedLink('');
              }}
              className="w-full text-center text-xs text-slate-400 font-bold hover:text-[#0F3460] py-1 transition"
            >
              Back to sign-in lockscreen
            </button>
          </form>
        ) : (
          /* Normal admin login form */
          <form onSubmit={handleLoginSubmit} className="space-y-5" id="form-admin-signin">
            
            {/* Username/Email Input */}
            <div className="space-y-1">
              <label htmlFor="admin-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@purelogsmartketaplace.com"
                className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
              />
            </div>

            {/* Password input with show/hide eye */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="admin-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-[11px] font-bold text-slate-400 hover:text-[#0F3460] transition"
                  id="link-admin-forgot-pw"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAFAFC] border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-[#0F3460] text-[#1A1A2E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer select-none"
                  id="btn-admin-login-password-eye"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Form actions and Checkboxes */}
            <div className="flex items-center justify-between text-xs py-1 select-none" id="actions-panel">
              <label className="flex items-center gap-2 font-semibold text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="rounded border-slate-300 text-[#0F3460] focus:ring-[#0F3460]"
                />
                Show Password
              </label>
            </div>

            {/* Trigger actions */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-sm py-2.5 rounded-lg border-none shadow transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Admin Sec...
                </>
              ) : (
                'SECURE SIGN IN'
              )}
            </button>

          </form>
        )}

      </div>
      
      {/* Sandbox Seeding Helper Strip */}
      <div className="mt-6 p-4 rounded-xl max-w-sm bg-white/5 border border-white/15 text-[11px] text-slate-400 space-y-1.5 select-none" id="sandbox-cheat-sheet">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Cpu className="w-4 h-4 text-[#0F3460]" />
          <span>Quick Seeding Cheat Sheet</span>
        </div>
        <p>Default login for fast review:</p>
        <div className="font-mono bg-black/30 p-2 rounded border border-white/5 text-slate-300 space-y-0.5 select-all">
          <div><b className="text-[#E94560]">Email:</b> admin@purelogsmartketaplace.com</div>
          <div><b className="text-[#E94560]">Password:</b> Admin@123</div>
        </div>
      </div>

    </div>
  );
}
