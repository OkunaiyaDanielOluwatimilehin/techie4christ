import React, { useState, useEffect } from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('t4c-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('t4c-theme', next);
  };

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

  const navClass = isScrolled
    ? theme === 'dark'
      ? 'bg-slate-950 backdrop-blur-xl border-b border-white/5 py-4'
      : 'bg-white/90 backdrop-blur-xl border-b border-slate-200 py-4'
    : theme === 'dark'
    ? 'bg-slate-950 backdrop-blur-xl border-b border-white/5 py-6'
    : 'bg-white/70 py-6';

  const navLinkClass = (isActive: boolean) =>
    `text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:text-amber-400 ${isActive ? 'text-amber-400' : theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`;

  const dropdownClass =
    theme === 'dark'
      ? 'bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-48 shadow-2xl'
      : 'bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 w-48 shadow-2xl';

  const dropdownItemClass = (isActive: boolean) =>
    `w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
      isActive
        ? 'bg-amber-400 text-slate-950'
        : theme === 'dark'
        ? 'text-slate-400 hover:bg-white/5 hover:text-white'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navClass}`}>
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
                className={navLinkClass(activeTab === item.id)}
              >
                {item.label}
              </button>
            ))}
            
            <div className="relative group" onMouseEnter={() => setIsHubOpen(true)} onMouseLeave={() => setIsHubOpen(false)}>
              <button 
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-1 ${['videos', 'podcasts', 'resources', 'substack'].includes(activeTab) ? 'text-amber-400' : theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}
              >
                Resource Hub
                <svg className={`w-3 h-3 transition-transform ${isHubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
              </button>
              
              <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200 ${isHubOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <div className={dropdownClass}>
                  {hubItems.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleNavClick(item.id)} 
                      className={dropdownItemClass(activeTab === item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${theme === 'dark' ? 'border border-white/10 bg-slate-950 text-slate-200 hover:text-white' : 'border border-slate-200 bg-white/80 text-slate-700 hover:text-slate-900 hover:border-slate-300'}`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314 1.414 1.414m11.314 11.314 1.414 1.414M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              )}
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${theme === 'dark' ? 'border border-white/10 bg-slate-950 text-slate-200 hover:text-white' : 'border border-slate-200 bg-white/80 text-slate-700 hover:text-slate-900 hover:border-slate-300'}`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314 1.414 1.414m11.314 11.314 1.414 1.414M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              )}
            </button>
            <button className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-transform duration-500 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`absolute inset-0 backdrop-blur-2xl flex flex-col items-center justify-center p-10 overflow-y-auto no-scrollbar ${theme === 'dark' ? 'bg-slate-950/98' : 'bg-white/95'}`}>
          <div className="flex flex-col items-center space-y-6 w-full">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`text-2xl font-bold ${activeTab === item.id ? 'text-amber-400' : 'text-slate-400'}`}>{item.label}</button>
            ))}
            <div className="w-full h-px bg-white/5 my-4"></div>
            {hubItems.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`text-xl font-bold ${activeTab === item.id ? 'text-amber-400' : 'text-slate-400'}`}>{item.label}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
