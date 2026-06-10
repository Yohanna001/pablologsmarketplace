import React from 'react';
import { Star, Quote } from 'lucide-react';
import { LANDING_TESTIMONIALS } from '../data';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16 bg-transparent border-t border-b border-[#E0E0E0]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Testimonials Title with yellow stars row */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-[#E0E0E0]/60 gap-4">
          <h2 className="font-heading font-medium text-xl sm:text-2xl text-[#1A1A2E] tracking-tight">
            What Our Users Say
          </h2>
          <div className="text-[#F5B042] flex gap-0.5 text-base" aria-label="5 stars rated">
            ★★★★★
          </div>
        </div>

        {/* Flat minimalist divided grid layout replaced with premium glass cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LANDING_TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              id={t.id}
              className="bg-white/60 hover:bg-white/85 backdrop-blur-md rounded-2xl p-6 border border-[#E0E0E0]/80 shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col justify-between"
            >
              {/* Quote feedback */}
              <p className="text-[#4A4A6A] text-xs leading-relaxed italic mb-4">
                "{t.feedback}"
              </p>

              {/* Minimalist Avatar, Name and role */}
              <div className="flex items-center gap-3 mt-auto pt-3 border-t border-slate-200/40">
                {t.avatarUrl && (
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#E0E0E0] shadow-2xs shrink-0">
                    <img
                      src={t.avatarUrl}
                      alt={t.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-[#1A1A2E] block">
                    {t.name}
                  </span>
                  <span className="text-[9px] text-[#4A4A6A]/70 block">
                    {t.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
