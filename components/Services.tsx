import React from 'react';
import { RateCardItem, ServiceOffering } from '../types';

interface ServicesProps {
  services: ServiceOffering[];
  rateCards: RateCardItem[];
}

const Services: React.FC<ServicesProps> = ({ services, rateCards }) => {
  const primaryRateCard =
    rateCards.find(card => card.ctaUrl && card.ctaLabel) || rateCards[0];

  return (
    <div className="max-w-7xl mx-auto py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
          Services & <span className="text-amber-400">Consulting</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl">
          Book a session to map your ministry’s digital strategy, then choose the service tier
          that fits your goals.
        </p>
      </div>

      <div className="glass-card p-8 rounded-[2rem] border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">Book Me</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            Free 30-min Pre-Consult
          </span>
        </div>
        <p className="text-slate-400 text-sm max-w-2xl">
          Let’s review your current tools, identify bottlenecks, and outline a clear next step.
        </p>
        {primaryRateCard?.ctaLabel && primaryRateCard?.ctaUrl ? (
          <a
            href={primaryRateCard.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-amber inline-flex items-center justify-center px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black"
          >
            {primaryRateCard.ctaLabel}
          </a>
        ) : null}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Services</h2>
        <div className="divide-y divide-white/5 border-y border-white/10">
          {services.map((service) => (
            <div key={service.id} className="py-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-white">{service.title}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">{service.rate}</span>
              </div>
              <p className="text-slate-400 text-sm">{service.description}</p>
              {service.ctaLabel && service.ctaUrl ? (
                <a
                  href={service.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-amber inline-flex items-center justify-center px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black"
                >
                  {service.ctaLabel}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Rate Cards</h2>
        <div className="divide-y divide-white/5 border-y border-white/10">
          {rateCards.map((card) => (
            <div key={card.id} className="py-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white">{card.label}</span>
                <span className="text-sm font-bold text-amber-400">{card.value}</span>
              </div>
              {card.ctaLabel && card.ctaUrl ? (
                <a
                  href={card.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-emerald inline-flex items-center justify-center px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black"
                >
                  {card.ctaLabel}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
