import type { VercelRequest, VercelResponse } from '@vercel/node';

const buildError = (res: VercelResponse, status: number, message: string) => {
  res.status(status).json({ error: message });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!url) {
    return buildError(res, 400, 'Missing url parameter');
  }
  if (!/^https?:\/\//i.test(url)) {
    return buildError(res, 400, 'Invalid url');
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Techie4Christ RSS Proxy)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error('[RSS Proxy] Failed', err);
    return buildError(res, 502, 'Failed to fetch RSS');
  }
}
