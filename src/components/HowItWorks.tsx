import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Explore & Discover',
      subtitle: 'Browse curated collection',
      description: 'Explore our catalog of verified premium accounts, filtered easily by platform, price, or tags.',
      imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&auto=format&fit=crop&q=70'
    },
    {
      id: 'step-02',
      step: '02',
      title: 'Connect & Negotiate',
      subtitle: 'Chat with verified sellers',
      description: 'Interact safely on our platform and discuss custom terms before committing funds.',
      imageUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=300&auto=format&fit=crop&q=70'
    },
    {
      id: 'step-03',
      step: '03',
      title: 'Secure Checkout',
      subtitle: 'Escrow protection',
      description: 'Pay safely using our integrated Paystack secure escrow process. Funds are safely frozen until you confirm delivery.',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=70'
    },
    {
      id: 'step-04',
      step: '04',
      title: 'Instant Delivery',
      subtitle: 'Receive immediately',
      description: 'Pick up your secure credentials on your dashboard right after the checkout validation.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=70'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-transparent border-b border-[#E0E0E0]/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Centered normal weight title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-heading font-medium text-2xl sm:text-3xl text-[#1A1A2E] tracking-tight">
            How Pablologsmarketplace Works
          </h2>
          <div className="w-10 h-0.5 bg-[#0F3460] mx-auto mt-3 rounded-full" />
        </div>

        {/* Narrative introduction */}
        <div className="text-center mb-10">
          <span className="text-[10px] bg-white/60 backdrop-blur-xs text-[#0F3460] border border-[#E0E0E0]/80 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider inline-block">
            Simple Progressive Roadmap
          </span>
          <p className="text-sm text-[#4A4A6A] leading-relaxed mt-4 max-w-2xl mx-auto">
            We handle the heavy lifting regarding security certifications, merchant background validations, escrow locks, and direct client credentials release. Simply complete these steps to buy or sell:
          </p>
        </div>

        {/* Roadmap timeline cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((item) => (
            <div
              key={item.step}
              id={`how-step-${item.step}`}
              className="group bg-white/60 hover:bg-white/95 backdrop-blur-md rounded-xl p-5 border border-[#E0E0E0]/80 shadow-xs hover:shadow-[0_4px_20px_rgba(15,52,96,0.04)] transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-4"
            >
              {/* Left Column: Number Node and Step Image */}
              <div className="flex sm:flex-col items-center gap-2.5 shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#0F3460] text-white flex items-center justify-center font-heading font-extrabold text-xs shrink-0 border-2 border-white shadow-md select-none">
                  {item.step}
                </div>
                {item.imageUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#E0E0E0] bg-slate-50 relative shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Step Description Text */}
              <div className="text-center sm:text-left flex-1">
                <span className="text-[10px] text-[#0F3460] font-bold uppercase tracking-wider block mb-0.5">
                  {item.subtitle}
                </span>
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-1 tracking-tight">
                  {item.title}
                </h3>
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
