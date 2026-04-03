import {
  Asset as HubAsset,
  BlogPost,
  FeedConfig,
  InternalArticle,
  PortfolioItem,
  PodcastEpisode,
  SiteSettings,
  YouTubeVideo,
} from '../types';
import { DEFAULT_SITE_SETTINGS } from '../constants';

type ContentfulResponse = {
  items: Array<{
    sys: { id: string };
    fields: Record<string, unknown>;
  }>;
  includes?: {
    Asset?: Array<{
      sys: { id: string };
      fields?: {
        title?: string;
        file?: { url?: string };
      };
    }>;
  };
};

const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID as string | undefined;
const accessToken = import.meta.env.VITE_CONTENTFUL_DELIVERY_TOKEN as string | undefined;
const environment = (import.meta.env.VITE_CONTENTFUL_ENVIRONMENT as string | undefined) || 'master';

const articleType = (import.meta.env.VITE_CONTENTFUL_ARTICLE_TYPE as string | undefined) || 'article';
const assetType = (import.meta.env.VITE_CONTENTFUL_ASSET_TYPE as string | undefined) || 'asset';
const videoType = (import.meta.env.VITE_CONTENTFUL_VIDEO_TYPE as string | undefined) || 'video';
const settingsType = (import.meta.env.VITE_CONTENTFUL_SETTINGS_TYPE as string | undefined) || 'settings';
const blogType = (import.meta.env.VITE_CONTENTFUL_BLOG_TYPE as string | undefined) || 'blogPost';
const podcastType = (import.meta.env.VITE_CONTENTFUL_PODCAST_TYPE as string | undefined) || 'podcastEpisode';
const podcastFeedType = (import.meta.env.VITE_CONTENTFUL_PODCAST_FEED_TYPE as string | undefined) || 'podcastFeed';
const portfolioType = (import.meta.env.VITE_CONTENTFUL_PORTFOLIO_TYPE as string | undefined) || 'portfolio';

const buildAssetMap = (data?: ContentfulResponse) => {
  const map = new Map<string, string>();
  data?.includes?.Asset?.forEach((asset) => {
    const url = asset.fields?.file?.url;
    if (asset.sys?.id && url) {
      map.set(asset.sys.id, url.startsWith('//') ? `https:${url}` : url);
    }
  });
  return map;
};

const resolveAssetUrl = (value: unknown, assetMap: Map<string, string>) => {
  if (!value || typeof value !== 'object') return '';
  const maybeId = (value as { sys?: { id?: string } }).sys?.id;
  if (!maybeId) return '';
  return assetMap.get(maybeId) || '';
};

