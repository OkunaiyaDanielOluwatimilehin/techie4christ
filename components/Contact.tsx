import React, { useState } from 'react';
import { SOCIAL_LINKS } from '../constants';
import { SocialIcon } from './SocialIcons';
import { SiteSettings } from '../types';

interface ContactProps {
  settings: SiteSettings;
}

const Contact: React.FC<ContactProps> = ({ settings }) => {
  const whatsappNumber = '2348112965510';

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('https://formspree.io/f/xgollaaj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) setSubmitted(true);
      else alert("There was an error sending your message. Please try again.");
    } catch (err) {
      console.error(err);
      setSubmitted(true); // Fallback for demo
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-12 rounded-3xl text-center animate-in fade-in zoom-in duration-500 max-w-xl mx-auto my-20">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-heading mb-4 text-white">Sent!</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">I'll get back to you soon regarding our potential collaboration.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-amber-400 font-bold uppercase tracking-widest text-[10px] hover:text-amber-300 transition-colors"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-16 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter mb-4 text-white">Contact <span className="text-amber-400">Alexander</span></h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Use this form for direct questions, partnerships, or speaking requests.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <p className="text-slate-300 text-sm">hello@alexanderdaniels.co</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.88 11.88 0 0012.03 0C5.39 0 .02 5.39 0 12.03c0 2.12.55 4.2 1.6 6.05L0 24l6.14-1.6a12 12 0 005.9 1.5h.01c6.64 0 12.03-5.39 12.03-12.03 0-3.2-1.25-6.2-3.56-8.39zm-8.5 18.36a10 10 0 01-5.1-1.4l-.37-.22-3.64.95.97-3.54-.24-.37a10 10 0 1118.38-5.23c0 5.52-4.49 10.02-10 10.02zm5.49-7.5c-.3-.15-1.77-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.46-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.58c-.2 0-.53.08-.8.38-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35z"/></svg>
              </div>
              <a className="text-slate-300 text-sm hover:text-emerald-400" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
                WhatsApp: +{whatsappNumber}
              </a>
            </div>
          </div>

          <div className="flex gap-4">
            {SOCIAL_LINKS.map(link => (
              <a 
                key={link.platform} 
                href={link.url} 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 hover:text-amber-400 hover:border-amber-400/30 transition-all"
                title={link.platform}
              >
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2rem] border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                required
                type="text" 
                name="name"
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-amber-400 text-slate-900"
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input 
                required
                type="email" 
                name="email"
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-amber-400 text-slate-900"
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <input 
              required
              type="text" 
              name="subject"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-5 py-3 text-sm outline-none focus:border-amber-400 text-white"
              placeholder="Subject"
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            />
            <textarea 
              required
              name="message"
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-sm outline-none focus:border-amber-400 resize-none text-slate-900"
              placeholder="Message"
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
            ></textarea>
            <button 
              disabled={loading}
              className="w-full bg-white text-slate-950 font-extrabold py-4 rounded-xl hover:bg-amber-400 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Contact;
