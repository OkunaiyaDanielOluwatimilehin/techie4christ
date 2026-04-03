import React, { useState, useEffect } from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('t4c-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('t4c-theme', theme);
    }
  }, [theme]);

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

  const navIconSet: Record<string, React.ReactNode> = {
    home: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l9-7 9 7v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" />
      </svg>
    ),
    articles: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8M8 12h8M8 8h8M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    ),
    podcasts: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V8a3 3 0 0 0-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12a5 5 0 0 0 10 0" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20h6" />
      </svg>
    ),
    about: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 0c-4 0-6 2-6 6h12c0-4-2-6-6-6z" />
      </svg>
    ),
  };
  const hubIconSet: Record<string, React.ReactNode> = {
    resources: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M6 10h12" />
        <path d="M6 14h12" />
      </svg>
    ),
    videos: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M10 8l6 4-6 4z" fill="currentColor" stroke="none" />
      </svg>
    ),
    portfolio: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <rect x="5" y="8" width="14" height="10" rx="2" />
        <path d="M8 8V6h8v2" />
      </svg>
    ),
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: navIconSet.home },
    { id: 'articles', label: 'Articles', icon: navIconSet.articles },
    { id: 'podcasts', label: 'Podcasts', icon: navIconSet.podcasts },
    { id: 'about', label: 'About', icon: navIconSet.about },
  ];

  const hubItems = [
    { id: 'resources', label: 'Digital Assets', icon: hubIconSet.resources },
    { id: 'videos', label: 'Video Library', icon: hubIconSet.videos },
    { id: 'portfolio', label: 'Portfolio', icon: hubIconSet.portfolio },
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

  const dropdownClass = 'bg-slate-950/95 backdrop-blur-2xl border border-slate-900/60 rounded-2xl p-2 w-56 shadow-[0_20px_120px_rgba(2,6,23,0.65)] text-slate-100';

  const dropdownItemClass = (isActive: boolean) =>
    `w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 ${
      isActive
        ? 'bg-amber-400 text-slate-950'
        : 'text-slate-100 hover:bg-white/10 hover:text-white'
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
                <span className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
            
            <div className="relative group" onMouseEnter={() => setIsHubOpen(true)} onMouseLeave={() => setIsHubOpen(false)}>
              <button
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-1 ${['videos', 'resources', 'portfolio'].includes(activeTab) ? 'text-amber-400' : theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}
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
                      <span className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
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
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-2xl font-bold flex items-center gap-3 ${activeTab === item.id ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
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