const asText = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderTextWithMarks = (text: string, marks?: Array<{ type: string }>) => {
  const escaped = escapeHtml(text).replace(/\n/g, '<br />');
  if (!marks || marks.length === 0) return escaped;
  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong>${acc}</strong>`;
      case 'italic':
        return `<em>${acc}</em>`;
      case 'underline':
        return `<u>${acc}</u>`;
      case 'code':
        return `<code>${acc}</code>`;
      default:
        return acc;
    }
  }, escaped);
};

const renderRichTextNode = (
  node: unknown,
  assetMap: Map<string, string>
): string => {
  if (!node || typeof node !== 'object') return '';
  const current = node as {
    nodeType?: string;
    value?: string;
    content?: unknown[];
    marks?: Array<{ type: string }>;
    data?: { target?: { sys?: { id?: string } }; uri?: string };
  };

  const children = Array.isArray(current.content)
    ? current.content.map((child) => renderRichTextNode(child, assetMap)).join('')
    : '';

  switch (current.nodeType) {
    case 'document':
      return children;
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'heading-1':
      return `<h1>${children}</h1>`;
    case 'heading-2':
      return `<h2>${children}</h2>`;
    case 'heading-3':
      return `<h3>${children}</h3>`;
    case 'heading-4':
      return `<h4>${children}</h4>`;
    case 'heading-5':
      return `<h5>${children}</h5>`;
    case 'heading-6':
      return `<h6>${children}</h6>`;
    case 'unordered-list':
      return `<ul>${children}</ul>`;
    case 'ordered-list':
      return `<ol>${children}</ol>`;
    case 'list-item':
      return `<li>${children}</li>`;
    case 'blockquote':
      return `<blockquote>${children}</blockquote>`;
    case 'hr':
      return `<hr />`;
    case 'hyperlink': {
      const href = current.data?.uri ? escapeHtml(current.data.uri) : '#';
      return `<a href="${href}" target="_blank" rel="noreferrer">${children}</a>`;
    }
    case 'embedded-asset-block': {
      const id = current.data?.target?.sys?.id;
      const url = id ? assetMap.get(id) : '';
      if (!url) return '';
      return `<img src="${escapeHtml(url)}" alt="" />`;
    }
    case 'text':
      return renderTextWithMarks(current.value || '', current.marks);
    default:
      return children;
  }
};

const renderRichText = (value: unknown, assetMap: Map<string, string>) => {
  if (typeof value === 'string') return value;
  return renderRichTextNode(value, assetMap);
};

const normalizeUrl = (value: string) => {
  if (!value) return '';
  if (value.startsWith('//')) return `https:${value}`;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const resolveAssetFieldUrl = (value: unknown, assetMap: Map<string, string>) => {
  const linked = resolveAssetUrl(value, assetMap);
  if (linked) return linked;
  if (typeof value === 'string') return normalizeUrl(value);
  const maybeUrl = (value as { fields?: { file?: { url?: string } } })?.fields?.file?.url;
  if (maybeUrl) return maybeUrl.startsWith('//') ? `https:${maybeUrl}` : maybeUrl;
  return '';
};

const fetchEntries = async (contentType: string) => {
  if (!spaceId || !accessToken) return null;
  const url =
    `https://cdn.contentful.com/spaces/${spaceId}` +
    `/environments/${environment}/entries` +
    `?access_token=${accessToken}` +
    `&content_type=${contentType}` +
    `&include=2` +
    `&limit=200`;

  console.info('[Contentful] Fetch', { contentType, url });
  const res = await fetch(url);
  if (!res.ok) {
    console.error('[Contentful] Error', {
      contentType,
      status: res.status,
      statusText: res.statusText,
    });
    throw new Error(`Contentful request failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as ContentfulResponse;
  console.info('[Contentful] OK', { contentType, items: data.items?.length ?? 0 });
  return data;
};

const resolveSeriesLabel = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    return resolveSeriesLabel(value[0]);
  }
  const maybeFields = value as { fields?: Record<string, unknown> } | null;
  if (maybeFields?.fields) {
    if (maybeFields.fields.title) return asText(maybeFields.fields.title, '');
    if (maybeFields.fields.name) return asText(maybeFields.fields.name, '');
    if (maybeFields.fields.seriesTitle) return asText(maybeFields.fields.seriesTitle, '');
  }
  return '';
};

const resolveTagValue = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    const maybeFields = value as { fields?: Record<string, unknown> } | null;
    if (maybeFields?.fields) {
      if (maybeFields.fields.name) return asText(maybeFields.fields.name, '').trim();
      if (maybeFields.fields.title) return asText(maybeFields.fields.title, '').trim();
    }
  }
  return asText(value, '').trim();
};

const resolveTags = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveTagValue(item))
      .map((tag) => tag.split(',').map((part) => part.trim()))
      .flat()
      .filter(Boolean);
  }
  const normalized = resolveTagValue(value);
  if (!normalized) return [];
  return normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

const parseDateValue = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const mapArticles = (data: ContentfulResponse | null): InternalArticle[] => {
  if (!data) return [];
  const assetMap = buildAssetMap(data);
  return data.items
    .map((item) => {
      const fields = item.fields || {};
      const slugField = fields.slug as { current?: string } | string | undefined;
      const excerptText = asText(fields.excerpt, asText(fields.subtext, ''));
      return {
        id: item.sys.id,
    title: asText(fields.title, asText(fields.name, 'Untitled')),
    content:
      renderRichText(fields.body, assetMap) ||
      asText(fields.excerpt, asText(fields.content, '')),
    thumbnail:
      resolveAssetFieldUrl(fields.featuredImage, assetMap) ||
      resolveAssetFieldUrl(fields.featureImage, assetMap) ||
      resolveAssetFieldUrl(fields.thumbnail, assetMap) ||
      resolveAssetFieldUrl(fields.image, assetMap),
    pubDate: asText(fields.publishDate, asText(fields.publishedAt, asText(fields.date, ''))),
    category: asText(fields.category, '').trim(),
    slug:
      (typeof slugField === 'string' ? slugField : slugField?.current) || item.sys.id,
    excerpt: excerptText,
    subtext: asText(fields.subtext, excerptText),
    series: resolveSeriesLabel(fields.series),
    tags: resolveTags(fields.tags ?? fields.tag),
  };
    })
    .sort((a, b) => parseDateValue(b.pubDate) - parseDateValue(a.pubDate));
};

const mapAssets = (data: ContentfulResponse | null): HubAsset[] => {
  if (!data) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    const price = asText(fields.price, asText(fields.Price, ''));
    const isPaidField = fields.isPaid ?? fields.IsPaid;
    const isPaid =
      typeof isPaidField === 'boolean'
        ? isPaidField
        : typeof isPaidField === 'string'
        ? /^yes$/i.test(isPaidField.trim())
        : price.trim().length > 0 && !/^free$/i.test(price.trim());
    return {
      id: item.sys.id,
      name: asText(fields.name, asText(fields.title, 'Untitled')),
      price,
      isPaid,
      category: asText(fields.category, 'Resource'),
      description: asText(fields.description, ''),
      image:
        resolveAssetUrl(fields.image, assetMap) ||
        resolveAssetUrl(fields.thumbnail, assetMap),
      platform: (fields.platform as HubAsset['platform']) || 'Direct',
      externalUrl: normalizeUrl(asText(fields.externalUrl, asText(fields.link, '#'))),
    };
  });
};

const mapVideos = (data: ContentfulResponse | null): YouTubeVideo[] => {
  if (!data) return [];
  return data.items.map((item) => {
    const fields = item.fields || {};
    const youtubeId = asText(fields.youtubeId, '');
    return {
      id: item.sys.id,
      url: youtubeId
        ? `https://www.youtube.com/watch?v=${youtubeId}`
        : normalizeUrl(asText(fields.externalUrl, asText(fields.url, asText(fields.youtubeUrl, '')))),
      title: asText(fields.name, asText(fields.title, 'Untitled')),
    };
  });
};

