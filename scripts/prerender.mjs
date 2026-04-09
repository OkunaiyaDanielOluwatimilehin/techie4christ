import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const loadEnvFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return raw.split(/\r?\n/).reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return acc;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      acc[key] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeDescription = (value = '', fallback = '') => {
  const text = stripHtml(value) || fallback;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
};

const normalizeUrl = (value = '') => {
  if (!value) return '';
  if (value.startsWith('//')) return `https:${value}`;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const toAbsoluteUrl = (baseUrl, value = '') => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  return `${baseUrl}${value.startsWith('/') ? value : `/${value}`}`;
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

const readEnv = async () => {
  const local = await loadEnvFile(path.join(rootDir, '.env.local'));
  const base = await loadEnvFile(path.join(rootDir, '.env'));
  return { ...base, ...local, ...process.env };
};

const buildAbsoluteBaseUrl = (env) => {
  const explicit = env.SITE_URL || env.VITE_SITE_URL || env.PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL.replace(/\/+$/, '')}`;
  return 'https://techie4christ.com';
};

const fetchContentfulEntries = async (env, contentType) => {
  const spaceId = env.VITE_CONTENTFUL_SPACE_ID;
  const accessToken = env.VITE_CONTENTFUL_DELIVERY_TOKEN;
  const environment = env.VITE_CONTENTFUL_ENVIRONMENT || 'master';
  if (!spaceId || !accessToken) return null;

  const url =
    `https://cdn.contentful.com/spaces/${spaceId}` +
    `/environments/${environment}/entries` +
    `?access_token=${accessToken}` +
    `&content_type=${encodeURIComponent(contentType)}` +
    `&include=2` +
    `&limit=200`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Contentful request failed for ${contentType}: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

const buildAssetMap = (data) => {
  const map = new Map();
  data?.includes?.Asset?.forEach((asset) => {
    const url = asset.fields?.file?.url;
    if (asset.sys?.id && url) {
      map.set(asset.sys.id, url.startsWith('//') ? `https:${url}` : url);
    }
  });
  return map;
};

const resolveAssetUrl = (value, assetMap) => {
  if (!value || typeof value !== 'object') return '';
  const maybeId = value?.sys?.id;
  return maybeId ? assetMap.get(maybeId) || '' : '';
};

const escapeAttr = (value = '') => escapeHtml(value).replace(/`/g, '&#96;');

const parseArticles = (data) => {
  if (!data?.items) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    const slugField = fields.slug;
    const slug = typeof slugField === 'string' ? slugField : slugField?.current || item.sys.id;
    const thumbnail =
      resolveAssetUrl(fields.featuredImage, assetMap) ||
      resolveAssetUrl(fields.featureImage, assetMap) ||
      resolveAssetUrl(fields.thumbnail, assetMap) ||
      resolveAssetUrl(fields.image, assetMap) ||
      '';

    return {
      id: item.sys.id,
      title: fields.title || fields.name || 'Untitled',
      slug,
      subtext: fields.subtext || '',
      excerpt: fields.excerpt || '',
      content: fields.content || '',
      thumbnail,
      pubDate: fields.publishDate || fields.publishedAt || fields.date || '',
      category: fields.category || '',
    };
  });
};

const parseAssets = (data) => {
  if (!data?.items) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    return {
      id: item.sys.id,
      title: fields.name || fields.title || 'Untitled',
      slug: slugify(fields.name || fields.title || item.sys.id),
      description: fields.description || '',
      image:
        resolveAssetUrl(fields.image, assetMap) ||
        resolveAssetUrl(fields.thumbnail, assetMap) ||
        '',
      price: fields.price || fields.Price || '',
    };
  });
};

const parsePortfolioItems = (data) => {
  if (!data?.items) return [];
  const assetMap = buildAssetMap(data);
  return data.items.map((item) => {
    const fields = item.fields || {};
    return {
      id: item.sys.id,
      title: fields.name || fields.title || 'Untitled',
      slug: slugify(fields.name || fields.title || item.sys.id),
      description: fields.description || '',
      image:
        resolveAssetUrl(fields.image, assetMap) ||
        resolveAssetUrl(fields.thumbnail, assetMap) ||
        resolveAssetUrl(fields.featuredImage, assetMap) ||
        resolveAssetUrl(fields.featureImage, assetMap) ||
        '',
      tag: fields.tag || '',
    };
  });
};

const injectMeta = (template, meta) => {
  const replacements = [
    [/\<title\>.*?\<\/title\>/is, `<title>${escapeHtml(meta.title)}</title>`],
    [/\<meta name="description" content=".*?"\>/i, `<meta name="description" content="${escapeAttr(meta.description)}">`],
    [/\<meta property="og:type" content=".*?"\>/i, `<meta property="og:type" content="${escapeAttr(meta.ogType || 'article')}">`],
    [/\<meta property="og:title" content=".*?"\>/i, `<meta property="og:title" content="${escapeAttr(meta.title)}">`],
    [/\<meta property="og:description" content=".*?"\>/i, `<meta property="og:description" content="${escapeAttr(meta.description)}">`],
    [/\<meta property="og:image" content=".*?"\>/i, `<meta property="og:image" content="${escapeAttr(meta.image)}">`],
    [/\<meta property="og:url" content=".*?"\>/i, `<meta property="og:url" content="${escapeAttr(meta.url)}">`],
    [/\<meta name="twitter:card" content=".*?"\>/i, `<meta name="twitter:card" content="summary_large_image">`],
    [/\<meta name="twitter:title" content=".*?"\>/i, `<meta name="twitter:title" content="${escapeAttr(meta.title)}">`],
    [/\<meta name="twitter:description" content=".*?"\>/i, `<meta name="twitter:description" content="${escapeAttr(meta.description)}">`],
    [/\<meta name="twitter:image" content=".*?"\>/i, `<meta name="twitter:image" content="${escapeAttr(meta.image)}">`],
  ];

  return replacements.reduce((html, [pattern, replacement]) => html.replace(pattern, replacement), template);
};

const renderPageShell = (meta) => `
  <main style="min-height:100vh;background:linear-gradient(180deg,#020617 0%,#0f172a 100%);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;padding:48px 20px;">
    <section style="max-width:1040px;margin:0 auto;">
      <div style="margin-bottom:24px;text-transform:uppercase;letter-spacing:.35em;font-size:10px;color:#fbbf24;font-weight:800;">Techie 4 Christ</div>
      <h1 style="font-size:clamp(2rem,5vw,4.5rem);line-height:1.05;margin:0 0 16px;font-weight:800;letter-spacing:-.04em;">${escapeHtml(meta.title)}</h1>
      <p style="font-size:1.05rem;line-height:1.9;color:#cbd5e1;max-width:760px;margin:0 0 24px;">${escapeHtml(meta.description)}</p>
      <div style="border-radius:28px;overflow:hidden;border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(2,6,23,.45);background:#0f172a;">
        <div style="aspect-ratio:16/9;background:#111827 center/cover no-repeat;${meta.image ? `background-image:url('${escapeAttr(meta.image)}');` : ''}"></div>
        <div style="padding:24px 24px 30px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
          <span style="display:inline-flex;align-items:center;border:1px solid rgba(251,191,36,.28);background:rgba(251,191,36,.12);color:#fbbf24;border-radius:999px;padding:6px 12px;font-size:10px;font-weight:800;letter-spacing:.28em;text-transform:uppercase;">${escapeHtml(meta.badge || 'Preview')}</span>
          <a href="${escapeAttr(meta.url)}" style="font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#fbbf24;text-decoration:none;">Open Page</a>
        </div>
      </div>
    </section>
  </main>
`;

const renderArticleShell = (meta) => {
  return renderPageShell({
    ...meta,
    badge: meta.category || 'Article',
  });
};

const main = async () => {
  const env = await readEnv();
  const templatePath = path.join(distDir, 'index.html');
  const template = await fs.readFile(templatePath, 'utf8');
  const baseUrl = buildAbsoluteBaseUrl(env);
  const articleType = env.VITE_CONTENTFUL_ARTICLE_TYPE || 'article';
  const assetType = env.VITE_CONTENTFUL_ASSET_TYPE || 'asset';
  const portfolioType = env.VITE_CONTENTFUL_PORTFOLIO_TYPE || 'portfolio';
  const rawData = await fetchContentfulEntries(env, articleType);
  const articles = parseArticles(rawData);
  const assets = parseAssets(await fetchContentfulEntries(env, assetType));
  const portfolioItems = parsePortfolioItems(await fetchContentfulEntries(env, portfolioType));

  const writeSnapshot = async (routePath, meta, shell) => {
    const html = injectMeta(template, meta).replace(
      /<div id="root"><\/div>/i,
      `<div id="root">${shell}</div>`
    );
    const normalizedPath = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
    const routeDir = normalizedPath ? path.join(distDir, normalizedPath) : distDir;
    await fs.mkdir(routeDir, { recursive: true });
    await fs.writeFile(path.join(routeDir, 'index.html'), html, 'utf8');
  };

  if (!articles.length) {
    console.log('[prerender] No articles found; skipping article snapshot generation.');
  }

  for (const article of articles) {
    const slug = String(article.slug || article.id).trim();
    if (!slug) continue;
    const safeSlug = encodeURIComponent(slug);
    const routeUrl = `${baseUrl}/articles/${encodeURIComponent(slug)}`;
    const image = toAbsoluteUrl(baseUrl, article.thumbnail) || `${baseUrl}/android-chrome-512x512.png`;
    const description = sanitizeDescription(
      article.subtext || article.excerpt || article.content,
      'Faith-driven tech reflections, ministry tools, and practical content from Techie 4 Christ.'
    );
    const title = `${article.title} | Techie 4 Christ`;
    await writeSnapshot(`/articles/${safeSlug}`, {
      title,
      description,
      image,
      url: routeUrl,
      ogType: 'article',
      category: article.category || 'Article',
      pubDate: article.pubDate || '',
    }, renderArticleShell({
      title,
      description,
      image,
      url: routeUrl,
      category: article.category || 'Article',
      pubDate: article.pubDate || '',
    }));
  }

  const resourcesHero = assets[0] || {};
  await writeSnapshot('/resources', {
    title: 'Digital Hub | Techie 4 Christ',
    description: 'Templates, guides, and media resources from Techie 4 Christ.',
    image: toAbsoluteUrl(baseUrl, resourcesHero.image) || `${baseUrl}/android-chrome-512x512.png`,
    url: `${baseUrl}/resources`,
    ogType: 'website',
  }, renderPageShell({
    title: 'Digital Hub',
    description: resourcesHero.description || 'Templates, guides, and media resources from Techie 4 Christ.',
    image: toAbsoluteUrl(baseUrl, resourcesHero.image) || `${baseUrl}/android-chrome-512x512.png`,
    url: `${baseUrl}/resources`,
    badge: resourcesHero.price ? `Featured ${resourcesHero.price}` : 'Digital Hub',
  }));

  const portfolioHero = portfolioItems[0] || {};
  await writeSnapshot('/portfolio', {
    title: 'Featured Work | Techie 4 Christ',
    description: 'Digital builds, products, and project previews from Techie 4 Christ.',
    image: toAbsoluteUrl(baseUrl, portfolioHero.image) || `${baseUrl}/android-chrome-512x512.png`,
    url: `${baseUrl}/portfolio`,
    ogType: 'website',
  }, renderPageShell({
    title: 'Featured Work',
    description: portfolioHero.description || 'Digital builds, products, and project previews from Techie 4 Christ.',
    image: toAbsoluteUrl(baseUrl, portfolioHero.image) || `${baseUrl}/android-chrome-512x512.png`,
    url: `${baseUrl}/portfolio`,
    badge: portfolioHero.tag || 'Portfolio',
  }));

  for (const asset of assets) {
    const routeUrl = `${baseUrl}/resources/${encodeURIComponent(asset.slug)}`;
    await writeSnapshot(`/resources/${encodeURIComponent(asset.slug)}`, {
      title: `${asset.title} | Techie 4 Christ`,
      description: sanitizeDescription(
        asset.description,
        'Digital resource preview from Techie 4 Christ.'
      ),
      image: toAbsoluteUrl(baseUrl, asset.image) || `${baseUrl}/android-chrome-512x512.png`,
      url: routeUrl,
      ogType: 'website',
    }, renderPageShell({
      title: asset.title,
      description: sanitizeDescription(asset.description, 'Digital resource preview from Techie 4 Christ.'),
      image: toAbsoluteUrl(baseUrl, asset.image) || `${baseUrl}/android-chrome-512x512.png`,
      url: routeUrl,
      badge: asset.price || 'Resource',
    }));
  }

  for (const item of portfolioItems) {
    const routeUrl = `${baseUrl}/portfolio/${encodeURIComponent(item.slug)}`;
    await writeSnapshot(`/portfolio/${encodeURIComponent(item.slug)}`, {
      title: `${item.title} | Techie 4 Christ`,
      description: sanitizeDescription(
        item.description,
        'Portfolio preview from Techie 4 Christ.'
      ),
      image: toAbsoluteUrl(baseUrl, item.image) || `${baseUrl}/android-chrome-512x512.png`,
      url: routeUrl,
      ogType: 'website',
    }, renderPageShell({
      title: item.title,
      description: sanitizeDescription(item.description, 'Portfolio preview from Techie 4 Christ.'),
      image: toAbsoluteUrl(baseUrl, item.image) || `${baseUrl}/android-chrome-512x512.png`,
      url: routeUrl,
      badge: item.tag || 'Portfolio',
    }));
  }

  await writeSnapshot('/articles', {
    title: 'Articles | Techie 4 Christ',
    description: 'Faith-driven tech reflections and practical articles from Techie 4 Christ.',
    image: `${baseUrl}/android-chrome-512x512.png`,
    url: `${baseUrl}/articles`,
    ogType: 'website',
  }, renderPageShell({
    title: 'Articles',
    description: 'Faith-driven tech reflections and practical articles from Techie 4 Christ.',
    image: `${baseUrl}/android-chrome-512x512.png`,
    url: `${baseUrl}/articles`,
    badge: 'Articles',
  }));

  console.log(`[prerender] Wrote ${articles.length} article snapshots and shared page previews.`);
};

main().catch((err) => {
  console.error('[prerender] Failed', err);
  process.exit(1);
});
