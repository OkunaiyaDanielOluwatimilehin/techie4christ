/**
 * TECHIE 4 CHRIST - PERSONAL BLOG & PORTFOLIO
 * Integrated with Local Storage CMS & Contentful
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navigation from './components/Navigation';
import Contact from './components/Contact';
import About from './components/About';
import MailerLiteEmbed from './components/MailerLiteEmbed';
import { SocialIcon } from './components/SocialIcons';
import {
  DEFAULT_SITE_SETTINGS,
  SOCIAL_LINKS
} from './constants';
import { Asset, BlogPost, YouTubeVideo, SiteSettings, PodcastEpisode, InternalArticle } from './types';
import { contentfulService } from './services/contentfulService';
import { fetchRSSFeed, fetchPodcastFeed } from './services/rssService';
import { addComment, addShare, getArticleEngagement, listComments, toggleLike } from './services/engagementService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local Persistence
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [articles, setArticles] = useState<InternalArticle[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);

  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [podcastPage, setPodcastPage] = useState(1);
  const [blogPage, setBlogPage] = useState(1);
  const [articleFilter, setArticleFilter] = useState('All');
  const [assetFilter, setAssetFilter] = useState('All');
  const [activeArticle, setActiveArticle] = useState<InternalArticle | null>(null);
  const [engagement, setEngagement] = useState({ likeCount: 0, shareCount: 0, liked: false });
  const [comments, setComments] = useState<{ id: string; name: string; message: string; created_at: string }[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', message: '' });
  const [promoIndex, setPromoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const PODCASTS_PER_PAGE = 5;
  const totalPodcastPages = Math.max(1, Math.ceil(podcastEpisodes.length / PODCASTS_PER_PAGE));
  const pagedPodcastEpisodes = podcastEpisodes.slice(
    (podcastPage - 1) * PODCASTS_PER_PAGE,
    podcastPage * PODCASTS_PER_PAGE
  );

  // Persistence Effects
  useEffect(() => setPodcastPage(1), [podcastEpisodes.length]);
  useEffect(() => setBlogPage(1), [blogPosts.length, isMobile]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(media.matches);
    onChange();
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/articles/')) {
      setActiveTab('article');
      return;
    }
    if (path === '/articles') return setActiveTab('articles');
    if (path === '/resources') return setActiveTab('resources');
    if (path === '/videos') return setActiveTab('videos');
    if (path === '/podcasts') return setActiveTab('podcasts');
    if (path === '/portfolio') return setActiveTab('portfolio');
    if (path === '/substack') return setActiveTab('substack');
    if (path === '/policy') return setActiveTab('policy');
    if (path === '/contact') return setActiveTab('contact');
    if (path === '/about') return setActiveTab('about');
    setActiveTab('home');
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab !== 'article') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleNavClick('articles');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeTab]);


  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const [
          cfSettings,
          cfArticles,
          cfAssets,
          cfVideos,
          cfSubstackFeeds,
          cfPodcastFeeds,
          cfPortfolioItems,
        ] = await Promise.all([
          contentfulService.getSettings(),
          contentfulService.getArticles(),
          contentfulService.getAssets(),
          contentfulService.getVideos(),
          contentfulService.getSubstackFeeds(),
          contentfulService.getPodcastFeeds(),
          contentfulService.getPortfolioItems(),
        ]);

        if (cfSettings) setSettings(cfSettings);
        if (cfArticles) setArticles(cfArticles);
        if (cfAssets) setAssets(cfAssets);
        if (cfVideos) setVideos(cfVideos);
        if (cfPortfolioItems) setPortfolioItems(cfPortfolioItems);

        const substackFeed = cfSubstackFeeds?.[0]?.rssUrl || '';
        const podcastFeed = cfPodcastFeeds?.[0]?.rssUrl || '';
        if (!podcastFeed) console.warn('[Podcast] No podcastFeed URL found in Contentful.');

        const [rssPosts, rssPods] = await Promise.all([
          substackFeed ? fetchRSSFeed(substackFeed, 'Substack') : Promise.resolve([]),
          podcastFeed ? fetchPodcastFeed(podcastFeed) : Promise.resolve([]),
        ]);

        if (rssPosts.length) setBlogPosts(rssPosts);
        if (rssPods.length) setPodcastEpisodes(rssPods);
      } catch (err) {
        console.error("Contentful error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);


  useEffect(() => {
    if (!location.pathname.startsWith('/articles/')) return;
    const slug = decodeURIComponent(location.pathname.replace('/articles/', '').trim());
    if (!slug) return;
    const found = articles.find((a) => a.slug === slug || a.id === slug);
    if (found) {
      openArticle(found, false);
    }
  }, [location.pathname, articles]);


  const loadEngagementForArticle = async (article: InternalArticle) => {
    try {
      const [engagementData, commentList] = await Promise.all([
        getArticleEngagement(article.id),
        listComments(article.id),
      ]);
      setEngagement(engagementData);
      setComments(commentList);
    } catch (err) {
      console.error('Engagement load failed', err);
    }
  };

  const openArticle = async (article: InternalArticle, navigateTo = true) => {
    setActiveArticle(article);
    setActiveTab('article');
    setCommentForm({ name: '', message: '' });
    if (navigateTo) {
      const slug = article.slug || article.id;
      navigate(`/articles/${encodeURIComponent(slug)}`);
    }
    await loadEngagementForArticle(article);
  };

  const handleShare = async (article: InternalArticle) => {
    const shareData = {
      title: article.title,
      text: article.content?.slice(0, 140) || article.title,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard.');
      }
      await addShare(article.id, 'web');
      const data = await getArticleEngagement(article.id);
      setEngagement(data);
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const decodeHtml = (value: string) =>
    value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

  const formatArticleContent = (content: string) => {
    const trimmed = content?.trim();
    if (!trimmed) return '<p>No content available yet.</p>';

    if (/<([a-z][\s\S]*?)>/i.test(trimmed)) return trimmed;

    if (/&lt;\/?[a-z][\s\S]*?&gt;/i.test(trimmed)) {
      return decodeHtml(trimmed);
    }

    const escaped = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withParagraphs = escaped
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br />');
    return `<p>${withParagraphs}</p>`;
  };

  const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const getPreviewText = (value: string, max = 160) => {
    const plain = stripHtml(value || '');
    if (!plain) return '';
    return plain.length > max ? `${plain.slice(0, max)}...` : plain;
  };

  const renderHeroTitle = (title: string) => {
    const target = 'Timilehin-Daniels';
    const parts = title.split(target);
    if (parts.length === 1) return title;
    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={`${part}-${idx}`}>
            {part}
            {idx < parts.length - 1 && <span className="text-amber-400">{target}</span>}
          </React.Fragment>
        ))}
      </>
    );
  };

  const openPromoLink = (href: string) => {
    if (!href) return;
    if (href.startsWith('/')) {
      navigate(href);
    } else {
      window.open(href, '_blank', 'noreferrer');
    }
  };

  const handleLike = async () => {
    if (!activeArticle) return;
    await toggleLike(activeArticle.id);
    const data = await getArticleEngagement(activeArticle.id);
    setEngagement(data);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle) return;
    if (!commentForm.name.trim() || !commentForm.message.trim()) return;
    await addComment(activeArticle.id, commentForm.name.trim(), commentForm.message.trim());
    setCommentForm({ name: '', message: '' });
    const list = await listComments(activeArticle.id);
    setComments(list);
  };

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    const tabToPath: Record<string, string> = {
      home: '/',
      articles: '/articles',
      resources: '/resources',
      videos: '/videos',
      podcasts: '/podcasts',
      portfolio: '/portfolio',
      substack: '/substack',
      policy: '/policy',
      contact: '/contact',
      about: '/about',
    };
    const path = tabToPath[tabId];
    if (path && location.pathname !== path) {
      navigate(path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const cleanUrl = url.trim();
    const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

    const watchMatch = cleanUrl.match(/[-&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

    const embedMatch = cleanUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;

    const shortsMatch = cleanUrl.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

    return null;
  };

  const getYouTubeThumbnailUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.trim();
    const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://img.youtube.com/vi/${shortMatch[1]}/maxresdefault.jpg`;
    const watchMatch = cleanUrl.match(/[-&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://img.youtube.com/vi/${watchMatch[1]}/maxresdefault.jpg`;
    const embedMatch = cleanUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return `https://img.youtube.com/vi/${embedMatch[1]}/maxresdefault.jpg`;
    const shortsMatch = cleanUrl.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return `https://img.youtube.com/vi/${shortsMatch[1]}/maxresdefault.jpg`;
    return '';
  };

  const articleCategories = ['All', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))];
  const filteredArticles = articleFilter === 'All'
    ? articles
    : articles.filter(a => a.category === articleFilter);

  const assetCategories = ['All', ...Array.from(new Set(assets.map(a => a.category).filter(Boolean)))];
  const filteredAssets = assetFilter === 'All'
    ? assets
    : assets.filter(a => a.category === assetFilter);

  const getAssetPaidState = (asset: Asset) => {
    if (typeof asset.isPaid === 'boolean') return asset.isPaid;
    if (typeof asset.isPaid === 'string') return /^yes$/i.test(asset.isPaid.trim());
    const price = asset.price?.trim();
    if (!price) return false;
    return !/^free$/i.test(price);
  };

  const getAssetPriceLabel = (asset: Asset) => {
    const price = asset.price?.trim();
    if (price) {
      if (getAssetPaidState(asset) && /^free$/i.test(price)) return 'Paid';
      return price;
    }
    return getAssetPaidState(asset) ? 'Paid' : 'Free';
  };

  const ArrowRight = ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );

  const ArrowLeft = ({ className = 'w-3 h-3' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 12H5m7-7-7 7 7 7" />
    </svg>
  );


  const relatedArticles = activeArticle
    ? articles
        .filter((article) => article.id !== activeArticle.id)
        .filter((article) => article.category === activeArticle.category)
        .slice(0, 3)
    : [];

  const BLOGS_PER_PAGE = 6;
  const totalBlogPages = Math.max(1, Math.ceil(blogPosts.length / BLOGS_PER_PAGE));
  const pagedBlogPosts = blogPosts.slice((blogPage - 1) * BLOGS_PER_PAGE, blogPage * BLOGS_PER_PAGE);


  const promoItems = useMemo(() => {
    const items = [] as Array<{
      id: string;
      title: string;
      description: string;
      cta: string;
      href: string;
      badge: string;
      image?: string;
    }>;

    if (articles[0]) {
      items.push({
        id: `promo-article-${articles[0].id}`,
        title: articles[0].title,
        description: getPreviewText(articles[0].content, 140),
        cta: 'Read Article',
        href: `/articles/${encodeURIComponent(articles[0].slug || articles[0].id)}`,
        badge: 'Featured Article',
        image: articles[0].thumbnail,
      });
    }

    if (blogPosts[0]) {
      items.push({
        id: `promo-substack-${blogPosts[0].id}`,
        title: blogPosts[0].title,
        description: getPreviewText(blogPosts[0].content, 140),
        cta: 'Read on Substack',
        href: blogPosts[0].link,
        badge: 'Latest Newsletter',
        image: blogPosts[0].thumbnail,
      });
    }

    if (podcastEpisodes[0]) {
      items.push({
        id: `promo-podcast-${podcastEpisodes[0].id}`,
        title: podcastEpisodes[0].title,
        description: getPreviewText(podcastEpisodes[0].description, 140),
        cta: 'Listen Now',
        href: podcastEpisodes[0].link,
        badge: 'Podcast Spotlight',
        image: podcastEpisodes[0].thumbnail,
      });
    }

    if (assets[0]) {
      items.push({
        id: `promo-asset-${assets[0].id}`,
        title: assets[0].name,
        description: getPreviewText(assets[0].description, 140),
        cta: 'Get Resource',
        href: assets[0].externalUrl,
        badge: 'Resource Drop',
        image: assets[0].image,
      });
    }

    if (videos[0]) {
      items.push({
        id: `promo-video-${videos[0].id}`,
        title: videos[0].title,
        description: 'Watch the latest video teaching and tech insight.',
        cta: 'Watch Video',
        href: '/videos',
        badge: 'Video Highlight',
        image: getYouTubeThumbnailUrl(videos[0].url),
      });
    }

    return items;
  }, [articles, assets, blogPosts, podcastEpisodes, videos]);

  useEffect(() => {
    if (promoItems.length <= 1) return;
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoItems.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [promoItems.length]);

  return (
    <div className="min-h-screen pt-16 flex flex-col bg-white text-slate-900">
      <Navigation activeTab={activeTab} setActiveTab={handleNavClick} />

      <main className="flex-1 w-full overflow-hidden">
        {activeTab !== 'home' && (
          <div className="max-w-7xl mx-auto px-6 pt-6 hidden md:flex">
            <button
              onClick={() => handleNavClick('home')}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white inline-flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Home</span>
            </button>
          </div>
        )}
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom duration-1000 space-y-24 pb-24">
            
            {/* 1. HERO SECTION - Preserved exactly */}
            <section id="hero" className="relative max-w-7xl mx-auto px-6 pt-20 lg:pt-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"></div>
              </div>
              <div
                className="relative group max-w-sm mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: '120ms' }}
              >
                <div className="absolute inset-0 bg-amber-400/10 blur-[60px] rounded-full scale-110"></div>
                <div className="aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-slate-900 relative hero-glow">
                  <img
                    src={settings.heroImage || DEFAULT_SITE_SETTINGS.heroImage}
                    alt={settings.name}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_SITE_SETTINGS.heroImage;
                    }}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                  />
                </div>
              </div>
              <div
                className="space-y-6 md:space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: '260ms' }}
              >
                <span className="text-amber-400 font-extrabold uppercase tracking-[0.3em] text-[10px] hero-kicker-animate">{settings.heroSubtitle}</span>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter leading-tight text-white hero-title-animate">
                  {renderHeroTitle(settings.heroTitle)}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-light leading-relaxed">
                  Faith-driven strategy, tech-built. I help ministries turn vision into scalable systems that nurture people and multiply impact.
                </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <button onClick={() => handleNavClick('articles')} className="btn-amber pulse-btn px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-widest font-bold">Read Articles</button>
                  <button onClick={() => handleNavClick('resources')} className="btn-ghost px-8 sm:px-10 py-3 sm:py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-widest font-bold">Browse Assets</button>
              </div>
                <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
                  {SOCIAL_LINKS.map(link => (
                    <a key={`hero-${link.platform}`} href={link.url} target="_blank" className="text-slate-500 hover:text-white transition-colors">
                      <SocialIcon platform={link.platform} className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>

            {/* Promo Banner */}
            {promoItems.length > 0 && (
              <section id="promo-banner" className="w-full promo-banner">
                <div
                  className="w-full relative overflow-hidden border-y border-white/10 themed-gradient py-16 md:py-20 lg:py-24"
                  style={{
                    backgroundImage: promoItems[promoIndex]?.image
                      ? `linear-gradient(120deg, rgba(2,6,23,0.9), rgba(2,6,23,0.7)), url(${promoItems[promoIndex].image})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div
                    className="max-w-7xl mx-auto px-6 min-h-[300px] md:min-h-[360px] lg:min-h-[420px] flex flex-col justify-center cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => openPromoLink(promoItems[promoIndex].href)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openPromoLink(promoItems[promoIndex].href);
                    }}
                  >
                  <div className="absolute -top-24 -right-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
                  <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl"></div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 w-full">
                    <div className="space-y-4 max-w-2xl">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
                        {promoItems[promoIndex].badge}
                      </span>
                      <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                        {promoItems[promoIndex].title}
                      </h2>
                      <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                        {promoItems[promoIndex].description}
                      </p>
                    </div>

                  </div>

                  <div className="mt-auto pt-8 flex w-full items-center justify-center gap-2">
                    {promoItems.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPromoIndex(idx);
                        }}
                        className={`h-2 w-6 rounded-full transition-all ${idx === promoIndex ? 'bg-amber-400' : 'bg-white/10 hover:bg-white/30'}`}
                        aria-label={`Go to promo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
                </div>
              </section>
            )}

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>
            {/* 2. MAIN ARTICLES (INTERNAL ARCHIVE) */}
            <section id="internal-articles" className="max-w-7xl mx-auto px-6 home-section">
               <div className="flex items-end justify-between mb-12">
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Internal <span className="text-indigo-400">Archive</span></h2>
                  <p className="text-slate-500 mt-2 font-light">Deep dives and long-form essays curated here.</p>
                </div>
                <button onClick={() => handleNavClick('articles')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white pb-1 border-b border-transparent hover:border-indigo-400 transition-all inline-flex items-center gap-2">Full Archive <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 reveal-grid">
                {articles.slice(0, 2).map(art => (
                  <div key={art.id} className="glass-card archive-card rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start group border-white/5">
                    <div className="w-full md:w-56">
                      <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                        <img src={art.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
                      </div>
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{art.category}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{art.pubDate}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-white group-hover:text-indigo-300 transition-colors">{art.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{getPreviewText(art.content, 140)}</p>
                      <button onClick={() => openArticle(art)} className="text-white text-[10px] font-black uppercase tracking-widest pt-2 flex items-center gap-2 group/btn">
                        Read Story <span className="group-hover/btn:translate-x-1 transition-transform"><ArrowRight className="w-3 h-3" /></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>

            {/* 3. RESOURCE HUB */}
            <section id="resource-hub-section" className="max-w-7xl mx-auto px-6 home-section">
               <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Resource <span className="text-amber-400">Hub</span></h2>
                  <p className="text-slate-500 mt-2 font-light">Templates, media kits, and blueprints for your ministry.</p>
                </div>
                <button onClick={() => handleNavClick('resources')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all inline-flex items-center gap-2">Explore Full Hub <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7 reveal-grid">
                {assets.slice(0, 3).map(asset => (
                  <div key={asset.id} className="glass-card asset-card rounded-xl overflow-hidden flex flex-col border-white/5 group">
                     <div className="aspect-[16/11] overflow-hidden">
                       <img src={asset.image} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
                     </div>
                     <div className="p-5 space-y-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-center gap-2">
                           <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">{asset.name}</h4>
                           <div className="flex items-center gap-2">
                             {getAssetPaidState(asset) && (
                               <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                                 Paid
                               </span>
                             )}
                             {getAssetPriceLabel(asset) !== 'Paid' && (
                               <span className="text-[10px] font-black text-amber-400 bg-amber-400/5 border border-amber-400/20 px-3 py-1 rounded-full">
                                 {getAssetPriceLabel(asset)}
                               </span>
                             )}
                           </div>
                        </div>
                        <p className="text-slate-500 text-sm flex-1 font-light leading-relaxed line-clamp-3">{asset.description}</p>
                        <a href={asset.externalUrl} target="_blank" className="primary-btn w-full py-3 rounded-lg text-center text-[10px] uppercase font-black tracking-widest mt-4">Get Access</a>
                     </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>

            {/* 4. SUBSTACK ARTICLES */}
            <section id="substack-feed" className="max-w-7xl mx-auto px-6 home-section">
              <div className="flex items-end justify-between mb-12">
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Substack <span className="text-orange-400">Feed</span></h2>
                  <p className="text-slate-500 mt-2 font-light">The latest newsletter reflections on faith and tech.</p>
                </div>
                <a href={settings.substackUrl} target="_blank" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white pb-1 border-b border-transparent hover:border-orange-400 transition-all inline-flex items-center gap-2">Visit Substack <ArrowRight className="w-3 h-3" /></a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7 reveal-grid">
                {blogPosts.slice(0, 3).map(post => (
                  <a key={post.id} href={post.link} target="_blank" rel="noreferrer" className="glass-card rounded-2xl overflow-hidden group border-white/5 flex flex-col h-full">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={post.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col space-y-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{post.pubDate}</span>
                      <h3 className="text-lg font-bold text-white leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{post.content}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>

            {/* 5. THE PODCAST */}
            <section id="podcast-hub" className="bg-slate-900/30 border-y border-white/5 home-section">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
                  <div className="space-y-6">
                    <span className="text-emerald-400 font-extrabold uppercase tracking-widest text-[10px]">On Air</span>
                    <h2 className="text-5xl font-extrabold tracking-tighter text-white leading-tight">The <span className="text-emerald-400">T4C</span> Podcast</h2>
                    <p className="text-slate-400 font-light text-lg">Conversations at the intersection of Kingdom mission and digital innovation.</p>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => handleNavClick('podcasts')} className="primary-btn px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black">All Episodes</button>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                    {podcastEpisodes.slice(0, 2).map(ep => (
                      <div key={ep.id} className="p-6 glass-card rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center border-white/5 hover:border-emerald-400/30 transition-all">
                        <div className="flex-1 min-w-0 space-y-2">
                           <div className="flex justify-between items-center gap-4">
                              <h4
                                className="text-xl font-bold text-white line-clamp-2 break-words overflow-hidden"
                                style={{ overflowWrap: 'anywhere' }}
                              >
                                {ep.title}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{ep.pubDate}</span>
                            </div>
                           <p
                             className="text-slate-500 text-sm line-clamp-2 font-light break-words overflow-hidden"
                             style={{ overflowWrap: 'anywhere' }}
                           >
                             {ep.description}
                           </p>
                           <a href={ep.link} target="_blank" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 pt-2 group">
                             Listen Now <span className="group-hover:translate-x-1 transition-transform"><ArrowRight className="w-3 h-3" /></span>
                           </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>

            {/* 6. VIDEO LIBRARY */}
            <section id="videos-section" className="max-w-7xl mx-auto px-6 home-section">
              <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Video <span className="text-indigo-400">Library</span></h2>
                  <p className="text-slate-500 mt-2 font-light">Equipping you with tech tools for the harvest.</p>
                </div>
                <button onClick={() => handleNavClick('videos')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all inline-flex items-center gap-2">Watch All <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 reveal-grid">
                {videos.slice(0, 1).map(v => (
                  <div key={v.id} className="glass-card rounded-[3rem] overflow-hidden bg-black/50 border-white/5 group">
                    <div className="aspect-video relative">
                       <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(v.url) || ""} frameBorder="0" allowFullScreen></iframe>
                    </div>
                    <div className="p-8">
                      <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{v.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6"><div className="section-divider"></div></div>

            {/* 7. CTA - NEWSLETTER */}
            <section id="cta-newsletter" className="max-w-7xl mx-auto px-6 home-section">
              <div className="glass-card relative overflow-hidden rounded-[1.75rem] p-10 lg:p-14 border-white/10 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-center themed-gradient">
                <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl"></div>
                <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl"></div>
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-orange-400 border border-white/5">
                    <SocialIcon platform="substack" className="w-7 h-7" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Join the Community</h2>
                    <p className="text-slate-400 font-light">The latest newsletter reflections on faith and tech.</p>
                  </div>
                  <div className="w-full max-w-md rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
                    <MailerLiteEmbed />
                  </div>
                </div>
                <div className="w-full flex flex-col gap-6 lg:pl-10 lg:border-l lg:border-white/10">
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-6">
                    <div className="space-y-3 text-left">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
                        Support The Mission
                      </span>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        Partner with the work
                      </h3>
                      <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                        Your giving helps fuel faith-driven tech resources, content, and community initiatives.
                      </p>
                      <a
                        href="https://flutterwave.com/donate/tb2awms6p266"
                        target="_blank"
                        rel="noreferrer"
                        className="primary-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black"
                      >
                        Give Now
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ARCHIVE / FEED PAGES */}
        {activeTab === 'articles' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom">
            <h1 className="text-6xl font-extrabold tracking-tighter text-white mb-16">The <span className="text-indigo-400">Archive</span></h1>
            <div className="flex flex-wrap gap-3 mb-10">
              {articleCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setArticleFilter(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${articleFilter === cat ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:border-amber-400/40'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 reveal-grid">
              {filteredArticles.map(art => (
                <div key={art.id} className="glass-card preview-card archive-card rounded-xl overflow-hidden flex flex-col group border-white/5">
                   <div className="aspect-video overflow-hidden"><img src={art.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" /></div>
                   <div className="p-8 space-y-4">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">{art.pubDate} - {art.category}</span>
                      <h3 className="text-2xl font-bold text-white leading-tight group-hover:text-amber-400 transition-colors">{art.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{getPreviewText(art.content, 180)}</p>
                      <button
                        onClick={() => openArticle(art)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-[0_10px_24px_rgba(251,191,36,0.25)]"
                      >
                        Read Full Piece <ArrowRight className="w-3 h-3" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'article' && activeArticle && (
          <div className="w-full px-6 py-24 animate-in fade-in slide-in-from-bottom">
            <div className="flex flex-col gap-6 article-shell rounded-[2.5rem] p-8 md:p-12 lg:p-16 w-full">
              <div className="flex items-center justify-start">
                <button
                  onClick={() => handleNavClick('articles')}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Articles
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-amber-400 uppercase">{activeArticle.category}</span>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">{activeArticle.title}</h1>
                <p className="text-slate-500 text-xs uppercase tracking-widest">{activeArticle.pubDate}</p>


                <div className="flex items-center gap-4 pt-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-slate-900">
                    <img
                      src={settings.heroImage || DEFAULT_SITE_SETTINGS.heroImage}
                      alt={settings.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{settings.name}</p>
                    <p className="text-xs text-slate-500">Author</p>
                  </div>
                </div>
              </div>

              {activeArticle.thumbnail && (
                <div className="aspect-[16/9] rounded-[2rem] overflow-hidden border border-white/5">
                  <img src={activeArticle.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div
                className="article-body text-slate-200"
                dangerouslySetInnerHTML={{ __html: formatArticleContent(activeArticle.content) }}
              />

              <div className="border-t border-white/10 pt-6 mt-8">
                {relatedArticles[0] && (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Article</span>
                    <button
                      onClick={() => openArticle(relatedArticles[0])}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 inline-flex items-center gap-2"
                    >
                      {relatedArticles[0].title}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={handleLike}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all inline-flex items-center gap-2 ${engagement.liked ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 20.729l-1.449-1.31C5.4 15.36 2 12.28 2 8.498 2 5.42 4.42 3 7.498 3c1.74 0 3.41.81 4.503 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.498c0 3.782-3.4 6.862-8.552 10.93l-1.447 1.301z"/></svg>
                    {engagement.liked ? 'Loved' : 'Love'}
                  </span>
                  <span className="text-slate-500">-</span>
                  <span>{engagement.likeCount}</span>
                </button>
                <button
                  onClick={() => handleShare(activeArticle)}
                  className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-slate-300 hover:text-white inline-flex items-center gap-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 10v8a1 1 0 001 1h8a1 1 0 001-1v-8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15V3m0 0l-4 4m4-4l4 4" />
                    </svg>
                    Share
                  </span>
                  <span className="text-slate-500">-</span>
                  <span>{engagement.shareCount}</span>
                </button>
              </div>

              <div className="border-t border-white/10 pt-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Comments</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{comments.length} total</span>
                </div>
                <form onSubmit={handleCommentSubmit} className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3">
                  <input
                    value={commentForm.name}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-black placeholder:text-slate-500 focus:border-amber-400 outline-none"
                  />
                  <input
                    value={commentForm.message}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Write a comment..."
                    className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-black placeholder:text-slate-500 focus:border-amber-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="primary-btn px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black w-full md:w-auto"
                  >
                    Post Comment
                  </button>
                </form>

                <div className="space-y-3">
                  {comments.length === 0 && (
                    <p className="text-sm text-slate-500">No comments yet. Be the first to share your thoughts.</p>
                  )}
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
                        <span className="font-bold text-black">{comment.name}</span>
                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-black mt-2">{comment.message}</p>
                    </div>
                  ))}
                </div>
              </div>


              {relatedArticles.length > 0 && (
                <div className="border-t border-white/10 pt-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Related Articles</h3>
                    <button
                      onClick={() => handleNavClick('articles')}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                    >
                      View All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-grid">
                    {relatedArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => openArticle(article)}
                        className="text-left glass-card preview-card rounded-xl overflow-hidden border-white/5 hover:border-amber-400/30 transition-all"
                      >
                        {article.thumbnail && (
                          <div className="aspect-[16/9] overflow-hidden">
                            <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 space-y-2">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">{article.category}</span>
                          <h4 className="text-lg font-bold text-white leading-tight">{article.title}</h4>
                          <p className="text-xs text-slate-500">{article.pubDate}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'substack' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-white">The <span className="text-orange-400">Newsletter</span></h1>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setBlogPage((p) => Math.max(1, p - 1))}
                    disabled={blogPage === 1}
                    className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-400/50"
                  >
                    Prev
                  </button>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Page {blogPage} of {totalBlogPages}</div>
                  <button
                    onClick={() => setBlogPage((p) => Math.min(totalBlogPages, p + 1))}
                    disabled={blogPage === totalBlogPages}
                    className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-400/50"
                  >
                    Next
                  </button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 reveal-grid">
              {pagedBlogPosts.map(post => (
                <a key={post.id} href={post.link} target="_blank" rel="noreferrer" className="glass-card preview-card rounded-xl overflow-hidden group border-white/5">
                   <div className="aspect-video overflow-hidden"><img src={post.thumbnail} className="w-full h-full object-cover" alt="" /></div>
                   <div className="p-8 space-y-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{post.pubDate}</span>
                      <h3 className="text-xl font-bold text-white leading-tight group-hover:text-amber-400 transition-colors">{post.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2">{post.content}</p>
                   </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* HUB PAGES */}
        {activeTab === 'videos' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom">
             <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
               <h1 className="text-6xl font-extrabold tracking-tighter text-white">The <span className="text-indigo-400">Library</span></h1>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-grid">
                {videos.map(v => (
                  <div key={v.id} className="glass-card preview-card rounded-xl overflow-hidden bg-black border-white/5">
                    <div className="aspect-video">
                       <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(v.url) || ""} frameBorder="0" allowFullScreen></iframe>
                    </div>
                    <div className="p-5"><h4 className="text-lg font-bold text-white">{v.title}</h4></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'podcasts' && (
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-24 animate-in fade-in slide-in-from-bottom">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 md:gap-8 mb-10 md:mb-16">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
                  Spotify Series
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white">The <span className="text-emerald-400">Podcast</span></h1>
                <p className="text-slate-400 max-w-2xl text-sm md:text-base">A curated audio stream of faith, tech, and creative mission. Fresh episodes with clean spacing and focus.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setPodcastPage((p) => Math.max(1, p - 1))}
                  disabled={podcastPage === 1}
                  className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400/50"
                >
                  Prev
                </button>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Page {podcastPage} of {totalPodcastPages}</div>
                <button
                  onClick={() => setPodcastPage((p) => Math.min(totalPodcastPages, p + 1))}
                  disabled={podcastPage === totalPodcastPages}
                  className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-400/50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:gap-10 reveal-grid">
              {pagedPodcastEpisodes.map(ep => (
                <article key={ep.id} className="glass-card preview-card rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col lg:flex-row gap-6 md:gap-10 items-start border border-white/5 hover:border-emerald-400/30 transition-all">
                  <div className="relative hidden md:block">
                    <div className="absolute -inset-4 rounded-[2.5rem] bg-emerald-500/10 blur-2xl"></div>
                  </div>
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{ep.pubDate}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Episode</span>
                    </div>
                    <h4
                      className="text-xl md:text-3xl font-bold text-white leading-tight line-clamp-2 break-words overflow-hidden"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {ep.title}
                    </h4>
                    <p
                      className="text-slate-400 text-sm md:text-base leading-relaxed line-clamp-3 break-words overflow-hidden"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {ep.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <a href={ep.link} target="_blank" className="primary-btn px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black">Listen on Spotify</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom">
             <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
               <h1 className="text-6xl font-extrabold tracking-tighter text-white">Digital <span className="text-amber-400">Hub</span></h1>
             </div>
             <div className="flex flex-wrap gap-3 mb-10">
              {assetCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setAssetFilter(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${assetFilter === cat ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:border-amber-400/40'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 reveal-grid">
                {filteredAssets.map(asset => (
                  <div key={asset.id} className="glass-card preview-card asset-card rounded-xl overflow-hidden border-white/5 flex flex-col">
                     <div className="aspect-[4/3] overflow-hidden"><img src={asset.image} className="w-full h-full object-cover" alt="" /></div>
                     <div className="p-5 space-y-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-center">
                           <h4 className="text-lg font-bold text-white">{asset.name}</h4>
                           <div className="flex items-center gap-2">
                             {getAssetPaidState(asset) && (
                               <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                                 Paid
                               </span>
                             )}
                             {getAssetPriceLabel(asset) !== 'Paid' && (
                               <span className="text-[10px] font-bold text-amber-400 bg-amber-400/5 px-3 py-1 rounded-full">
                                 {getAssetPriceLabel(asset)}
                               </span>
                             )}
                           </div>
                        </div>
                        <p className="text-slate-500 text-sm flex-1">{asset.description}</p>
                        <a href={asset.externalUrl} target="_blank" className="primary-btn w-full py-4 rounded-lg text-center text-[10px] uppercase font-black tracking-widest mt-6">Get Access</a>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                  Portfolio
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-white">Featured <span className="text-indigo-400">Work</span></h1>
                <p className="text-slate-400 max-w-2xl">Showcasing tools, platforms, and creative builds that serve the mission.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 reveal-grid">
              {portfolioItems.map((item: any) => (
                <a key={item.id} href={item.externalUrl} target="_blank" className="glass-card preview-card rounded-xl overflow-hidden border-white/5 flex flex-col group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
                  </div>
                  <div className="p-5 space-y-3 flex-1 flex flex-col">
                    {item.tag && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{item.tag}</span>
                    )}
                    <h4 className="text-xl font-bold text-white">{item.title}</h4>
                    <p className="text-slate-500 text-sm flex-1">{item.description}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 inline-flex items-center gap-2">Explore Project <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-7xl mx-auto px-6 pt-24">
            <About settings={settings} />
          </div>
        )}
        {activeTab === 'policy' && (
          <div className="max-w-4xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Privacy Policy</h1>
            <p className="text-slate-400 mt-4">
              Your privacy matters. This policy explains what data we collect, how we use it, and the choices you have.
            </p>
            <div className="space-y-6 mt-10 text-slate-300 text-sm leading-relaxed">
              <div>
                <h2 className="text-lg font-bold text-white">Information we collect</h2>
                <p className="mt-2">
                  We collect information you provide directly, such as your name and email when you subscribe or contact us.
                  We may also collect basic analytics data (such as page views and device/browser type) to improve the site.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">How we use information</h2>
                <p className="mt-2">
                  We use your information to deliver newsletters, respond to requests, improve content, and keep the site secure.
                  We do not sell your personal information.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Email subscriptions</h2>
                <p className="mt-2">
                  If you subscribe, you can unsubscribe anytime using the link in our emails. We use trusted email tools to manage subscriptions.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Third-party services</h2>
                <p className="mt-2">
                  We may use third-party services (for example, email providers or analytics tools) that process data on our behalf.
                  These services are required to protect your data and use it only to provide their service.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Your choices</h2>
                <p className="mt-2">
                  You can request access, correction, or deletion of your personal data by contacting us through the site.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Updates</h2>
                <p className="mt-2">
                  We may update this policy from time to time. Material changes will be reflected on this page.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'contact' && <div className="max-w-7xl mx-auto px-6 pt-24"><Contact settings={settings} /></div>}
      </main>



      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-24 px-6 mt-12 text-center md:text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="text-2xl font-bold tracking-tighter text-white">Alexander Timilehin-Daniels</div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">Personal platform for faith-based tech reflections and ministry assets.</p>
            <div className="flex gap-4 justify-center md:justify-start">
               {SOCIAL_LINKS.map(link => (
                 <a key={link.platform} href={link.url} target="_blank" className="text-slate-500 hover:text-white transition-colors">
                   <SocialIcon platform={link.platform} className="w-5 h-5" />
                 </a>
               ))}
            </div>
          </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Sitemap</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <li><button onClick={() => handleNavClick('home')} className="hover:text-amber-400">Home</button></li>
              <li><button onClick={() => handleNavClick('articles')} className="hover:text-amber-400">Articles</button></li>
              <li><button onClick={() => handleNavClick('portfolio')} className="hover:text-amber-400">Portfolio</button></li>
              <li><button onClick={() => handleNavClick('resources')} className="hover:text-amber-400">Resource Hub</button></li>
              <li><button onClick={() => handleNavClick('substack')} className="hover:text-amber-400">Substack</button></li>
              <li><button onClick={() => handleNavClick('videos')} className="hover:text-amber-400">Video Library</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Connect</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <li><button onClick={() => handleNavClick('about')} className="hover:text-amber-400">About</button></li>
              <li><button onClick={() => handleNavClick('contact')} className="hover:text-amber-400">Contact</button></li>
              <li><button onClick={() => handleNavClick('policy')} className="hover:text-amber-400">Privacy Policy</button></li>
            </ul>
          </div>
        </div>
      </footer>

      <Analytics />
    </div>
  );
};

export default App;