const mapBlogPosts = (data: ContentfulResponse | null): BlogPost[] => {
  if (!data) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    return {
      id: item.sys.id,
      title: asText(fields.name, asText(fields.title, 'Untitled')),
      link: normalizeUrl(asText(fields.link, '#')),
      pubDate: asText(fields.publishedAt, asText(fields.date, '')),
      content: asText(fields.summary, asText(fields.content, '')),
      thumbnail:
        resolveAssetUrl(fields.thumbnail, assetMap) ||
        resolveAssetUrl(fields.image, assetMap),
      source: asText(fields.source, 'Contentful'),
    };
  });
};

const mapPodcastEpisodes = (data: ContentfulResponse | null): PodcastEpisode[] => {
  if (!data) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    return {
      id: item.sys.id,
      title: asText(fields.name, asText(fields.title, 'Untitled')),
      audioUrl: asText(fields.audioUrl, ''),
      link: normalizeUrl(asText(fields.link, '#')),
      pubDate: asText(fields.publishedAt, asText(fields.date, '')),
      description: asText(fields.description, ''),
      thumbnail:
        resolveAssetUrl(fields.thumbnail, assetMap) ||
        resolveAssetUrl(fields.image, assetMap),
    };
  });
};

const mapSettings = (data: ContentfulResponse | null): SiteSettings => {
  if (!data || data.items.length === 0) return DEFAULT_SITE_SETTINGS;
  const assetMap = buildAssetMap(data);
  const fields = data.items[0].fields || {};
  return {
    name: asText(fields.name, DEFAULT_SITE_SETTINGS.name),
    heroTitle: asText(fields.heroTitle, DEFAULT_SITE_SETTINGS.heroTitle),
    heroSubtitle: asText(fields.heroSubtitle, DEFAULT_SITE_SETTINGS.heroSubtitle),
    heroImage:
      resolveAssetUrl(fields.heroImage, assetMap) ||
      asText(fields.heroImage, DEFAULT_SITE_SETTINGS.heroImage),
    heroImageSecondary:
      resolveAssetUrl(fields.heroImageSecondary, assetMap) ||
      asText(fields.heroImageSecondary, DEFAULT_SITE_SETTINGS.heroImageSecondary || DEFAULT_SITE_SETTINGS.heroImage),
    bio: asText(fields.bio, DEFAULT_SITE_SETTINGS.bio),
    formspreeContactId: asText(
      fields.formspreeContactId,
      DEFAULT_SITE_SETTINGS.formspreeContactId
    ),
    calendlyUrl: asText(fields.calendlyUrl, DEFAULT_SITE_SETTINGS.calendlyUrl),
    formspreeBookingId: asText(
      fields.formspreeBookingId,
      DEFAULT_SITE_SETTINGS.formspreeBookingId
    ),
    bookingMethod:
      (fields.bookingMethod as SiteSettings['bookingMethod']) ||
      DEFAULT_SITE_SETTINGS.bookingMethod,
  };
};

