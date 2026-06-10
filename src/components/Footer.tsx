import React from 'react';
import { Heart, Shield, HelpCircle, Mail, Globe, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenAuth: (view: 'login' | 'signup') => void;
}

export default function Footer({ onNavigateSection, onOpenAuth }: FooterProps) {
  const handleLinkClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onNavigateSection(sectionId);
    }
  };

  return (
    <footer id="footer" className="bg-[#1A1A2E] text-[#FAFAFC] pt-16 pb-8 border-t border-[#E0E0E0]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Tagline */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#0F3460] flex items-center justify-center text-white text-base">P</span>
              Pablologsmarketplace
            </span>
            <p className="text-sm text-[#FAFAFC]/75 leading-relaxed max-w-sm">
              The most trusted marketplace for digital assets. Connecting verified buyers and sellers worldwide. Build, trade, and exchange accounts with maximum assurance.
            </p>
            <div className="flex items-center gap-4 text-[#FAFAFC]/60 pt-2">
              <Globe className="w-5 h-5 hover:text-[#0F3460] cursor-pointer transition" />
              <Shield className="w-5 h-5 hover:text-[#0F3460] cursor-pointer transition" />
              <HelpCircle className="w-5 h-5 hover:text-[#0F3460] cursor-pointer transition" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleLinkClick(e, 'home')}
                  className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleLinkClick(e, 'about')}
                  className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleLinkClick(e, 'features')}
                  className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleLinkClick(e, 'how-it-works')}
                  className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors"
                >
                  How it Works
                </a>
              </li>
              <li>
                <button
                  id="footer-become-merchant-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors text-left"
                >
                  Become a Merchant
                </button>
              </li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#help" onClick={(e) => e.preventDefault()} className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => e.preventDefault()} className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#security" onClick={(e) => e.preventDefault()} className="text-[#FAFAFC]/70 hover:text-[#0F3460] transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAFAFC]/55">
          <div>
            © 2025 Pablologsmarketplace. All rights reserved. Registered Digital Asset Escrow Operator.
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            Made with <Heart className="w-3.5 h-3.5 text-[#E94560] fill-[#E94560] inline shrink-0" /> for the community
          </div>
        </div>

      </div>
    </footer>
  );
}
