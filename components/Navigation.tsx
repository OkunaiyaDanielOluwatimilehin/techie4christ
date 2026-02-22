
import React, { useState, useEffect } from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
    setIsHubOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'articles', label: 'Articles' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'about', label: 'About' },
  ];

  const hubItems = [
    { id: 'videos', label: 'Videos' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'resources', label: 'Digital Assets' },
    { id: 'substack', label: 'Substack' }
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold cursor-pointer flex items-center gap-2 group" onClick={() => handleNavClick('home')}>
            <span className="text-amber-400 group-hover:scale-110 transition-transform tracking-tight text-white">Techie</span>
            <span className="text-indigo-400 tracking-tight">4 Christ</span>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => handleNavClick(item.id)} 
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:text-amber-400 ${activeTab === item.id ? 'text-amber-400' : 'text-slate-400'}`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="relative group" onMouseEnter={() => setIsHubOpen(true)} onMouseLeave={() => setIsHubOpen(false)}>
              <button 
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-1 ${['videos', 'podcasts', 'resources', 'substack'].includes(activeTab) ? 'text-amber-400' : 'text-slate-400'}`}
              >
                Resource Hub
                <svg className={`w-3 h-3 transition-transform ${isHubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
              
              <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200 ${isHubOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-48 shadow-2xl">
                  {hubItems.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleNavClick(item.id)} 
                      className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === item.id ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => handleNavClick('services')} className="primary-btn px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-[0.1em] uppercase shadow-lg shadow-amber-400/10 active:scale-95">Book Me</button>
          </div>

          <button className="lg:hidden text-slate-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-transform duration-500 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-10 overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center space-y-6 w-full">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`text-2xl font-bold ${activeTab === item.id ? 'text-amber-400' : 'text-slate-400'}`}>{item.label}</button>
            ))}
            <div className="w-full h-px bg-white/5 my-4"></div>
            {hubItems.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`text-xl font-bold ${activeTab === item.id ? 'text-amber-400' : 'text-slate-400'}`}>{item.label}</button>
            ))}
            <div className="w-full h-px bg-white/5 my-4"></div>
            <button onClick={() => handleNavClick('services')} className="primary-btn w-full py-5 rounded-2xl font-bold tracking-widest uppercase mt-8 text-sm">Book Me</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;

