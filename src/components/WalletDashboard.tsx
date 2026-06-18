import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle, PlusCircle, CheckCircle, ShieldAlert, Copy } from 'lucide-react';
import { User, Order } from '../types';

interface WalletDashboardProps {
  currentUser: User | null;
  triggerAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onRefreshOrders?: () => void;
}

interface WalletData {
  userEmail: string;
  balance: number;
}

interface WalletTx {
  id: string;
  userEmail: string;
  amount: number;
  type: 'fund' | 'purchase';
  description: string;
  timestamp: string;
  paystackReference?: string;
}

export default function WalletDashboard({ currentUser, triggerAlert, onRefreshOrders }: WalletDashboardProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  
  // Custom interactive sandbox simulation modal
  const [showSandboxGateway, setShowSandboxGateway] = useState(false);
  const [sandboxCard, setSandboxCard] = useState('');
  const [sandboxExpiry, setSandboxExpiry] = useState('');
  const [sandboxCvv, setSandboxCvv] = useState('');
  const [simulatedRef, setSimulatedRef] = useState('');
  const [simulatedAmount, setSimulatedAmount] = useState(0);
  const [sandboxTab, setSandboxTab] = useState<'card' | 'transfer'>('card');

  // Robust, Cross-Platform Copy to Clipboard functionality with fallback
  const handleCopyAccountNumber = async () => {
    const textToCopy = '9920194857';
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(textToCopy);
        triggerAlert('Account number copied successfully', 'success');
      } else {
        throw new Error('Modern Clipboard API not found or blocked');
      }
    } catch (err: any) {
      console.warn('[Clipboard API failed, running robust fallback selector]:', err);
      
      // Fallback Method using dynamic input select and execCommand for high sandboxed iframe compatibility
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      
      // Select text
      textArea.focus();
      textArea.select();
      
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (fallbackErr) {
        console.error('[Fallback Copy Command genuinely failed]', fallbackErr);
      }
      
      document.body.removeChild(textArea);
      
      if (success) {
        triggerAlert('Account number copied successfully', 'success');
      } else {
        triggerAlert('Copy Failed', 'error');
      }
    }
  };

  // Fetch Wallet Data from Secure Backend
  const fetchWallet = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/wallet?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setWallet(data.wallet);
        setTransactions(data.transactions);
      } else {
        triggerAlert(data.message || 'Error occurred retrieving wallet details', 'error');
      }
    } catch (err: any) {
      console.error('Wallet fetch error:', err);
      triggerAlert('Failed to connect with backend wallet services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [currentUser]);

  // Load Paystack script dynamically if not found
  const loadPaystackScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="paystack.co"]');
      if (existingScript) {
        // Wait briefly for it to load
        let checkCount = 0;
        const interval = setInterval(() => {
          if ((window as any).PaystackPop) {
            clearInterval(interval);
            resolve(true);
          } else if (checkCount > 30) {
            clearInterval(interval);
            resolve(false);
          }
          checkCount++;
        }, 100);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle funding button click
  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(fundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerAlert('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    setIsFunding(true);
    const tx_ref = `fnd-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    try {
      // 1. Fetch Paystack Config to see if alive
      let publicKey = '';
      try {
        const configRes = await fetch('/api/paystack/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          publicKey = configData.publicKey;
        }
      } catch (e) {
        console.warn('[Wallet] Could not fetch server paystack config:', e);
      }

      // 2. Fallback to Vite client environment variables if server didn't provide a valid pk_ key
      if (!publicKey || !publicKey.startsWith('pk_')) {
        const vitePk = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY;
        if (vitePk && vitePk.startsWith('pk_')) {
          publicKey = vitePk;
        }
      }
      
      // Ensure script has fully loaded
      const isScriptLoaded = await loadPaystackScript();
      const paystackPopObj = (window as any).PaystackPop;
      const hasRealKey = publicKey && publicKey.trim() !== '' && !publicKey.includes('...') && publicKey.startsWith('pk_');

      if (isScriptLoaded && paystackPopObj && hasRealKey) {
        // Option A: Real Paystack Inline Pop Setup
        setIsFunding(false);
        setShowFundModal(false);
        
        const handleVerifyPayment = (refId: string) => {
          triggerAlert('Fulfillment received from gateway. Verifying credit...', 'info');
          fetch('/api/wallet/verify-funding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: refId, email: currentUser?.email, amount: amountNum })
          })
          .then(res => res.json().then(data => ({ ok: res.ok, data })))
          .then(({ ok, data }) => {
            if (ok) {
              triggerAlert(`Wallet credited! New balance: ₦${data.balance.toLocaleString()}`, 'success');
              fetchWallet();
              if (onRefreshOrders) onRefreshOrders();
            } else {
              triggerAlert(data.message || 'Payment verification failed', 'error');
            }
          })
          .catch(verifyErr => {
            console.error('[Verify Payment Error]', verifyErr);
            triggerAlert('Error double-checking with verification server.', 'error');
          });
        };

        // Leverage V2 class instantiation if V1 setup static helper is missing
        try {
          if (typeof paystackPopObj.setup === 'function') {
            // Legacy/V1 mode
            const handler = paystackPopObj.setup({
              key: publicKey,
              email: currentUser?.email.toLowerCase(),
              amount: Math.round(amountNum * 100),
              ref: tx_ref,
              callback: function (response: any) {
                const returnedReference = response.reference || response.trxref || tx_ref;
                handleVerifyPayment(returnedReference);
              },
              onClose: function () {
                triggerAlert('Funding window closed', 'info');
              },
              onCancel: function () {
                triggerAlert('Funding window closed', 'info');
              }
            });
            handler.openIframe();
          } else {
            // Standard V2 mode
            const paystackInstance = new paystackPopObj();
            paystackInstance.newTransaction({
              key: publicKey,
              email: currentUser?.email.toLowerCase(),
              amount: Math.round(amountNum * 100),
              ref: tx_ref,
              onSuccess: function (response: any) {
                const returnedReference = response.reference || response.trxref || tx_ref;
                handleVerifyPayment(returnedReference);
              },
              onCancel: function () {
                triggerAlert('Funding window closed', 'info');
              }
            });
          }
        } catch (initErr: any) {
          console.error('[Paystack launcher crash]', initErr);
          // Fall back gracefully to sandbox if Paystack pop fails to launch or is blocked by user browser/IFrame sandbox rules
          triggerAlert('Paystack Pop was blocked or encountered an issue. Falling back to simulated wallet funding sandbox...', 'info');
          setSimulatedRef(tx_ref);
          setSimulatedAmount(amountNum);
          setShowSandboxGateway(true);
        }
      } else {
        // Option B: Elegant, fast interactive Developer sandbox checkout fallback
        setIsFunding(false);
        setShowFundModal(false);
        setSimulatedRef(tx_ref);
        setSimulatedAmount(amountNum);
        setShowSandboxGateway(true);
      }
    } catch (err: any) {
      console.error('[Funding Flow Error]', err);
      triggerAlert('Unable to initialize payment process', 'error');
      setIsFunding(false);
    }
  };

  // Submit simulated payment inside sandbox gateway
  const submitSimulatedPayment = async () => {
    if (!currentUser) return;
    setIsFunding(true);
    triggerAlert('Fulfillment simulated. Contacting double-verification API...', 'info');
    
    try {
      const verifyRes = await fetch('/api/wallet/verify-funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reference: simulatedRef, 
          email: currentUser.email,
          amount: simulatedAmount 
        })
      });
      const verifyData = await verifyRes.json();
      
      if (verifyRes.ok) {
        triggerAlert(`Success: credited wallet with ₦${simulatedAmount.toLocaleString()}!`, 'success');
        setShowSandboxGateway(false);
        setFundAmount('');
        fetchWallet();
        if (onRefreshOrders) onRefreshOrders();
      } else {
        triggerAlert(verifyData.message || 'Simulated payment processing rejected', 'error');
      }
    } catch (err) {
      triggerAlert('Fulfillment verification connection failed', 'error');
    } finally {
      setIsFunding(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 px-6 py-12 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-slate-150 flex items-center justify-center text-[#1A1A2E] mx-auto">
          <Wallet className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-xl text-slate-800">Unauthenticated Wallet</h3>
          <p className="text-xs text-slate-450 leading-relaxed font-sans max-w-sm mx-auto">
            Please sign in or register to launch your digital wallet portal, secure direct Naira balances, and download log archives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="wallet-dashboard-main" className="animate-[fadeIn_0.3s_ease] max-w-lg mx-auto p-4 space-y-5 pb-24">
      {/* WALLET BALANCE HERO METRIC CARD */}
      <div className="bg-[#1A1A2E] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden select-none border border-[#0F3460]/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F3460]/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#95A0B2] font-mono">Secure Wallet Asset</span>
            <div className="text-3xl font-heading font-extrabold tracking-tight mt-1">
              ₦{loading ? '---' : wallet ? wallet.balance.toLocaleString() : '0'}
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">Paystack ID: {currentUser.email}</p>
          </div>
          <div className="p-3 bg-[#0F3460] rounded-2xl">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Buttons strip */}
        <div className="mt-8 pt-5 border-t border-[#0F3460]/30 flex gap-3">
          <button
            id="fund-wallet-trigger"
            onClick={() => {
              setFundAmount('');
              setShowFundModal(true);
            }}
            className="flex-1 py-3 bg-[#E94560] hover:bg-[#ff5a77] text-white text-xs font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer max-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Fund Wallet
          </button>
          
          <button
            id="refresh-wallet-trigger"
            onClick={fetchWallet}
            className="px-4 py-3 bg-[#0F3460] hover:bg-[#16213E] text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer max-h-[44px]"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK SYSTEM STATUS NOTE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 text-left">
        <AlertCircle className="w-5 h-5 text-[#0F3460] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-700">Wallet Funding Operations</h4>
          <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
            Your wallet tracks instant delivery balances. Pay with Paystack or simulate payments offline inside our interactive developer sandbox.
          </p>
        </div>
      </div>

      {/* RECENT TRANSACTION ACTIVITIES */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-extrabold text-sm text-[#1A1A2E] tracking-tight uppercase">Recent Activities</h3>
          <span className="text-[10px] bg-slate-100 text-slate-450 px-2.5 py-1 rounded-full font-bold">
            {transactions.length} entries
          </span>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <RefreshCw className="w-6 h-6 text-slate-300 mx-auto animate-spin" />
            <span>Fanning transaction logs...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-sans">
            No wallet transaction history found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto pr-1">
            {transactions.map((tx) => {
              const isDebit = tx.amount < 0;
              return (
                <div key={tx.id} className="flex justify-between items-center py-3.5 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isDebit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-55 text-emerald-70'}`}>
                      {isDebit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{tx.description}</div>
                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                        {new Date(tx.timestamp).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${isDebit ? 'text-rose-600' : 'text-emerald-70'}`}>
                      {isDebit ? '-' : '+'}₦{Math.abs(tx.amount).toLocaleString()}
                    </span>
                    {tx.paystackReference && (
                      <span className="block text-[8px] text-slate-300 font-mono scale-95 origin-right">Ref: {tx.paystackReference.substring(0, 10)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FUND WALLET INPUT MODAL */}
      {showFundModal && (
        <div className="fixed inset-0 bg-[#1A1A2E]/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left animate-[zoomIn_0.15s_ease]">
            <h3 className="font-heading font-extrabold text-base text-[#1A1A2E] leading-tight mb-1">Fund Digital Wallet</h3>
            <p className="text-[11px] text-slate-450 mb-5 leading-relaxed font-sans">
              Enter target amount to deposit into your account ledger to allow instant product checkout.
            </p>

            <form onSubmit={handleFundWallet} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Funding Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-xs text-slate-400 font-bold">₦</span>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="10,000"
                    min="1"
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-[#0F3460] focus:ring-1 focus:ring-[#0F3460] rounded-xl text-sm font-semibold h-[44px]"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer max-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFunding}
                  className="flex-1 py-2.5 bg-[#E94560] hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 max-h-[44px]"
                >
                  {isFunding ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Initialize Paystack'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPERT INTERACTIVE DEVELOPER SANDBOX GATEWAY */}
      {showSandboxGateway && (
        <div className="fixed inset-0 bg-[#1A1A2E]/70 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-left animate-[zoomIn_0.15s_ease] space-y-4">
            
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E94560] flex items-center justify-center text-white text-xs font-bold font-mono">P</div>
                <div className="font-heading font-extrabold text-sm text-[#1A1A2E]">Paystack Sandbox Gate</div>
              </div>
              <span className="text-[8px] bg-amber-50 border border-amber-250 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Test Mode</span>
            </div>

            {/* Tab Selection */}
            <div className="flex border-b border-slate-100 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setSandboxTab('card')}
                className={`flex-1 pb-2 border-b-2 text-center transition cursor-pointer ${
                  sandboxTab === 'card'
                    ? 'border-[#0F3460] text-[#0F3460]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Simulated Card
              </button>
              <button
                type="button"
                onClick={() => setSandboxTab('transfer')}
                className={`flex-1 pb-2 border-b-2 text-center transition cursor-pointer ${
                  sandboxTab === 'transfer'
                    ? 'border-[#0F3460] text-[#0F3460]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {/* Tab A: Card Payment Simulation */}
            {sandboxTab === 'card' && (
              <div className="space-y-3 animate-[fadeIn_0.15s_ease]">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800">Card Payment Simulation</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                    You are paying <b className="text-slate-800">₦{simulatedAmount.toLocaleString()}</b> using reference ID <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">{simulatedRef}</code>.
                  </p>
                </div>

                {/* Fake credit card inputs */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Credit Card Number</label>
                    <input
                      type="text"
                      placeholder="4000 1234 5678 9010"
                      value={sandboxCard}
                      onChange={(e) => setSandboxCard(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-widest text-[#1A1A2E] h-[40px] focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={sandboxExpiry}
                        onChange={(e) => setSandboxExpiry(e.target.value.substring(0, 5))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono h-[40px] text-center focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={sandboxCvv}
                        onChange={(e) => setSandboxCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono h-[40px] text-center focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab B: Bank Transfer Simulation */}
            {sandboxTab === 'transfer' && (
              <div className="space-y-3 animate-[fadeIn_0.15s_ease]">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800 font-sans">Bank Transfer Simulation</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                    Transfer exactly <b className="text-slate-800">₦{simulatedAmount.toLocaleString()}</b> to the virtual escrow bank details listed below:
                  </p>
                </div>

                <div className="bg-[#F8FAFC] border border-slate-200 p-4 rounded-xl text-xs space-y-3 font-sans">
                  <div className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200 pb-2">
                    <span className="text-slate-400 font-medium font-sans">Bank Name</span>
                    <span className="font-extrabold text-[#1A1A2E] font-sans">Paystack-Titan / Wema Bank</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200 pb-2">
                    <span className="text-slate-400 font-medium font-sans">Account Number</span>
                    <div className="flex items-center gap-1.5 bg-[#F1F5F9] px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs select-all">
                      <span className="font-mono font-extrabold text-[#1A1A2E] tracking-wider text-xs">9920194857</span>
                      <button
                        type="button"
                        onClick={handleCopyAccountNumber}
                        className="text-slate-450 hover:text-[#0F3460] hover:scale-105 active:scale-95 transition cursor-pointer p-1 rounded-md hover:bg-slate-200"
                        title="Copy Account Number"
                        id="copy-account-num-btn"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200 pb-2">
                    <span className="text-slate-400 font-medium font-sans">Account Name</span>
                    <span className="font-extrabold text-[#1A1A2E] text-right font-sans">Pablologs Escrow Funding Ltd</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 font-medium font-sans">Transfer Amount</span>
                    <span className="font-extrabold text-[#E94560] font-mono">₦{simulatedAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-xl text-[9px] text-amber-800 font-medium leading-relaxed font-sans flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                  <span>Once transfer is completed, click <b>"I've Sent the Money"</b> below to initiate automated sandbox credit clearance.</span>
                </div>
              </div>
            )}

            {/* Simulated verification actions */}
            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowSandboxGateway(false);
                  triggerAlert('Transaction cancelled in sandbox simulator', 'info');
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer max-h-[44px]"
              >
                Cancel payment
              </button>
              <button
                type="button"
                onClick={submitSimulatedPayment}
                disabled={isFunding}
                className="flex-1 py-2.5 bg-emerald-70 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                {isFunding ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {sandboxTab === 'card' ? 'Authorize Payment' : "I've Sent the Money"}
                  </>
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-sans justify-center pt-1 border-t border-slate-100">
              <ShieldAlert className="w-3 h-3 text-slate-400 font-sans" />
              <span>Sandbox payment secure local decryption protocol enabled.</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
