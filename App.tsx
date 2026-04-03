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
import { Asset, YouTubeVideo, SiteSettings, PodcastEpisode, InternalArticle, PortfolioItem } from './types';
import { contentfulService } from './services/contentfulService';
import { fetchPodcastFeed } from './services/rssService';
import { addComment, addShare, getArticleEngagement, listComments, toggleLike } from './services/engagementService';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local Persistence
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [articles, setArticles] = useState<InternalArticle[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);

  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [podcastPage, setPodcastPage] = useState(1);
  const [articleFilter, setArticleFilter] = useState('All');
  const [articleFilterMode, setArticleFilterMode] = useState<'series' | 'tag'>('series');
  const [assetFilter, setAssetFilter] = useState('All');
  const [assetPage, setAssetPage] = useState(0);
  const [activeArticle, setActiveArticle] = useState<InternalArticle | null>(null);
  const [archivePage, setArchivePage] = useState(0);
  const [engagement, setEngagement] = useState({ likeCount: 0, shareCount: 0, liked: false });
  const [comments, setComments] = useState<{ id: string; name: string; message: string; created_at: string }[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', message: '' });
  const [promoIndex, setPromoIndex] = useState(0);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const PODCASTS_PER_PAGE = 5;
  const totalPodcastPages = Math.max(1, Math.ceil(podcastEpisodes.length / PODCASTS_PER_PAGE));
  const pagedPodcastEpisodes = podcastEpisodes.slice(
    (podcastPage - 1) * PODCASTS_PER_PAGE,
    podcastPage * PODCASTS_PER_PAGE
  );

  // Persistence Effects
  useEffect(() => setPodcastPage(1), [podcastEpisodes.length]);

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
          cfPodcastFeeds,
          cfPortfolioItems,
        ] = await Promise.all([
          contentfulService.getSettings(),
          contentfulService.getArticles(),
          contentfulService.getAssets(),
          contentfulService.getVideos(),
          contentfulService.getPodcastFeeds(),
          contentfulService.getPortfolioItems(),
        ]);

        if (cfSettings) setSettings(cfSettings);
        if (cfArticles) setArticles(cfArticles);
        if (cfAssets) setAssets(cfAssets);
        if (cfVideos) setVideos(cfVideos);
        if (cfPortfolioItems) {
          setPortfolioItems(cfPortfolioItems);

          // Enrich items missing an explicit image by pulling `og:image` from the project link.
          // Runs in the background; safe to ignore failures.
          const itemsNeedingPreview = cfPortfolioItems.filter((item: any) => {
            const image = typeof item?.image === 'string' ? item.image.trim() : '';
            const link = typeof item?.externalUrl === 'string' ? item.externalUrl.trim() : '';
            return !image && /^https?:\/\//i.test(link);
          });

          if (itemsNeedingPreview.length) {
            Promise.all(
              itemsNeedingPreview.map(async (item: any) => {
                try {
                  const res = await fetch(`/api/og?url=${encodeURIComponent(item.externalUrl)}`);
                  if (!res.ok) return { id: item.id, image: '' };
                  const data = (await res.json()) as { image?: string };
                  return { id: item.id, image: typeof data.image === 'string' ? data.image : '' };
                } catch {
                  return { id: item.id, image: '' };
                }
              })
            ).then((updates) => {
              const map = new Map(updates.filter((u) => u.image).map((u) => [u.id, u.image]));
              if (map.size === 0) return;
              setPortfolioItems((prev) =>
                prev.map((item: any) => {
                  const nextImage = map.get(item.id);
                  return nextImage ? { ...item, image: nextImage } : item;
                })
              );
            });
          }
        }

        const podcastFeed = cfPodcastFeeds?.[0]?.rssUrl || '';
        if (!podcastFeed) console.warn('[Podcast] No podcastFeed URL found in Contentful.');
        if (podcastFeed) {
          const rssPods = await fetchPodcastFeed(podcastFeed);
          if (rssPods.length) setPodcastEpisodes(rssPods);
        } else {
          setPodcastEpisodes([]);
        }
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
    const slugParameter = decodeURIComponent(location.pathname.replace('/articles/', '').trim());
    if (!slugParameter) return;
    const normalized = slugParameter.trim().toLowerCase();
    const found = articles.find(
      (a) =>
        (a.slug?.trim().toLowerCase() || '') === normalized ||
        a.id === slugParameter ||
        a.id.toLowerCase() === normalized
    );
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
    const slug = article.slug?.trim() || article.id;
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

  const bylineImage =
    settings.heroImage?.trim() ||
    settings.heroImageSecondary?.trim() ||
    '/favicon.ico';

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

  const normalizeSeriesLabel = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed || 'Standalone';
  };

  const getArticleTags = (article: InternalArticle) =>
    (article.tags ?? [])
      .map((tag) => tag?.trim())
      .filter((tag): tag is string => Boolean(tag));

  const getTagCounts = (source: InternalArticle[]) => {
    const counts = new Map<string, number>();
    source.forEach((article) => {
      getArticleTags(article).forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return counts;
  };

  const sortedTagOptions = Array.from(getTagCounts(articles).entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })
    .map(([tag]) => tag);

  const limitedTagOptions = sortedTagOptions.slice(0, 12);

  const seriesOptions = Array.from(
    new Set<string>(articles.map((article) => normalizeSeriesLabel(article.series)))
  ).sort((a, b) => a.localeCompare(b));

  const filteredArticles =
    articleFilter === 'All'
      ? articles
      : articleFilterMode === 'series'
        ? articles.filter((article) => normalizeSeriesLabel(article.series) === articleFilter)
        : articles.filter((article) => getArticleTags(article).includes(articleFilter));

  const currentFilterOptions = articleFilterMode === 'series' ? seriesOptions : limitedTagOptions;

  const ITEMS_PER_PAGE = 9;
  const totalArchivePages = Math.max(1, Math.ceil(filteredArticles.length / ITEMS_PER_PAGE));
  const pagedArticles = filteredArticles.slice(
    archivePage * ITEMS_PER_PAGE,
    (archivePage + 1) * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setArchivePage(0);
  }, [articleFilter, articleFilterMode, filteredArticles.length]);

  const assetPaymentOptions = ['All', 'Free', 'Paid'];
  const filteredAssets = assetFilter === 'All'
    ? assets
    : assets.filter((asset) => getAssetPriceLabel(asset) === assetFilter);

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

  const ASSETS_PER_PAGE = 9;
  const totalAssetPages = Math.max(1, Math.ceil(filteredAssets.length / ASSETS_PER_PAGE));
  const pagedAssets = filteredAssets.slice(
    assetPage * ASSETS_PER_PAGE,
    (assetPage + 1) * ASSETS_PER_PAGE
  );

  useEffect(() => {
    setAssetPage(0);
  }, [assetFilter, filteredAssets.length]);

  const filteredStories = activeTag
    ? articles.filter((article) => article.tags?.includes(activeTag))
    : articles;

  const latestStories = filteredStories.slice(0, 6);

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

  const TagIcon = ({ className = '' }: { className?: string }) => (
    <i className={`fa-solid fa-tag ${className}`.trim()} aria-hidden="true" />
  );

  const PriceIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 3v18M16.5 7.5c0-1.657-2.015-3-4.5-3S7.5 5.843 7.5 7.5 9.515 10.5 12 10.5s4.5 1.343 4.5 3-2.015 3-4.5 3-4.5-1.343-4.5-3" />
    </svg>
  );

  const PortfolioIcon = ({
    tag,
    className = 'w-3.5 h-3.5',
  }: {
    tag?: string;
    className?: string;
  }) => {
    const normalized = tag?.trim().toLowerCase() || '';
    if (normalized.includes('mobile')) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="8" y="2.75" width="8" height="18.5" rx="2" strokeWidth="1.7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M10.75 5.5h2.5M11.25 18.5h1.5" />
        </svg>
      );
    }
    if (normalized.includes('web app') || normalized.includes('website') || normalized.includes('url') || normalized.includes('link')) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="8.25" strokeWidth="1.7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3.75 12h16.5M12 3.75c2.5 2.25 3.75 5 3.75 8.25S14.5 18 12 20.25C9.5 18 8.25 15.25 8.25 12S9.5 6 12 3.75z" />
        </svg>
      );
    }
    if (normalized.includes('software') || normalized.includes('desktop')) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3.75" y="5" width="16.5" height="11.5" rx="1.8" strokeWidth="1.7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 19h6M12 16.5V19" />
        </svg>
      );
    }
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M10 14L21 3M14.5 3H21v6.5M20 14v4.25A1.75 1.75 0 0 1 18.25 20H5.75A1.75 1.75 0 0 1 4 18.25V5.75A1.75 1.75 0 0 1 5.75 4H10" />
      </svg>
    );
  };

  const TagBadge = ({ label }: { label: string }) => (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white transition hover:border-amber-300 hover:bg-amber-400/10 hover:text-white focus-visible:outline focus-visible:outline-amber-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100"
      role="button"
    >
      <TagIcon className="text-[10px]" />
      {label}
    </span>
  );

  const sectionButtonBase =
    'inline-flex items-center justify-center gap-2 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] sm:tracking-[0.28em] transition duration-200';
  const sectionButtonGhost =
    `${sectionButtonBase} border border-white/10 bg-white/5 text-slate-100 hover:border-amber-400/40 hover:bg-white/10 hover:text-white`;
  const sectionButtonPrimary =
    `${sectionButtonBase} bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(251,191,36,0.25)] hover:-translate-y-0.5 hover:bg-amber-300`;
  const sectionButtonEmerald =
    `${sectionButtonBase} border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/40 hover:bg-emerald-400/15`;
  const sectionButtonIndigo =
    `${sectionButtonBase} border border-indigo-400/20 bg-indigo-400/10 text-indigo-300 hover:border-indigo-400/40 hover:bg-indigo-400/15`;

  const tagPalette = [
    'from-amber-400/90 to-amber-300/40 text-slate-900',
    'from-emerald-400/80 to-teal-500/30 text-slate-950',
    'from-fuchsia-400/80 to-indigo-500/40 text-white',
    'from-sky-400/80 to-cyan-500/40 text-slate-950',
    'from-rose-500/80 to-orange-400/50 text-slate-950',
  ];

  const hashTagValue = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const getTagColorClass = (tag: string) => `bg-gradient-to-r ${tagPalette[hashTagValue(tag) % tagPalette.length]}`;

  const applyTagFilter = (tag: string) => {
    setArticleFilterMode('tag');
    setArticleFilter(tag);
    setActiveTag(tag);
    handleNavClick('articles');
  };

  const applySeriesFilter = (series: string) => {
    setArticleFilterMode('series');
    setArticleFilter(series);
    setActiveTag(null);
    handleNavClick('articles');
  };


  const resolvedSeriesLabel = normalizeSeriesLabel(activeArticle?.series);
  const seriesDisplayLabel = activeArticle?.series?.trim() || '';
  const activeArticleTags = activeArticle ? getArticleTags(activeArticle) : [];
  const activeArticleTagSet = new Set(activeArticleTags);

  const relatedSeriesArticles = activeArticle
    ? articles
        .filter((article) => article.id !== activeArticle.id)
        .filter((article) => normalizeSeriesLabel(article.series) === resolvedSeriesLabel)
        .slice(0, 4)
    : [];

  const relatedTagArticles = activeArticle
    ? articles
        .filter((article) => article.id !== activeArticle.id)
        .filter((article) => getArticleTags(article).some((tag) => activeArticleTagSet.has(tag)))
        .slice(0, 4)
    : [];

  const nextArticle = relatedSeriesArticles[0] || relatedTagArticles[0] || null;
  const seriesRecommendations = nextArticle
    ? relatedSeriesArticles.filter((article) => article.id !== nextArticle.id)
    : relatedSeriesArticles;
  const tagRecommendations = nextArticle
    ? relatedTagArticles.filter((article) => article.id !== nextArticle.id)
    : relatedTagArticles;



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
        href: `/articles/${encodeURIComponent(articles[0].slug?.trim() || articles[0].id)}`,
        badge: 'Featured Article',
        image: articles[0].thumbnail,
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
  }, [articles, assets, podcastEpisodes, videos]);

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
          <div className="animate-in fade-in slide-in-from-bottom duration-1000 space-y-10 md:space-y-12 lg:space-y-14 pb-14 md:pb-16 lg:pb-20">
            
            {/* 1. HERO SECTION - Preserved exactly */}
            <section id="hero" className="relative max-w-7xl mx-auto w-full px-5 sm:px-8 pt-16 md:pt-18 lg:pt-28 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
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
                className="space-y-5 md:space-y-7 text-center lg:text-left animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: '260ms' }}
              >
                <span className="text-amber-400 font-extrabold uppercase tracking-[0.3em] text-[10px] hero-kicker-animate">{settings.heroSubtitle}</span>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter leading-tight text-white hero-title-animate">
                  {renderHeroTitle(settings.heroTitle)}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-light leading-relaxed">
                  Faith-driven strategy, tech-built. I help ministries turn vision into scalable systems that nurture people and multiply impact.
                </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <button onClick={() => handleNavClick('articles')} className={`${sectionButtonPrimary} px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm tracking-[0.24em]`}>Read Articles</button>
                  <button onClick={() => handleNavClick('resources')} className={`${sectionButtonGhost} px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm tracking-[0.24em]`}>Browse Assets</button>
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

            {/* Promo Banner */}
            {promoItems.length > 0 && (
              <section id="promo-banner" className="w-full promo-banner">
                <div
                  className="w-full relative overflow-hidden border-y border-white/10 themed-gradient py-12 md:py-16 lg:py-20"
                  style={{
                    backgroundImage: promoItems[promoIndex]?.image
                      ? `linear-gradient(120deg, rgba(2,6,23,0.9), rgba(2,6,23,0.7)), url(${promoItems[promoIndex].image})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div
                    className="max-w-7xl mx-auto w-full px-5 sm:px-8 min-h-[260px] md:min-h-[320px] lg:min-h-[380px] flex flex-col justify-center cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => openPromoLink(promoItems[promoIndex].href)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openPromoLink(promoItems[promoIndex].href);
                    }}
                  >
                  <div className="absolute -top-24 -right-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"></div>
                  <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl"></div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8 w-full">
                    <div className="space-y-3 max-w-2xl">
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

                  <div className="mt-auto pt-6 flex w-full items-center justify-center gap-2">
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
            {/* 2. LATEST STORIES */}
            <section id="latest-stories" className="max-w-7xl mx-auto w-full px-5 sm:px-8 home-section">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6 md:mb-7">
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
                    Latest <span className="text-amber-400">Stories</span>
                  </h2>
                  <p className="text-slate-500 mt-2 font-light">Recent articles served directly from the Contentful archive.</p>
                </div>
                <button
                  onClick={() => { setActiveTag(null); handleNavClick('articles'); }}
                  className={`${sectionButtonGhost} self-start`}
                >
                  View All Articles <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {activeTag && (
                <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  <span>Filtered by</span>
                  <span className="text-white tracking-[0.5em]">{activeTag}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTag(null)}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    Clear tag
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-7 items-stretch">
                {latestStories.length > 0 ? (
                  latestStories.map((art) => {
                    const seriesLabel = art.series?.trim() || 'Standalone';
                    const previewTags = getArticleTags(art).slice(0, 2);
                    return (
                      <article
                        key={art.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openArticle(art)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openArticle(art);
                          }
                        }}
                        className="glass-card preview-card group rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 flex flex-col justify-between transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-amber-400 focus-visible:outline-offset-2"
                      >
                        {art.thumbnail && (
                          <div className="overflow-hidden">
                            <div className="aspect-[4/3] bg-slate-950/80">
                              <img
                                src={art.thumbnail}
                                alt={art.title}
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            </div>
                          </div>
                        )}
                        <div className="p-5 md:p-6 flex-1 flex flex-col gap-3 md:gap-4">
                          <div>
                            <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
                              {seriesLabel}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">{art.title}</h3>
                          {previewTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {previewTags.map((tag) => (
                                <span
                                  key={`${art.id}-${tag}`}
                                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                <TagIcon className="text-slate-400" />
                              </span>
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openArticle(art);
                              }}
                              aria-label={`Read ${art.title}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="glass-card rounded-[1.5rem] border border-dashed border-white/20 bg-slate-900/70 p-8 text-center text-slate-500">
                    No stories match that tag yet. Clear the filter to see more.
                  </div>
                )}
              </div>
            </section>
            <section id="resource-hub-section" className="max-w-7xl mx-auto w-full px-5 sm:px-8 home-section">
               <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 md:mb-7 gap-4">
                <div className="text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">Resource <span className="text-amber-400">Hub</span></h2>
                  <p className="text-slate-500 mt-2 font-light">Templates, media kits, and blueprints for your ministry.</p>
                </div>
                <button onClick={() => handleNavClick('resources')} className={`${sectionButtonGhost} self-start`}>Explore Full Hub <ArrowRight className="w-3 h-3" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 lg:gap-7 reveal-grid items-stretch">
                {assets.slice(0, 3).map(asset => (
                  <article key={asset.id} className="glass-card preview-card group rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 flex flex-col justify-between transition hover:-translate-y-0.5">
                     <div className="overflow-hidden">
                      <div className="aspect-[4/3] bg-slate-950/80">
                       <img src={asset.image} className="w-full h-full object-cover group-hover:scale-105 transition-all" alt="" />
                      </div>
                     </div>
                     <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3 md:gap-4">
                        <h4 className="text-2xl font-bold text-white leading-tight line-clamp-2">{asset.name}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-2">
                          {asset.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                            {getAssetPriceLabel(asset)}
                          </span>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                              <PriceIcon className="h-3.5 w-3.5" />
                            </span>
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              {getAssetPriceLabel(asset)}
                            </span>
                          </div>
                          <a
                            href={asset.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${asset.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                     </div>
                  </article>
                ))}
              </div>
            </section>

            {/* 5. THE PODCAST */}
            <section id="podcast-hub" className="home-section">
              <div className="max-w-7xl mx-auto w-full px-6 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
                  <div className="space-y-5">
                    <span className="text-emerald-400 font-extrabold uppercase tracking-widest text-[10px]">On Air</span>
                    <h2 className="text-5xl font-extrabold tracking-tighter text-white leading-tight">The <span className="text-emerald-400">T4C</span> Podcast</h2>
                    <p className="text-slate-400 font-light text-lg">Conversations at the intersection of Kingdom mission and digital innovation.</p>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleNavClick('podcasts')} className={sectionButtonPrimary}>All Episodes</button>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-5 md:space-y-6">
                    {podcastEpisodes.slice(0, 2).map(ep => (
                      <div key={ep.id} className="glass-card h-full rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-5 items-center text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.5)] hover:border-emerald-400/30 transition-all">
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
                             className="text-slate-400 text-sm line-clamp-2 font-light break-words overflow-hidden"
                             style={{ overflowWrap: 'anywhere' }}
                           >
                             {ep.description}
                           </p>
                           <a href={ep.link} target="_blank" className={`${sectionButtonEmerald} mt-2 w-fit`}>
                             Listen Now <ArrowRight className="w-3 h-3" />
                           </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. VIDEO LIBRARY */}
            <section id="videos-section" className="max-w-7xl mx-auto w-full px-5 sm:px-8 home-section">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 md:mb-7 gap-4">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white">
                    Video <span className="text-indigo-400">Library</span>
                  </h2>
                  <p className="text-slate-400 mt-2 font-light max-w-2xl">
                    Snippets, teachings, and behind-the-scenes moments pulled straight from the video asset page.
                  </p>
                </div>
                <button
                  onClick={() => handleNavClick('videos')}
                  className={`${sectionButtonIndigo} self-start`}
                >
                  Watch All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 lg:gap-7 reveal-grid items-stretch">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="glass-card h-full rounded-[1.5rem] overflow-hidden border border-white/10 bg-slate-900/80 text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.5)] transition hover:-translate-y-0.5 flex flex-col"
                  >
                      <div className="h-48 w-full overflow-hidden bg-black/70">
                      <iframe
                        width="100%"
                        height="100%"
                        src={getYouTubeEmbedUrl(v.url) || ''}
                        frameBorder="0"
                        allowFullScreen
                        className="h-full w-full"
                        title={v.title}
                      />
                    </div>
                    <div className="p-4 sm:p-5 flex flex-1 flex-col gap-3 md:gap-4">
                      <h4 className="text-lg font-bold text-white">{v.title}</h4>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${sectionButtonIndigo} mt-auto w-fit`}
                      >
                        Watch Now <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. CTA - NEWSLETTER */}
            <section id="cta-newsletter" className="max-w-7xl mx-auto w-full px-5 sm:px-8 home-section">
              <div className="glass-card relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-4 md:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,0.88fr)_1px_minmax(0,1.12fr)] gap-4 md:gap-5 lg:gap-6 items-start shadow-[0_18px_35px_rgba(2,6,23,0.5)]">
                <div className="pointer-events-none absolute -top-16 -right-8 h-36 w-36 rounded-full bg-amber-400/15 blur-3xl"></div>
                <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-indigo-500/15 blur-3xl"></div>
                <div className="relative space-y-2.5 md:space-y-3 max-w-md">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                      Support
                    </span>
                    <h2 className="text-[1.8rem] md:text-[2rem] font-extrabold text-white tracking-tight">Help Sustain the Mission</h2>
                    <p className="text-sm text-slate-300 font-light leading-relaxed max-w-md">
                      Your support helps fund articles, ministry resources, media production, and the quiet work behind this platform so more faith-filled tech content can keep reaching people.
                    </p>
                    <p className="text-sm text-slate-400 font-light leading-relaxed max-w-md">
                      Every gift helps create room for thoughtful writing, practical tools, and community-centered digital ministry work.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <a
                      href="https://flutterwave.com/donate/tb2awms6p266"
                      target="_blank"
                      rel="noreferrer"
                      className={sectionButtonGhost}
                    >
                      Give Now
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="hidden lg:block h-full w-px self-stretch bg-white/10"></div>
                <div className="relative w-full max-w-lg space-y-3 md:space-y-4 border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0 lg:pl-0 lg:justify-self-start">
                  <div className="space-y-1.5 lg:pl-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                      Newsletter
                    </span>
                    <h2 className="text-[1.8rem] md:text-[2rem] font-extrabold text-white tracking-tight">Join the Community</h2>
                    <p className="text-sm text-slate-300 font-light leading-relaxed max-w-md">
                      Get fresh reflections on faith and technology in a clean, compact reading flow.
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border-0 bg-transparent p-0 shadow-none lg:pl-1">
                    <MailerLiteEmbed />
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ARCHIVE / FEED PAGES */}
        {activeTab === 'articles' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom space-y-12">
            <div className="space-y-6">
              <div>
                <h1 className="text-6xl font-extrabold tracking-tighter text-white">The <span className="text-indigo-400">Archive</span></h1>
                <p className="text-slate-400 mt-2 max-w-3xl">
                  Explore every reflection, tech teardown, and ministry update with filters that spotlight the series you follow or the tags that inspire you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Filter by</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setArticleFilterMode('series');
                      setArticleFilter('All');
                    }}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${articleFilterMode === 'series' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:border-amber-400/40'}`}
                  >
                    Series
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArticleFilterMode('tag');
                      setArticleFilter('All');
                    }}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${articleFilterMode === 'tag' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:border-amber-400/40'}`}
                  >
                    Tags
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {['All', ...currentFilterOptions].map((option) => (
                  <button
                    key={`filter-option-${articleFilterMode}-${option}`}
                    type="button"
                    onClick={() => setArticleFilter(option)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${articleFilter === option ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:border-amber-400/40'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-4">
              Page {archivePage + 1} of {totalArchivePages}
            </div>
            {pagedArticles.length === 0 ? (
              <div className="glass-card rounded-[2.5rem] border border-dashed border-white/20 p-8 text-center text-slate-500">
                No articles matched that filter yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 reveal-grid">
                {pagedArticles.map((art) => {
                  const previewTags = getArticleTags(art).slice(0, 4);
                  const previewText = art.excerpt?.trim()
                    ? getPreviewText(art.excerpt, 110)
                    : getPreviewText(art.content, 110);
                  return (
                  <article
                    key={art.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openArticle(art)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openArticle(art);
                      }
                    }}
                    className="glass-card preview-card group rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 flex flex-col justify-between transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-amber-400 focus-visible:outline-offset-2"
                  >
                    {art.thumbnail && (
                      <div className="overflow-hidden">
                        <div className="aspect-[4/3] bg-slate-950/80">
                          <img
                            src={art.thumbnail}
                            alt={art.title}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col gap-4">
                      <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">{art.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-2">
                        {previewText}
                      </p>
                      {previewTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {previewTags.map((tag) => (
                            <span
                              key={`${art.id}-${tag}`}
                              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M8 6.75h10M8 12h10M8 17.25h6M4.75 6.75h.5m-.5 5.25h.5m-.5 5.25h.5" />
                            </svg>
                          </span>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <TagIcon className="text-slate-400" />
                          </span>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            openArticle(art);
                          }}
                          aria-label={`Read ${art.title}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                )})}
              </div>
            )}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => setArchivePage((prev) => Math.max(0, prev - 1))}
                disabled={archivePage === 0}
                className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setArchivePage((prev) => Math.min(totalArchivePages - 1, prev + 1))}
                disabled={archivePage >= totalArchivePages - 1}
                className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {activeTab === 'article' && activeArticle && (
          <div className="w-full px-6 py-24 animate-in fade-in slide-in-from-bottom">
            <div className="flex flex-col gap-8 article-shell rounded-[2.5rem] p-8 md:p-12 lg:p-16 w-full">
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
                {activeArticle.subtext && (
                  <p className="text-lg md:text-xl text-slate-300 max-w-3xl">{activeArticle.subtext}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900">
                      <img src={bylineImage} alt={settings.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white uppercase tracking-[0.25em]">{settings.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Author</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.35em] text-slate-500">{activeArticle.pubDate}</span>
                </div>
                {seriesDisplayLabel && (
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-300">
                    Series: {seriesDisplayLabel}
                  </p>
                )}
              </div>

              {activeArticle.thumbnail && (
                <div className="w-full overflow-hidden bg-slate-900/40 max-h-[420px]">
                  <img src={activeArticle.thumbnail} alt={activeArticle.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div
                className="article-body text-slate-200 space-y-6"
                dangerouslySetInnerHTML={{ __html: formatArticleContent(activeArticle.content) }}
              />

              {(seriesRecommendations.length > 0 || tagRecommendations.length > 0) && (
                <div className="w-full space-y-8 mt-8">
                  {seriesRecommendations.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                          {seriesDisplayLabel ? `More from the ${seriesDisplayLabel} Series` : 'Series Connections'}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {seriesRecommendations.map((article) => (
                          <button
                            key={`series-${article.id}`}
                            onClick={() => openArticle(article)}
                            className="text-left glass-card preview-card rounded-xl overflow-hidden border-white/5 hover:border-amber-400/30 transition-all"
                          >
                            {article.thumbnail && (
                              <div className="aspect-[16/9] overflow-hidden bg-slate-900">
                                <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="p-4 space-y-2">
                              <h4 className="text-lg font-bold text-white leading-tight">{article.title}</h4>
                              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
                                Series: {normalizeSeriesLabel(article.series)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {tagRecommendations.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Shared Tags</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagRecommendations.map((article) => {
                          const sharedTags = getArticleTags(article).filter((tag) => activeArticleTagSet.has(tag));
                          return (
                            <button
                              key={`tag-${article.id}`}
                              onClick={() => openArticle(article)}
                              className="text-left glass-card preview-card rounded-xl overflow-hidden border-white/5 hover:border-amber-400/30 transition-all"
                            >
                              {article.thumbnail && (
                                <div className="aspect-[16/9] overflow-hidden bg-slate-900">
                                  <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="p-4 space-y-2">
                                <h4 className="text-lg font-bold text-white leading-tight">{article.title}</h4>
                                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
                                  {sharedTags.length > 0 ? sharedTags.join(', ') : 'Related tags'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-white/10 pt-6">
                {nextArticle && (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Article</span>
                    <button
                      onClick={() => openArticle(nextArticle)}
                      className="text-[10px] font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 inline-flex items-center gap-2"
                    >
                      {nextArticle.title}
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
              {activeArticleTags.length > 0 && (
                <div className="w-full border-t border-white/10 mt-8 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-3">Explore Tags</p>
                  <div className="flex flex-wrap gap-3">
                    {activeArticleTags.map((tag) => (
                      <button
                        key={`active-tag-${tag}`}
                        type="button"
                        onClick={() => applyTagFilter(tag)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] focus-visible:outline focus-visible:outline-amber-400 focus-visible:outline-offset-2 ${getTagColorClass(tag)}`}
                      >
                        <TagIcon className="text-[10px]" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom space-y-12">
            <div className="space-y-6">
              <div>
                <h1 className="text-6xl font-extrabold tracking-tighter text-white">Digital <span className="text-amber-400">Hub</span></h1>
                <p className="text-slate-400 mt-2 max-w-3xl">
                  Explore templates, guides, and media resources with quick payment filters so you can jump straight into free downloads or premium tools.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Filter by</span>
                <div className="flex gap-2">
                  {assetPaymentOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAssetFilter(option)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${assetFilter === option ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white hover:border-amber-400/40'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-4">
              Page {assetPage + 1} of {totalAssetPages}
            </div>
            {pagedAssets.length === 0 ? (
              <div className="glass-card rounded-[2.5rem] border border-dashed border-white/20 p-8 text-center text-slate-500">
                No resources matched that filter yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 reveal-grid">
                {pagedAssets.map((asset) => (
                  <article
                    key={asset.id}
                    className="glass-card preview-card group rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 flex flex-col justify-between transition hover:-translate-y-0.5"
                  >
                    {asset.image && (
                      <div className="overflow-hidden">
                        <div className="aspect-[4/3] bg-slate-950/80">
                          <img
                            src={asset.image}
                            alt={asset.name}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col gap-4">
                      <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">{asset.name}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-2">
                        {asset.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {getAssetPriceLabel(asset)}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <PriceIcon className="h-3.5 w-3.5" />
                          </span>
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {getAssetPriceLabel(asset)}
                          </span>
                        </div>
                        <a
                          href={asset.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${asset.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => setAssetPage((prev) => Math.max(0, prev - 1))}
                disabled={assetPage === 0}
                className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setAssetPage((prev) => Math.min(totalAssetPages - 1, prev + 1))}
                disabled={assetPage >= totalAssetPages - 1}
                className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:border-amber-400"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom space-y-12">
            <div className="space-y-6">
              <div>
                <h1 className="text-6xl font-extrabold tracking-tighter text-white">Featured <span className="text-indigo-400">Work</span></h1>
                <p className="text-slate-400 mt-2 max-w-3xl">
                  Showcasing tools, products, and digital builds from Contentful with clear visual previews and project-type markers.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 reveal-grid">
              {portfolioItems.map((item) => (
                <a
                  key={item.id}
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-card preview-card group rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/70 flex flex-col justify-between transition hover:-translate-y-0.5"
                >
                  <div className="overflow-hidden">
                    <div className="aspect-[4/3] bg-slate-950/80">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt={item.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Preview Loading
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <h4 className="text-2xl font-bold text-white leading-tight line-clamp-2">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed flex-1 line-clamp-2">{item.description}</p>
                    {item.tag && (
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          <PortfolioIcon tag={item.tag} className="h-3.5 w-3.5" />
                          {item.tag}
                        </span>
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                          <PortfolioIcon tag={item.tag} className="h-3.5 w-3.5" />
                        </span>
                        {item.tag && (
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(251,191,36,0.25)] transition group-hover:-translate-y-0.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
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
      <footer className="mt-8 border-t border-white/10 bg-slate-950 px-5 sm:px-8 py-10 md:py-12 text-center md:text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="text-2xl font-bold tracking-tighter text-white">Alexander Timilehin-Daniels</div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">Personal platform for faith-based tech reflections and ministry assets.</p>
            <div className="flex gap-4 justify-center md:justify-start">
               {SOCIAL_LINKS.map(link => (
                 <a key={link.platform} href={link.url} target="_blank" className="text-slate-500 hover:text-white transition-colors">
                   <SocialIcon platform={link.platform} className="w-5 h-5" />
                 </a>
               ))}
            </div>
          </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Sitemap</h4>
            <ul className="space-y-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <li><button onClick={() => handleNavClick('home')} className="hover:text-amber-400">Home</button></li>
              <li><button onClick={() => handleNavClick('articles')} className="hover:text-amber-400">Articles</button></li>
              <li><button onClick={() => handleNavClick('portfolio')} className="hover:text-amber-400">Portfolio</button></li>
              <li><button onClick={() => handleNavClick('resources')} className="hover:text-amber-400">Resource Hub</button></li>
              <li><button onClick={() => handleNavClick('videos')} className="hover:text-amber-400">Video Library</button></li>
            </ul>
          </div>
          <div className="space-y-3">
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
}
