import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, CheckCircle, AlertTriangle, ExternalLink, 
  HelpCircle, Sparkles, Sliders, RefreshCw, Layers, ShieldCheck, 
  Tv, Compass, Award, Heart, Check, Settings, Info
} from 'lucide-react';
import { INITIAL_LISTINGS } from '../data';

interface ImageAsset {
  key: string;
  title: string;
  category: 'local' | 'remote' | 'listing_default' | 'testimonial';
  src: string;
  usage: string;
  description: string;
  fallbackGradient: string;
  fallbackIcon: React.ReactNode;
}

export default function DeploymentAssets() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'local' | 'remote' | 'listing_default' | 'testimonial'>('all');
  const [forceFallback, setForceFallback] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, 'loading' | 'success' | 'failed'>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // List of all visual image assets used in our application
  const assetsList: ImageAsset[] = [
    {
      key: 'hero-banner',
      title: 'Hero Cover Background',
      category: 'local',
      src: '/src/assets/images/hero_cover_bg.jpg', // Local import resolved via vite relative mapping
      usage: 'Hero.tsx (Main Background)',
      description: 'The premium dark abstract backdrop that frames the top level welcoming viewport.',
      fallbackGradient: 'from-[#0F3460] via-[#16213E] to-[#1A1A2E]',
      fallbackIcon: <Sparkles className="w-10 h-10 text-rose-500" />
    },
    {
      key: 'sec-card-1',
      title: 'Bank-Level Security Preview',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&auto=format&fit=crop&q=80',
      usage: 'About.tsx (Card 1)',
      description: 'Cybersecurity dashboard graphic demonstrating high protective encryption integrity.',
      fallbackGradient: 'from-blue-600 to-indigo-900',
      fallbackIcon: <ShieldCheck className="w-8 h-8 text-white" />
    },
    {
      key: 'sec-card-2',
      title: 'Verified Community Transactions',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80',
      usage: 'About.tsx (Card 2)',
      description: 'Merchant interacting with customer to build strong peer feedback scores.',
      fallbackGradient: 'from-emerald-500 to-teal-700',
      fallbackIcon: <CheckCircle className="w-8 h-8 text-white" />
    },
    {
      key: 'sec-card-3',
      title: 'Instant escrow logistics drop',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      usage: 'About.tsx (Card 3)',
      description: 'Modern logistics hub symbolizing prompt digital product verification.',
      fallbackGradient: 'from-amber-500 to-orange-700',
      fallbackIcon: <Sparkles className="w-8 h-8 text-white" />
    },
    {
      key: 'feat-safe',
      title: 'Features - Safeguard Systems',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=500&auto=format&fit=crop&q=70',
      usage: 'Features.tsx (Dynamic Grid)',
      description: 'Securing credentials verification systems on merchant accounts.',
      fallbackGradient: 'from-slate-700 via-slate-900 to-black',
      fallbackIcon: <ShieldCheck className="w-7 h-7 text-rose-400" />
    },
    {
      key: 'feat-chat',
      title: 'Features - Client-Seller Live Chat',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=500&auto=format&fit=crop&q=70',
      usage: 'Features.tsx (Dynamic Grid)',
      description: 'Interactive custom screen mapping immediate seller negotiations.',
      fallbackGradient: 'from-[#1A1A2E] to-[#0F3460]',
      fallbackIcon: <Layers className="w-7 h-7 text-blue-400" />
    },
    {
      key: 'feat-categories',
      title: 'Features - Smart Indexing',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=500&auto=format&fit=crop&q=70',
      usage: 'Features.tsx (Dynamic Grid)',
      description: 'Easy folders categorization structure for digital assets.',
      fallbackGradient: 'from-violet-500 to-fuchsia-800',
      fallbackIcon: <Compass className="w-7 h-7 text-indigo-300" />
    },
    {
      key: 'feat-escrow',
      title: 'Features - Escrow Protection Vault',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=70',
      usage: 'Features.tsx (Dynamic Grid)',
      description: 'The central freeze lock mechanism securing Paystack transactions.',
      fallbackGradient: 'from-rose-500 to-purple-800',
      fallbackIcon: <Sparkles className="w-7 h-7 text-amber-300" />
    },
    {
      key: 'how-step-1',
      title: 'How It Works - Step 1 Banner',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&auto=format&fit=crop&q=70',
      usage: 'HowItWorks.tsx (Step 1)',
      description: 'A developer browsing curated premium collections in the lobby.',
      fallbackGradient: 'from-indigo-600 to-blue-800',
      fallbackIcon: <Compass className="w-6 h-6 text-white" />
    },
    {
      key: 'how-step-2',
      title: 'How It Works - Step 2 Banner',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&auto=format&fit=crop&q=70',
      usage: 'HowItWorks.tsx (Step 2)',
      description: 'Sellers conversing with purchasers on customized specifications.',
      fallbackGradient: 'from-[#0F3460] to-[#E94560]/80',
      fallbackIcon: <Layers className="w-6 h-6 text-white" />
    },
    {
      key: 'how-step-3',
      title: 'How It Works - Step 3 Banner',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=70',
      usage: 'HowItWorks.tsx (Step 3)',
      description: 'Secure bank deposit portal symbol during active checkout routing.',
      fallbackGradient: 'from-emerald-600 to-indigo-950',
      fallbackIcon: <ShieldCheck className="w-6 h-6 text-white" />
    },
    {
      key: 'how-step-4',
      title: 'How It Works - Step 4 Banner',
      category: 'remote',
      src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=70',
      usage: 'HowItWorks.tsx (Step 4)',
      description: 'Decrypted credentials drop confirmation onto terminal screens.',
      fallbackGradient: 'from-cyan-500 to-violet-800',
      fallbackIcon: <Sparkles className="w-6 h-6 text-white" />
    },
    ...INITIAL_LISTINGS.map(item => ({
      key: `listing-${item.id}`,
      title: item.title,
      category: 'listing_default' as const,
      src: item.imageUrl,
      usage: `Marketplace listings (Product ID: ${item.id})`,
      description: item.description,
      fallbackGradient: item.platform === 'Streaming' ? 'from-rose-600 to-[#1A1A2E]' : 
                        item.platform === 'Gaming' ? 'from-[#0F3460] to-slate-900' : 'from-indigo-600 to-cyan-900',
      fallbackIcon: item.platform === 'Streaming' ? <Tv className="w-8 h-8 text-white" /> : <Award className="w-8 h-8 text-white" />
    })),
    {
      key: 'avatar-user-1',
      title: 'Sarah Customer Avatar',
      category: 'testimonial',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=60',
      usage: 'Testimonials.tsx',
      description: 'Sarah Customer user avatar photo displaying rating approvals.',
      fallbackGradient: 'from-pink-400 to-purple-600',
      fallbackIcon: <Heart className="w-4 h-4 text-white" />
    },
    {
      key: 'avatar-user-2',
      title: 'Tunde Merchant Avatar',
      category: 'testimonial',
      src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60',
      usage: 'Testimonials.tsx',
      description: 'Tunde Reseller testimonial profile image proving trust system.',
      fallbackGradient: 'from-blue-400 to-indigo-600',
      fallbackIcon: <Heart className="w-4 h-4 text-white" />
    }
  ];

  // Initialize loading flags
  useEffect(() => {
    const initial: Record<string, 'loading' | 'success' | 'failed'> = {};
    assetsList.forEach(a => {
      initial[a.key] = 'loading';
    });
    setLoadingStates(initial);
  }, [refreshKey]);

  const handleImageLoad = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: 'success' }));
  };

  const handleImageError = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: 'failed' }));
  };

  const filteredAssets = selectedCategory === 'all' 
    ? assetsList 
    : assetsList.filter(a => a.category === selectedCategory);

  const stats = {
    total: assetsList.length,
    loaded: Object.values(loadingStates).filter(v => v === 'success').length,
    failed: Object.values(loadingStates).filter(v => v === 'failed').length,
    loading: Object.values(loadingStates).filter(v => v === 'loading').length,
  };

  return (
    <div id="deployment-assets-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-800">
      
      {/* Decorative background grid elements */}
      <div className="absolute top-0 left-0 w-full h-[32rem] bg-gradient-to-b from-[#1A1A2E]/5 to-transparent pointer-events-none -z-1" />

      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(233,69,96,0.15),transparent_40%)]" />
        <div className="absolute top-2 right-2 opacity-5">
          <ImageIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="text-[10px] bg-slate-800 text-rose-400 border border-slate-700 px-3 py-1 rounded-full uppercase font-bold tracking-wider inline-block">
            Production Asset Catalog & Integrity check
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            Image Deployment Gallery
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-medium">
            Confirm and preview every single visual background, card listing, and avatar used on this platform.
            All components are equipped with <b className="text-white">Smart Fallback Guardrails</b> so that even if network issues, 
            local proxy blocks, or ad-blockers target our remote CDNs, beautiful custom gradients and SVG icons are displayed 
            automatically so pages are <b className="text-rose-400">never empty</b>.
          </p>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-xs sm:divide-x sm:divide-slate-200/50">
        <div className="text-center md:text-left px-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Managed Assets</span>
          <span className="text-2xl font-extrabold text-slate-800 font-sans">{stats.total} Images</span>
        </div>
        <div className="text-center md:text-left px-2 pt-2 md:pt-0">
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Status Loaded</span>
          <span className="text-2xl font-extrabold text-emerald-600 font-sans">
            {forceFallback ? 0 : stats.loaded} Active
          </span>
        </div>
        <div className="text-center md:text-left px-2 pt-2 md:pt-0">
          <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Failed / Offline Fallback</span>
          <span className="text-2xl font-extrabold text-rose-600 font-sans">
            {forceFallback ? stats.total : stats.failed} Fallback
          </span>
        </div>
        <div className="text-center md:text-left px-2 pt-2 md:pt-0">
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Network Sync Status</span>
          <span className="text-2xl font-extrabold text-slate-700 font-sans flex items-center justify-center md:justify-start gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live
          </span>
        </div>
      </div>

      {/* Control Panel Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Category selection */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['all', 'local', 'remote', 'listing_default', 'testimonial'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition cursor-pointer select-none ${
                selectedCategory === cat 
                  ? 'bg-[#0F3460] text-white shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat === 'all' ? 'All Images' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Dynamic Fallback simulator toggler */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="p-2 bg-slate-100 font-semibold hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh connection probes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Probe Network
          </button>

          <button
            id="toggle-offline-fallback"
            onClick={() => setForceFallback(!forceFallback)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              forceFallback 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                : 'bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {forceFallback ? 'Disable Offline Simulation' : 'Simulate Offline Fallbacks'}
          </button>
        </div>

      </div>

      {/* Prompt Information Banner */}
      <div className="bg-[#0F3460]/5 rounded-xl p-4 border border-[#0F3460]/15 flex gap-3 text-xs text-slate-700 leading-relaxed md:items-center">
        <Info className="w-5 h-5 text-[#0F3460] shrink-0 fill-[#0F3460]/5" />
        <p>
          <b>Offline Simulation Proof:</b> Toggle the fallback button above to verify our <b>No-Empty-Cards Principle</b>. 
          The entire application automatically drops the broken image graphic and replaces it with rich color gradients matched with 
          central stylized vector icons to keep pages beautiful even during client ad-blocker or iframe isolation!
        </p>
      </div>

      {/* Visual Bento Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const currentStatus = forceFallback ? 'failed' : (loadingStates[asset.key] || 'loading');

          return (
            <div 
              key={asset.key}
              id={`deploy-asset-card-${asset.key}`}
              className="bg-white/60 hover:bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Image Preview Window */}
              <div className="h-44 w-full relative bg-slate-100 border-b border-slate-200/50 flex items-center justify-center overflow-hidden">
                
                {/* Fallback Display State */}
                {currentStatus === 'failed' ? (
                  <div className={`w-full h-full bg-gradient-to-br ${asset.fallbackGradient} flex flex-col items-center justify-center p-4 text-center select-none animate-[fadeIn_0.5s_ease-out]`}>
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center mb-2 shadow-inner border border-white/15 animate-[pulse_3s_infinite]">
                      {asset.fallbackIcon}
                    </div>
                    <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider block">
                      Secure SVG Fallback Active
                    </span>
                    <span className="text-[9px] text-white/70 block mt-0.5">
                      No broken boxes or empty spaces
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Live Image */}
                    <img 
                      src={asset.src} 
                      alt={asset.title}
                      referrerPolicy="no-referrer"
                      onLoad={() => handleImageLoad(asset.key)}
                      onError={() => handleImageError(asset.key)}
                      className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
                        currentStatus === 'loading' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                    />

                    {/* Pending state spinner overlay */}
                    {currentStatus === 'loading' && (
                      <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                        <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                )}

                {/* Left badges - Category Category */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-[9px] text-slate-100 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-slate-700 select-none">
                  {asset.category.replace('_', ' ')}
                </div>

                {/* Right badges - Loaded loaded Status */}
                <div className="absolute top-3 right-3 select-none">
                  {currentStatus === 'success' ? (
                    <span className="bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm border border-emerald-400">
                      <Check className="w-3 h-3" />
                      HTTPS Active
                    </span>
                  ) : currentStatus === 'failed' ? (
                    <span className="bg-rose-500/90 text-white text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm border border-rose-400">
                      <AlertTriangle className="w-3 h-3 animate-[shake_0.5s_infinite]" />
                      Fallback Safe
                    </span>
                  ) : (
                    <span className="bg-slate-400 text-white text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md flex items-center gap-1 animate-pulse">
                      Pending Probe
                    </span>
                  )}
                </div>

              </div>

              {/* Asset Information Body */}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans line-clamp-1">
                    {asset.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal mt-1 block">
                    {asset.description}
                  </p>
                </div>

                {/* Technical Coordinates Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">File Reference Usage:</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-sans">{asset.usage}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Asset Pathway URL:</span>
                    <div className="flex items-center gap-1 text-[#0F3460] font-sans hover:underline max-w-[200px] truncate">
                      <a href={asset.src} target="_blank" rel="noopener noreferrer" className="block truncate">
                        {asset.src}
                      </a>
                      <ExternalLink className="w-3 h-3 inline shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
