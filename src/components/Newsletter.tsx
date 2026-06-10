import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    setSubscribed(true);
    setEmail('');
    
    // Auto reset subscription state after 5 seconds
    setTimeout(() => {
      setSubscribed(false);
    }, 5000);
  };

  return (
    <section id="newsletter" className="py-16 bg-transparent border-b border-[#E0E0E0]/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-white/40 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-[#E0E0E0]/80 shadow-xs">
        
        {/* Title */}
        <h2 className="font-heading font-medium text-2xl text-[#1A1A2E] tracking-tight">
          Stay Updated
        </h2>
        <div className="w-10 h-0.5 bg-[#0F3460] mx-auto mt-3 rounded-full" />

        <p className="mt-4 text-xs sm:text-sm text-[#4A4A6A] max-w-sm mx-auto leading-relaxed">
          Get the latest updates, exclusive deals, and marketplace insights delivered to your inbox.
        </p>

        {/* Input Form: inline on desktop, stacked on mobile */}
        <div className="mt-8 max-w-md mx-auto">
          {subscribed ? (
            <div id="newsletter-success-alert" className="p-4 bg-white border border-[#E0E0E0] text-[#1A1A2E] rounded-xl flex items-center gap-3 justify-center animate-[fadeIn_0.3s_ease]">
              <CheckCircle className="w-4 h-4 text-[#0F3460] shrink-0" />
              <p className="text-xs font-semibold">Thank you! You have successfully subscribed to our newsletter.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#4A4A6A]/60" />
                </div>
                <input
                  type="email"
                  id="newsletter-email-input"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email address"
                  className="w-full text-xs pl-10 pr-4 py-2 bg-white border border-[#E0E0E0] text-[#1A1A2E] rounded-full focus:outline-none focus:ring-1 focus:ring-[#0F3460] focus:border-[#0F3460] transition min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                id="newsletter-subscribe-btn"
                className="w-full sm:w-auto px-6 py-2 bg-[#0F3460] hover:bg-[#16213E] text-white font-bold text-xs rounded-full transition-colors whitespace-nowrap min-h-[44px]"
              >
                Subscribe
              </button>
            </form>
          )}

          {error && (
            <p id="newsletter-error-msg" className="mt-2 text-[10px] text-rose-500 font-medium text-left pl-5">
              {error}
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
