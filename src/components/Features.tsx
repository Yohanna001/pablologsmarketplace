import React, { useState } from 'react';
import { Shield, MessageSquare, Layers, Lock, Award, Wallet } from 'lucide-react';

export default function Features() {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const list = [
    {
      id: 'feat-safe',
      title: 'Safe & Secure',
      description: 'End-to-end multi-layer protection and strict buyer verification guidelines to ensure all account assets are accessed without leak.',
      icon: <Shield className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=500&auto=format&fit=crop&q=70'
    },
    {
      id: 'feat-chat',
      title: 'Live Chat',
      description: 'Connect immediately. Communicate, ask specifications, negotiation, and discuss account transfers safely inside our private client portal.',
      icon: <MessageSquare className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=500&auto=format&fit=crop&q=70'
    },
    {
      id: 'feat-categories',
      title: 'Smart Categories',
      description: 'Instantly filter streaming, productivity, AI tools, and code assistants to locate exactly what membership credentials you need.',
      icon: <Layers className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=500&auto=format&fit=crop&q=70'
    },
    {
      id: 'feat-escrow',
      title: 'Escrow Protection',
      description: 'Funds are held securely by our escrow module and released to merchants only after you log in and confirm active credentials.',
      icon: <Lock className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=70'
    },
    {
      id: 'feat-trust',
      title: 'Trust System',
      description: 'Public seller ratings, successful transaction histories, and real customer stars provide transparency you can depend on.',
      icon: <Award className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=70'
    },
    {
      id: 'feat-wallet',
      title: 'Smart Wallet',
      description: 'Deposit funds, check payouts, review order histories, and execute payment gateways smoothly through Paystack integration.',
      icon: <Wallet className="w-6 h-6 text-[#0F3460]" />,
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=70'
    }
  ];

  return (
    <section id="features" className="py-20 bg-transparent border-b border-[#E0E0E0]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section title aligned with normal weight Inter */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading font-medium text-2xl sm:text-3xl text-[#1A1A2E] tracking-tight">
            Powerful Features
          </h2>
          <div className="w-10 h-0.5 bg-[#0F3460] mx-auto mt-3 rounded-full" />
          <p className="mt-4 text-xs sm:text-sm text-[#4A4A6A] font-medium tracking-wide uppercase">
            Everything you need for secure and successful digital transactions
          </p>
        </div>

        {/* 3-Column Bento Symmetrical Layout replaced with direct 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="group p-5 bg-white/60 hover:bg-white/95 backdrop-blur-md rounded-xl border border-[#E0E0E0]/80 shadow-xs hover:shadow-[0_4px_20px_rgba(15,52,96,0.04)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {item.imageUrl && (
                  <div className="h-40 overflow-hidden rounded-lg mb-4 border border-[#E0E0E0]/50 relative bg-slate-100">
                    {!imgErrors[item.id] ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0F3460]/5 flex items-center justify-center relative">
                        <div className="text-center p-3">
                          <div className="w-10 h-10 rounded-full bg-[#0F3460]/10 flex items-center justify-center mx-auto text-[#0F3460] mb-2">
                            {item.icon}
                          </div>
                          <span className="text-[9px] text-[#4A4A6A] uppercase font-bold tracking-wider">Feature Active</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#0F3460] border border-[#E0E0E0] shadow-2xs">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A2E] tracking-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-[#4A4A6A] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
