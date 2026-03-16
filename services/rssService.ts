import { BlogPost, PodcastEpisode } from '../types';

const decodeHtml = (input: string) => {
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = input;
    return el.value;
  }
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--');
};

const getTextContent = (node: Element | null, preserveHtml = false) => {
  if (!node) return '';
  const raw = preserveHtml ? node.innerHTML : node.textContent || '';
  return decodeHtml(raw.trim());
};


const cleanRssText = (value: string) =>
  decodeHtml(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/_{5,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseImage = (item: Element) => {
  const enclosure = item.querySelector('enclosure');
  const media = item.querySelector('media\\:content');
  const url =
    enclosure?.getAttribute('url') ||
    media?.getAttribute('url') ||
    item.querySelector('media\\:thumbnail')?.getAttribute('url') ||
    '';
  return url;
};

const fetchViaProxy = async (url: string) => {
  console.info('[RSS] Fetch', url);
  // Use the Vercel serverless function in production (`api/rss.ts`).
  // In dev, `vite.config.ts` also handles this path.
  const proxyRes = await fetch(`/api/rss?url=${encodeURIComponent(url)}`);
  console.info('[RSS] Proxy status', proxyRes.status, proxyRes.statusText);
  if (proxyRes.ok) return proxyRes;

  // Fallback: try direct fetch (may be blocked by CORS in browser)
  try {
    const direct = await fetch(url);
    console.info('[RSS] Direct status', direct.status, direct.statusText);
    if (direct.ok) return direct;
  } catch (err) {
    console.warn('[RSS] Direct fetch failed', err);
  }

  // Fallback: jina.ai proxy for RSS
  const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//i, '')}`;
  const jinaRes = await fetch(jinaUrl);
  console.info('[RSS] Jina status', jinaRes.status, jinaRes.statusText);
  return jinaRes;
};

export async function fetchRSSFeed(url: string, sourceName: string): Promise<BlogPost[]> {
  if (!url) return [];
  const res = await fetchViaProxy(url);
  if (!res.ok) throw new Error(`RSS request failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  const items = Array.from(xml.querySelectorAll('item'));

  return items.map((item, index) => {
    const title = getTextContent(item.querySelector('title')) || 'Untitled';
    const link = getTextContent(item.querySelector('link')) || '#';
    const pubDate = getTextContent(item.querySelector('pubDate')) || '';
    const rawContent =
      getTextContent(item.querySelector('content\\:encoded'), true) ||
      getTextContent(item.querySelector('description'), true) ||
      '';
    const content = cleanRssText(rawContent);
    const thumbnail = parseImage(item);

    return {
      id: `${sourceName}-${index}`,
      title,
      link,
      pubDate,
      content,
      thumbnail,
      source: sourceName,
    };
  });
}

export async function fetchPodcastFeed(url: string): Promise<PodcastEpisode[]> {
  if (!url) return [];
  const res = await fetchViaProxy(url);
  if (!res.ok) throw new Error(`Podcast RSS failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  const items = Array.from(xml.querySelectorAll('item'));

  return items.map((item, index) => {
    const title = getTextContent(item.querySelector('title')) || 'Untitled';
    const link = getTextContent(item.querySelector('link')) || '#';
    const pubDate = getTextContent(item.querySelector('pubDate')) || '';
    const rawDescription =
      getTextContent(item.querySelector('description'), true) ||
      getTextContent(item.querySelector('itunes\\:summary'), true) ||
      '';
    const description = cleanRssText(rawDescription);
    const enclosure = item.querySelector('enclosure');
    const audioUrl = enclosure?.getAttribute('url') || '';
    const thumbnail =
      item.querySelector('itunes\\:image')?.getAttribute('href') || parseImage(item);

    return {
      id: `pod-${index}`,
      title,
      audioUrl,
      link,
      pubDate,
      description,
      thumbnail,
    };
  });
}
