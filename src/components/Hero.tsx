import React, { useState } from 'react';
import { ShoppingBag, Play, X, ShieldCheck, Zap, Users } from 'lucide-react';
// @ts-ignore
import heroBg from '../assets/images/hero_cover_bg.jpg';

interface HeroProps {
  onExplore: () => void;
  onOpenAuth: (view: 'login' | 'signup') => void;
}

export default function Hero({ onExplore, onOpenAuth }: HeroProps) {
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  return (
    <section 
      id="home" 
      className="relative overflow-hidden py-20 sm:py-28 lg:py-36 border-b border-slate-800 bg-[center_30%] sm:bg-center bg-cover bg-no-repeat min-h-[75vh] sm:min-h-[80vh] flex items-center justify-center text-white"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      {/* Dark premium overlay for text readability */}
      <div className="absolute inset-0 bg-[#0c0c17]/75 sm:bg-[#0c0c17]/65 backdrop-blur-[1px] z-1" />
      
      {/* Visual decorative glowing gradients. High elegance layout. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(15,52,96,0.3),transparent_50%)] z-2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(233,69,96,0.15),transparent_50%)] z-2" />
      
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] z-2" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Tagline Accent Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 sm:mb-8 text-xs text-[#E94560] font-semibold tracking-wide shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#E94560] animate-pulse" />
          Secure Escrow Service Enabled
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mx-auto drop-shadow-sm">
          Buy and Sell Premium Accounts with <span className="text-[#E94560]">Confidence</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-medium drop-shadow-sm">
          The most trusted marketplace for digital assets. Connect with verified sellers, secure transactions, and discover premium accounts across all platforms.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-btn-explore"
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-[#E94560] hover:bg-[#cf354f] text-white rounded-full transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 group shadow-xl shadow-rose-950/20 min-h-[44px] cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Explore Marketplace
          </button>
          
          <button
            id="hero-btn-demo"
            onClick={() => setShowDemoVideo(true)}
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/50 rounded-full backdrop-blur-xs transition-all duration-300 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Play className="w-4 h-4 text-white fill-white" />
            Watch Demo
          </button>
        </div>

        {/* Visual counters row - configured sleekly for dark cover */}
        <div className="mt-16 sm:mt-20 grid grid-cols-3 gap-6 pt-10 border-t border-white/10 max-w-xl mx-auto text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">15K+</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Orders Completed</div>
          </div>
          <div className="border-x border-white/10">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#E94560]">99.8%</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Secured Deliveries</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">2.4K+</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Verified Sellers</div>
          </div>
        </div>
      </div>

      {/* Demo Video Modal Container */}
      {showDemoVideo && (
        <div id="demo-video-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative bg-[#1A1A2E] border border-[#E0E0E0]/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]/20">
              <h3 className="font-heading font-semibold text-white">How Pablologsmarketplace Protects You</h3>
              <button
                id="btn-close-demo"
                onClick={() => setShowDemoVideo(false)}
                className="p-1 rounded-full hover:bg-white/10 text-[#FAFAFC] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated interactive cinematic presentation video of marketplace platform */}
            <div className="aspect-video bg-[#0B0B16] flex flex-col items-center justify-center text-center p-6 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,52,96,0.15),transparent_60%)]" />
              
              <div className="z-10 max-w-md space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-[#0F3460]/30 flex items-center justify-center mx-auto mb-4 animate-[bounce_2s_infinite]">
                  <ShieldCheck className="w-8 h-8 text-[#0F3460]" />
                </div>
                
                <h4 className="text-lg font-semibold text-white">Pablologsmarketplace Demo</h4>
                <p className="text-sm text-[#FAFAFC]">
                  Let's guide you through searching secure accounts, checkout validation via our smart Escrow gateway, and instant automated credentials drop.
                </p>

                {/* Simulated Steps timeline inside video demonstration */}
                <div className="grid grid-cols-3 gap-3 text-left pt-2 text-[11px] text-white">
                  <div className="bg-[#1A1A2E] p-2.5 rounded-lg border border-[#E0E0E0]/20">
                    <span className="text-[#E94560] font-semibold block mb-0.5">01. Search</span>
                    Filter premium memberships (Netflix, Canva, GPT).
                  </div>
                  <div className="bg-[#1A1A2E] p-2.5 rounded-lg border border-[#E0E0E0]/20">
                    <span className="text-[#0F3460] font-semibold block mb-0.5">02. Escrow</span>
                    Paystack handles financial locks securely.
                  </div>
                  <div className="bg-[#1A1A2E] p-2.5 rounded-lg border border-[#E0E0E0]/20">
                    <span className="text-[#E94560] font-semibold block mb-0.5">03. Drop</span>
                    Decrypt details inside dashboard instantly.
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    id="demo-modal-btn-get-started"
                    onClick={() => {
                      setShowDemoVideo(false);
                      onExplore();
                    }}
                    className="px-6 py-2.5 text-xs font-semibold bg-[#0F3460] text-white hover:bg-[#16213E] rounded-full transition"
                  >
                    Close Demo & Explore Marketplace
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