const mapFeeds = (data: ContentfulResponse | null): FeedConfig[] => {
  if (!data) return [];
  return data.items.map((item) => {
    const fields = item.fields || {};
    return {
      id: item.sys.id,
      name: asText(fields.name, 'Feed'),
      rssUrl: asText(fields.rssUrl, asText(fields.url, '')),
    };
  });
};

const mapPortfolioItems = (data: ContentfulResponse | null): PortfolioItem[] => {
  if (!data) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    return {
      id: item.sys.id,
      title: asText(fields.name, asText(fields.title, 'Untitled')),
      description: asText(fields.description, ''),
      image:
        resolveAssetFieldUrl(fields.image, assetMap) ||
        resolveAssetFieldUrl(fields.thumbnail, assetMap) ||
        resolveAssetFieldUrl(fields.featuredImage, assetMap) ||
        resolveAssetFieldUrl(fields.featureImage, assetMap),
      externalUrl: normalizeUrl(asText(fields.externalUrl, asText(fields.link, '#'))),
      tag: asText(fields.tag, ''),
    };
  });
};




export const contentfulService = {
  getArticles: async () => {
    try {
      const data = await fetchEntries(articleType);
      return mapArticles(data);
    } catch (err) {
      console.error('Contentful articles error:', err);
      return [];
    }
  },
  getAssets: async () => {
    try {
      const data = await fetchEntries(assetType);
      return mapAssets(data);
    } catch (err) {
      console.error('Contentful assets error:', err);
      return [];
    }
  },
  getVideos: async () => {
    try {
      const data = await fetchEntries(videoType);
      return mapVideos(data);
    } catch (err) {
      console.error('Contentful videos error:', err);
      return [];
    }
  },
  getBlogPosts: async () => {
    try {
      const data = await fetchEntries(blogType);
      return mapBlogPosts(data);
    } catch (err) {
      console.error('Contentful blog posts error:', err);
      return [];
    }
  },
  getPodcastEpisodes: async () => {
    try {
      const data = await fetchEntries(podcastType);
      return mapPodcastEpisodes(data);
    } catch (err) {
      console.error('Contentful podcast error:', err);
      return [];
    }
  },
  getPodcastFeeds: async () => {
    try {
      const data = await fetchEntries(podcastFeedType);
      return mapFeeds(data);
    } catch (err) {
      console.error('Contentful podcast feed error:', err);
      return [];
    }
  },
  getEvents: async () => Promise.resolve([]),

  getPortfolioItems: async () => {
    try {
      const data = await fetchEntries(portfolioType);
      return mapPortfolioItems(data);
    } catch (err) {
      console.error('Contentful portfolio error:', err);
      return [];
    }
  },
  getSettings: async () => {
    try {
      const data = await fetchEntries(settingsType);
      return mapSettings(data);
    } catch (err) {
      console.error('Contentful settings error:', err);
      return DEFAULT_SITE_SETTINGS;
    }
  },
};



