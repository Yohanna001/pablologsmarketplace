import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Zap } from 'lucide-react';

export default function About() {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const cards = [
    {
      id: 'sec-card-1',
      title: 'Bank-Level Security',
      description: 'Your transactions and data are protected with state-of-the-art cryptographic encryption protocols. Pure safety on every checkout sequence.',
      icon: <ShieldCheck className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'sec-card-2',
      title: 'Verified Community',
      description: 'We authenticate every merchant and monitor feedback scores religiously. Rest easy knowing you are chatting with approved, trustworthy sellers.',
      icon: <UserCheck className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'sec-card-3',
      title: 'Instant Delivery',
      description: 'No endless queues. Once payment completes in our secure escrow gateway, your accounts credentials drop onto your screen instantly without delay.',
      icon: <Zap className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <section id="about" className="py-20 bg-transparent border-b border-[#E0E0E0]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Centered normal weight title */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[10px] bg-white/60 backdrop-blur-xs text-[#0F3460] border border-[#E0E0E0]/80 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider inline-block mb-3 shadow-3xs">
            Trusted Escrow Integrity
          </span>
          <h2 className="font-heading font-medium text-2xl sm:text-3xl text-[#1A1A2E] tracking-tight">
            About Pablologsmarketplace
          </h2>
          <div className="w-10 h-0.5 bg-[#0F3460] mx-auto mt-3 rounded-full" />
          <p className="text-sm sm:text-base text-[#4A4A6A] leading-relaxed mt-5 max-w-2xl mx-auto">
            We're revolutionizing the digital marketplace experience. Our platform connects verified buyers and sellers in an advanced, transparent environment where transaction security, credentials validations, and quality come first.
          </p>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className="group bg-white/60 hover:bg-white/95 backdrop-blur-md rounded-2xl border border-[#E0E0E0]/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="h-44 w-full overflow-hidden bg-slate-100 relative border-b border-[#E0E0E0]/60">
                {!imgErrors[card.id] ? (
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors(prev => ({ ...prev, [card.id]: true }))}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0F3460]/5 flex items-center justify-center relative">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-[#0F3460]/10 flex items-center justify-center mx-auto text-[#0F3460] mb-2">
                        {card.icon}
                      </div>
                      <span className="text-[10px] text-[#4A4A6A] uppercase font-bold tracking-wider">Secure Module Active</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-xs text-[#0F3460] flex items-center justify-center border border-[#E0E0E0] shadow-sm">
                  {card.icon}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A2E] mb-2 font-sans tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#4A4A6A] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
