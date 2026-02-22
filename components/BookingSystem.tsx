
import React, { useEffect, useState } from 'react';
import { SiteSettings } from '../types';

interface BookingSystemProps {
  settings: SiteSettings;
}

const BookingSystem: React.FC<BookingSystemProps> = ({ settings }) => {
  const [view, setView] = useState<'automatic' | 'manual'>('automatic');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  // Calendly widget loader
  useEffect(() => {
    if (view !== 'automatic') return;
    const init = () => {
      const root = document.getElementById('calendly-root');
      if (root) root.innerHTML = '';
      // @ts-ignore
      if (window.Calendly) {
        // @ts-ignore
        window.Calendly.initInlineWidget({
          url: 'https://calendly.com/okunaiyadaniel13/30min?hide_event_type_details=1&hide_gdpr_banner=1',
          parentElement: root,
        });
      }
    };

    const existing = document.querySelector('script[data-calendly-widget]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.setAttribute('data-calendly-widget', 'true');
      script.onload = init;
      document.body.appendChild(script);
    } else {
      init();
    }
  }, [view]);

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://formspree.io/f/xgollaaj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) setSubmitted(true);
      else alert('There was an error sending your booking request. Please try again.');
    } catch (err) {
      console.error(err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-24 animate-in fade-in slide-in-from-bottom duration-700">
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white">
          Secure your <span className="text-amber-400">Consultation</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
          Choose your preferred way to connect.
        </p>

        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={() => setView('automatic')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === 'automatic' ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Auto Scheduler
          </button>
          <button 
            onClick={() => setView('manual')}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === 'manual' ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Direct Inquiry
          </button>
        </div>
      </header>

      <div className="glass-card rounded-[3.5rem] overflow-hidden border-white/10 shadow-3xl bg-slate-900/40 min-h-[600px] flex items-center justify-center">
        {view === 'automatic' ? (
          <div className="w-full p-6 md:p-10">
            <div className="mb-6 text-center space-y-3">
              <h3 className="text-2xl font-bold text-white">Book with Calendly</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Choose a time that works for you. Your booking is confirmed instantly.
              </p>
            </div>
            <div
              id="calendly-root"
              className="rounded-3xl overflow-hidden border border-white/10 bg-slate-950"
              style={{ minWidth: '320px', height: '700px' }}
            />
          </div>
        ) : (
          <div className="w-full max-w-lg p-8 md:p-12">
            {submitted ? (
              <div className="text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Inquiry Sent</h3>
                <p className="text-slate-400">I'll review your message and get back to you shortly.</p>
                <button onClick={() => setSubmitted(false)} className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">Send another</button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Name</label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Project Summary</label>
                  <textarea
                    required
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-400 resize-none transition-all"
                  />
                </div>
                <button type="submit" disabled={loading} className="primary-btn w-full py-5 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black shadow-2xl">
                  {loading ? 'Processing...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-12 text-center text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
        Choose your integration when you're ready.
      </div>
    </div>
  );
};

export default BookingSystem;
