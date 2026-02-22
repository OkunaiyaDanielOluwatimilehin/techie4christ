import React from 'react';
import { SupportDetail } from '../types';

interface SupportProps {
  details: SupportDetail[];
}

const Support: React.FC<SupportProps> = ({ details }) => {

  return (
    <div className="max-w-4xl mx-auto py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
          Support the Mission
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          If this work blesses you, here’s a simple way to support the vision.
        </p>
      </div>

      <div className="glass-card rounded-[2rem] border border-white/10 p-8 space-y-6">
        {details.map((detail) => (
          <div key={detail.id} className="flex items-center justify-between border border-white/5 rounded-2xl p-5">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">{detail.label}</span>
            <span className="text-sm md:text-base font-semibold text-white">{detail.value}</span>
          </div>
        ))}
      </div>

      <div className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">
        Thank you for partnering.
      </div>
    </div>
  );
};

export default Support;
