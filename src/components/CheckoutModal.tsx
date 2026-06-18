import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Mail, CheckCircle, AlertCircle, Shield, ArrowRight, RefreshCw, Wallet, PlusCircle } from 'lucide-react';
import { ProductListing, User, Order } from '../types';
import { db, formatNaira } from '../data';
import { decryptCredentials } from '../utils/crypto';

interface CheckoutModalProps {
  product: ProductListing;
  currentUser: User | null;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
  onOpenFunding: () => void;
}

export default function CheckoutModal({ 
  product, 
  currentUser, 
  onClose, 
  onPaymentSuccess,
  onOpenFunding
}: CheckoutModalProps) {
  // Direct Inputs
  const [buyerEmail, setBuyerEmail] = useState(currentUser?.email || '');
  const [buyerPhone, setBuyerPhone] = useState('+2348000055555');

  // Wallet verification states
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // View States
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [errorMsg, setErrorMsg] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch Wallet Balance on mount
  useEffect(() => {
    if (currentUser) {
      setLoadingWallet(true);
      fetch(`/api/wallet?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setWalletBalance(data.wallet.balance);
          } else {
            setErrorMsg('Failed to fetch secure wallet balance detail.');
          }
        })
        .catch(err => {
          console.error('[Checkout Wallet Load Error]', err);
          setErrorMsg('Failed to check backend wallet server balances.');
        })
        .finally(() => setLoadingWallet(false));
    } else {
      setLoadingWallet(false);
    }
  }, [currentUser]);

  // Callback to finalize database and credentials decrypt upon payment verification
  const handleCompleteEscrowPayment = () => {
    setStep('processing');

    setTimeout(() => {
      // 1. Fetch catalog listing and search for credentials
      const listings = db.getProducts();
      const targetProduct = listings.find(p => p.id === product.id);
      
      let releasedCoordinates = 'No account details found under selected product tier.';

      if (targetProduct && targetProduct.credentials && targetProduct.credentials.length > 0) {
        // Find next available unsold credentials
        const nextIdx = targetProduct.credentials.findIndex(c => !c.isSold);
        if (nextIdx !== -1) {
          const matchedEntry = targetProduct.credentials[nextIdx];
          
          // Decrypt values
          const rawEmail = decryptCredentials(matchedEntry.email || '');
          const rawPass = decryptCredentials(matchedEntry.password || '');
          const rawText = decryptCredentials(matchedEntry.rawText || '');

          if (rawEmail && rawPass) {
            releasedCoordinates = `Account Credentials - Username/Email: ${rawEmail} | Access Password: ${rawPass}`;
          } else if (rawText) {
            releasedCoordinates = rawText;
          }

          // Flag this entry as sold
          matchedEntry.isSold = true;

          // Adjust listing stock to fit unsold remaining items
          targetProduct.stock = Math.max(0, targetProduct.credentials.filter(c => !c.isSold).length);
          
          // Write back updates
          db.updateProduct(targetProduct);
        } else {
          // If out of credentials array, fallback decrement stock of legacy
          targetProduct.stock = Math.max(0, targetProduct.stock - 1);
          db.updateProduct(targetProduct);
        }
      } else {
        // Fallback for seed items
        const updatedListings = db.getProducts().map(item => {
          if (item.id === product.id) {
            return { ...item, stock: Math.max(0, item.stock - 1) };
          }
          return item;
        });
        db.saveProducts(updatedListings);
      }

      // 2. Generate new buyer Order log
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        buyerEmail: buyerEmail.toLowerCase(),
        buyerName: currentUser?.name || 'Verified Buyer',
        buyerPhone: buyerPhone || '+2348000000000',
        productId: product.id,
        productTitle: product.title,
        productPlatform: product.platform,
        amount: product.price,
        status: 'delivered', // Instantly unlocked
        paymentGateway: 'paystack',
        credentialsShared: releasedCoordinates,
        createdAt: new Date().toISOString()
      };

      // Add to Database (local & Supabase synchronously)
      db.addOrder(newOrder);

      // Save permanently to Server Database
      if (currentUser?.email) {
        fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: newOrder.id,
            userEmail: currentUser.email,
            productId: product.id,
            productTitle: product.title,
            amountPaid: product.price,
            transactionReference: newOrder.id,
            credentialsShared: releasedCoordinates
          })
        })
        .then(res => res.json())
        .then(d => console.log('[Server Purchase Logged]', d))
        .catch(e => console.error('[Server Purchase Error]', e));
      }

      setCreatedOrder(newOrder);
      setStep('success');
    }, 1800);
  };

  // Perform backend Wallet Debit & Order Placement
  const handlePayViaWallet = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setErrorMsg('');
    setIsInitializing(true);

    if (!buyerEmail || !buyerEmail.includes('@')) {
      setErrorMsg('Please specify a valid delivery email.');
      setIsInitializing(false);
      return;
    }

    try {
      // Direct debit call to backend walletDb
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          productId: product.id,
          productPrice: product.price,
          productTitle: product.title
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Complete escrow fulfillment on success
        handleCompleteEscrowPayment();
      } else {
        setErrorMsg(data.message || 'Purchase process rejected.');
        setIsInitializing(false);
      }
    } catch (err: any) {
      console.error('[Wallet Debit Error]', err);
      setErrorMsg('Failed to complete wallet debit. Verify backend connectivity with local servers.');
      setIsInitializing(false);
    }
  };

  const isSufficient = walletBalance !== null && walletBalance >= product.price;

  return (
    <div id="checkout-gateway-overlay" className="fixed inset-0 bg-[#1A1A2E]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E0E0E0] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative text-left animate-[zoomIn_0.15s_ease] select-none flex flex-col justify-between">
        
        {/* Modal Upper Window */}
        <div className="flex items-center justify-between p-5 border-b border-[#E0E0E0]/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0F3460]/10 rounded-xl text-[#0F3460]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-[#1A1A2E] text-sm uppercase tracking-wider">Secure Escrow Gate</h3>
              <p className="text-[10px] text-slate-400 font-sans">Wallet Authorization Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-checkout-modal-btn"
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Base Purchase Checkout */}
        {step === 'checkout' && (
          <div id="checkout-form-container" className="p-5 space-y-4 max-y-[65vh] overflow-y-auto">
            {errorMsg && (
              <div id="checkout-error-banner" className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Asset Summary Panel */}
            <div className="bg-[#F5F5F7] border border-[#E0E0E0]/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-[#E0E0E0]/20 shrink-0">
                  <img 
                    src={product.imageUrl} 
                    alt={product.title} 
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                </div>
                <div>
                  <span className="text-[8px] bg-white text-[#0F3460] border border-[#E0E0E0]/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide inline-block mb-0.5">
                    {product.platform}
                  </span>
                  <h4 className="text-xs font-bold text-[#1A1A2E] line-clamp-1">{product.title}</h4>
                  <p className="text-[9.5px] text-[#4A4A6A] font-sans">Instant credentials release</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[8.5px] text-[#4A4A6A] uppercase tracking-widest font-extrabold block mb-0.5">Asset Rate</span>
                <span className="text-xs font-extrabold text-[#E94560]">{formatNaira(product.price)}</span>
              </div>
            </div>

            {/* WALLET BALANCE CONTAINER (LIVE CHECK) */}
            {loadingWallet ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-400 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0F3460]" />
                <span>Synchronizing user wallet balance log...</span>
              </div>
            ) : walletBalance !== null ? (
              <div className={`p-4 border rounded-2xl text-left space-y-2 ${
                isSufficient 
                  ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50/40 border-rose-100 text-rose-800'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 flex items-center gap-1.5">
                    <Wallet className="w-4.5 h-4.5 text-slate-400" />
                    Your Wallet Balance:
                  </span>
                  <span className="text-sm font-extrabold font-mono text-[#1A1A2E]">
                    {formatNaira(walletBalance)}
                  </span>
                </div>

                {isSufficient ? (
                  <div className="pt-2 border-t border-emerald-100/40 flex justify-between text-[10px] text-slate-500 font-sans">
                    <span>Balance after product acquisition:</span>
                    <span className="font-bold font-mono text-[#1A1A2E]">{formatNaira(walletBalance - product.price)}</span>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-rose-100/40 space-y-2.5">
                    <div className="flex justify-between text-[10px] font-sans text-rose-700/80">
                      <span>Insufficient Wallet Balance (Missing: <b>{formatNaira(product.price - walletBalance)}</b>)</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenFunding}
                      className="w-full py-2.5 bg-[#E94560]/10 hover:bg-[#E94560]/25 text-[#E94560] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Fund Wallet (₦{(product.price - walletBalance).toLocaleString()})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#FAFAFC] border border-[#E0E0E0] rounded-2xl text-center text-xs text-rose-500">
                Unauthenticated or error retrieving user wallet.
              </div>
            )}

            {/* Official Wallet Purchase Flow */}
            {walletBalance !== null && isSufficient && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-450 tracking-wider mb-1.5">
                    Recipient Delivery Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="delivery@email.com"
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F3460] min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="wallet-payment-trigger-btn"
                    onClick={handlePayViaWallet}
                    disabled={isInitializing}
                    className="w-full py-3 bg-[#0F3460] hover:bg-[#16213E] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer h-[44px]"
                  >
                    {isInitializing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-emerald-400" />
                        Deduct {formatNaira(product.price)} from Wallet Balance
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified encryption secures direct wallet exchange ledger handshakes.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Processing Payment */}
        {step === 'processing' && (
          <div id="checkout-processing-view" className="p-12 text-center space-y-6">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-[#0F3460] border-t-transparent animate-spin" />
            </div>

            <div className="space-y-2">
              <h4 className="font-heading font-extrabold text-sm uppercase text-[#1A1A2E] tracking-wider animate-pulse">
                Deducting Wallet Balance...
              </h4>
              <p className="text-[10.5px] text-[#4A4A6A] font-sans max-w-sm mx-auto leading-relaxed">
                Updating ledger logs, validating serial credentials allocations, and matching coordinate codes for instant delivery...
              </p>
            </div>
            
            <div className="text-[9px] font-mono bg-[#F5F5F7] border border-[#E0E0E0]/30 p-2 rounded-xl max-w-xs mx-auto text-[#4A4A6A]">
              REF: WALLET-{Math.random().toString(36).substring(3, 11).toUpperCase()}
            </div>
          </div>
        )}

        {/* Step 3: Success state with details */}
        {step === 'success' && createdOrder && (
          <div id="checkout-success-view" className="p-5 space-y-5 animate-[fadeIn_0.3s_ease] overflow-y-auto">
            
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-150">
                <CheckCircle className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#1A1A2E]">Direct Purchase Unlocked!</h4>
              <p className="text-[10.5px] text-[#4A4A6A] font-sans leading-relaxed">
                Wallet transaction cleared successfully. Credentials available below.
              </p>
            </div>

            {/* Decrypted Credentials container */}
            <div className="bg-[#1A1A2E] text-white rounded-2xl p-4 border border-white/10 relative overflow-hidden select-text text-left">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_to_right,rgba(15,52,96,0.15),transparent_40%)]" />
              
              <div className="relative z-10 space-y-2.5">
                <span className="text-[8px] bg-[#0F3460] text-emerald-300 border border-emerald-500/15 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                  DECRYPTED SECURE KEY RELEASE
                </span>
                
                <h5 className="font-bold text-xs text-white leading-tight">{createdOrder.productTitle}</h5>
                
                <div className="p-3 bg-white/10 border border-white/5 rounded-xl">
                  <p className="text-xs font-mono text-emerald-400 select-all leading-relaxed break-all font-bold">
                    {createdOrder.credentialsShared}
                  </p>
                </div>
                
                <p className="text-[9px] text-slate-400 font-sans leading-normal">
                  ⚠️ NOTICE: Copy these credentials immediately. They can also be reviewed at any time inside your "My Purchases" cabinet.
                </p>
              </div>
            </div>

            {/* Receipt invoice details */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-[#E0E0E0]/30 space-y-1.5 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-[#4A4A6A]">Order Invoice:</span>
                <span className="font-mono text-[#1A1A2E] font-semibold">{createdOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4A6A]">Delivery Account:</span>
                <span className="font-semibold text-[#1A1A2E]">{createdOrder.buyerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4A6A]">Deducted:</span>
                <span className="font-extrabold text-[#E94560]">{formatNaira(createdOrder.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4A6A]">Settlement Ledger:</span>
                <span className="font-extrabold text-[9px] uppercase text-emerald-800 bg-emerald-50 border px-1.5 rounded">Direct Wallet</span>
              </div>
            </div>

            {/* Action continue button */}
            <div className="pt-1">
              <button
                id="btn-close-success"
                onClick={() => {
                  onPaymentSuccess(createdOrder);
                  onClose();
                }}
                className="w-full py-3.5 bg-[#0F3460] hover:bg-[#16213E] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
              >
                Open Purchased product automatically
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
