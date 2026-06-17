import React, { useState, useMemo } from 'react';
import { Search, Filter, ShieldCheck, AlertCircle, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { ProductListing, User } from '../types';
import { formatNaira } from '../data';

function BrandLogoOverlay({ title }: { title: string }) {
  const name = title.toLowerCase();
  
  if (name.includes('netflix')) {
    return (
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#E50914] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md border border-red-500 uppercase tracking-widest leading-none z-10">
        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
          <path d="M5.977 24C5.234 24 4.5 24 3.758 24V0C4.5 0 5.234 0 5.977 0v21.574L18.023 0H20.24v24C19.5 24 18.758 24 18.021 24V2.426L5.977 24z" />
        </svg>
        Netflix
      </span>
    );
  }
  
  if (name.includes('spotify')) {
    return (
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#1DB954] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md border border-green-500 uppercase tracking-wider leading-none z-10">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.136-.669.47-.745 3.848-.879 7.14-.502 9.813 1.135.297.18.39.566.21 8.618zm1.229-2.733c-.226.367-.707.487-1.074.26-2.593-1.593-6.544-2.054-9.599-1.127-.411.125-.845-.107-.97-.518-.124-.412.108-.846.52-.971 3.493-1.06 7.848-.545 10.863 1.309.367.226.487.707.26 1.047zm.105-2.822C14.394 8.712 8.618 8.52 5.272 9.536c-.536.162-1.1-.145-1.263-.68-.162-.537.146-1.1.682-1.263 3.83-1.163 10.207-.94 14.257 1.465.483.287.641.905.352 1.388-.288.483-.906.643-1.388.355z" />
        </svg>
        Spotify
      </span>
    );
  }
  
  if (name.includes('disney')) {
    return (
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#113CCF] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md border border-blue-400 uppercase tracking-widest leading-none z-10">
        Disney+
      </span>
    );
  }
  
  if (name.includes('xbox')) {
    return (
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#107C10] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md border border-green-600 uppercase tracking-wider leading-none z-10">
        Xbox Live
      </span>
    );
  }
  
  if (name.includes('gmail') || name.includes('google')) {
    return (
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#EA4335] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md border border-red-400 uppercase tracking-wider leading-none z-10">
        Google
      </span>
    );
  }
  
  if (name.includes('amazon') || name.includes('prime')) {
    return (
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#FF9900] text-[#1A1A2E] text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md border border-amber-500 uppercase tracking-wider leading-none z-10">
        Prime
      </span>
    );
  }
  
  return null;
}

interface MarketplaceProps {
  listings: ProductListing[];
  currentUser: User | null;
  onBuyNow: (product: ProductListing) => void;
  onOpenAuth: (view: 'login' | 'signup') => void;
}

export default function Marketplace({ listings, currentUser, onBuyNow, onOpenAuth }: MarketplaceProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [priceRange, setPriceRange] = useState(35000); // Seeding bounds
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract all platform options
  const platforms = useMemo(() => {
    const list = new Set(listings.map(l => l.platform));
    return ['All', ...Array.from(list)];
  }, [listings]);

  // Handle slide checks
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.platform.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchPlatform = selectedPlatform === 'All' || item.platform === selectedPlatform;
      const matchPrice = item.price <= priceRange;
      const matchStatus = item.status !== 'inactive';
      
      return matchSearch && matchPlatform && matchPrice && matchStatus;
    });
  }, [listings, searchQuery, selectedPlatform, priceRange]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('All');
    setPriceRange(35000);
  };

  return (
    <div id="marketplace-page-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="text-center md:text-left mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-normal text-[#1A1A2E]">
            Available Digital Accounts
          </h1>
          <p className="text-sm text-[#4A4A6A] mt-2">
            Secure, verified access credentials delivered in high convenience. Filter results safely.
          </p>
        </div>
        
        {/* Mobile Filters Toggle trigger btn */}
        <button
          id="mobile-filters-trigger"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1A1A2E] text-white hover:bg-[#16213E] text-sm font-semibold rounded-lg shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#0F3460]" />
          {showMobileFilters ? 'Hide Filters Panel' : 'Show Filters Panel'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Filters Sidebar (Desktop or Collapsible Mobile) */}
        <div 
          id="marketplace-sidebar-column"
          className={`${
            showMobileFilters ? 'block' : 'hidden md:block'
          } bg-white p-6 rounded-xl border border-[#E0E0E0] shadow-xs space-y-6 h-fit`}
        >
          <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#1A1A2E] tracking-wide flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#0F3460]" />
              Filter Catalog
            </h3>
            <button
              id="sidebar-reset-filters"
              onClick={handleResetFilters}
              className="text-xs text-[#0F3460] hover:text-[#16213E] hover:underline transition"
            >
              Clear All
            </button>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider mb-2">
              Search Accounts
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4A4A6A]/65">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="search-accounts-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Netflix, ChatGPT"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-[#E0E0E0] text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] min-h-[44px]"
              />
            </div>
          </div>

          {/* Platform dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider mb-2">
              Platform
            </label>
            <select
              id="platform-dropdown-filter"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-[#E0E0E0] text-[#1A1A2E] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F3460] font-medium min-h-[44px] cursor-pointer"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#1A1A2E] uppercase tracking-wider">
                Max Price
              </label>
              <span className="text-xs font-bold text-[#0F3460] bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#E0E0E0]">
                {formatNaira(priceRange)}
              </span>
            </div>
            <input
              type="range"
              id="price-range-slider"
              min="1500"
              max="35000"
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0F3460]"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-semibold">
              <span>Min: {formatNaira(1500)}</span>
              <span>Max: {formatNaira(35000)}</span>
            </div>
          </div>

          {/* Verification Tip Box */}
          <div className="bg-[#F5F5F7] border border-[#E0E0E0] rounded-lg p-4 space-y-2">
            <span className="text-[10px] bg-white text-[#0F3460] border border-[#E0E0E0] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Help Desk</span>
            <p className="text-[11px] text-[#4A4A6A] leading-relaxed">
              Every merchant account goes through extensive credit checks. Credentials are encrypted in transit. Safe, automated releases only.
            </p>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          
          {filteredListings.length === 0 ? (
            <div id="no-matching-products" className="bg-white rounded-xl p-12 text-center border border-[#E0E0E0]">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg text-[#1A1A2E]">No Accounts Match Filters</h3>
              <p className="text-sm text-[#4A4A6A] mt-2 max-w-md mx-auto">
                We couldn't find any premium resources that fit your current criteria. Try resetting the filters or modifying your search keyword!
              </p>
              <button
                id="reset-filter-btn"
                onClick={handleResetFilters}
                className="mt-6 px-6 py-2 bg-[#0F3460] text-white hover:bg-[#16213E] rounded-full font-medium text-xs transition min-h-[44px]"
              >
                Reset Filter Catalog
              </button>
            </div>
          ) : (
            <div id="product-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  id={`product-card-${item.id}`}
                  className="bg-white rounded-xl border border-[#E0E0E0] shadow-xs hover:shadow-[0_4px_20px_rgba(15,52,96,0.08)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
                >
                  
                  {/* Account image header */}
                  <div className="relative h-32 bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                    {/* Platform Tag */}
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-bold text-white bg-[#1A1A2E] px-2 py-1 rounded-md uppercase tracking-wide">
                      {item.platform}
                    </span>
                    {/* Brand Logo Overlay Badge */}
                    <BrandLogoOverlay title={item.title} />
                    {/* Seller Tag */}
                    <span className="absolute bottom-2 right-2 text-[8px] font-medium text-white bg-[#1A1A2E]/90 px-2 py-0.5 rounded-md backdrop-blur-xs max-w-[150px] truncate" title={item.sellerName}>
                      {item.sellerName}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] font-bold text-[#0F3460] bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider font-sans">
                          {item.platform}
                        </span>
                      </div>
                      <h3 className="font-heading font-semibold text-sm text-[#1A1A2E] tracking-tight hover:text-[#0F3460] cursor-pointer line-clamp-2 min-h-[40px] transition-colors" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-[#4A4A6A] leading-relaxed mt-2 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-[#E0E0E0]/40 pt-3 flex items-center justify-between">
                      {/* Price rates */}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-[#4A4A6A] uppercase font-bold tracking-wider">Premium Access</span>
                        <span className="text-base font-bold text-[#E94560]">{formatNaira(item.price)}</span>
                      </div>
                      
                      {/* Stock Warnings indicator */}
                      <div className="text-right">
                        <span className={`text-[10px] font-bold ${
                          item.stock <= 5 ? 'text-[#E94560] bg-rose-50 px-1.5 py-0.5 rounded border border-[#E0E0E0]/40' : 'text-[#4A4A6A]/60'
                        }`}>
                          {item.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Activation bottom bar */}
                  <div className="p-3 bg-slate-50 border-t border-[#E0E0E0]/30">
                    <button
                      id={`buy-btn-${item.id}`}
                      onClick={() => {
                        if (!currentUser) {
                          onOpenAuth('login');
                        } else {
                          onBuyNow(item);
                        }
                      }}
                      className="w-full py-2 bg-[#0F3460] hover:bg-[#16213E] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
                    >
                      Buy Now
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
