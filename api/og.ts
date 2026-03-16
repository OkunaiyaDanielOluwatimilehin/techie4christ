import type { VercelRequest, VercelResponse } from '@vercel/node';

type OgResult = {
  url: string;
  image: string;
  title: string;
  description: string;
};

const buildError = (res: VercelResponse, status: number, message: string) => {
  res.status(status).json({ error: message });
};

const safeUrl = (input: string) => {
  try {
    const u = new URL(input);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

const extractMeta = (html: string, key: string) => {
  // Matches: <meta property="og:image" content="..."> and <meta name="twitter:image" content="...">
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=[\"']${key}[\"'][^>]+content=[\"']([^\"']+)[\"'][^>]*>`,
    'i'
  );
  const m = html.match(re);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : '';
};

const absolutize = (base: URL, maybeUrl: string) => {
  if (!maybeUrl) return '';
  if (maybeUrl.startsWith('//')) return `https:${maybeUrl}`;
  try {
    return new URL(maybeUrl, base).toString();
  } catch {
    return '';
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!raw) return buildError(res, 400, 'Missing url parameter');

  const target = safeUrl(raw);
  if (!target) return buildError(res, 400, 'Invalid url');

  try {
    const upstream = await fetch(target.toString(), {
      // Some sites block default fetch UA.
      headers: {
        'User-Agent': 'Mozilla/5.0 (Techie4Christ OG Proxy)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    const html = await upstream.text();
    const ogImage =
      extractMeta(html, 'og:image:secure_url') ||
      extractMeta(html, 'og:image:url') ||
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      extractMeta(html, 'twitter:image:src');

    const ogTitle = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title');
    const ogDescription =
      extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description');

    const result: OgResult = {
      url: target.toString(),
      image: absolutize(target, ogImage),
      title: ogTitle,
      description: ogDescription,
    };

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json(result);
  } catch (err) {
    console.error('[OG Proxy] Failed', err);
    return buildError(res, 502, 'Failed to fetch preview metadata');
  }
}

