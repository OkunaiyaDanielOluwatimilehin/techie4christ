import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rssProxyPlugin = () => ({
  name: 'rss-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url) return next();
      const isLegacy = req.url.startsWith('/rss');
      const isApi = req.url.startsWith('/api/rss');
      if (!isLegacy && !isApi) return next();
      try {
        const url = new URL(req.url, 'http://localhost');
        const target = url.searchParams.get('url');
        if (!target || !/^https?:\/\//i.test(target)) {
          res.statusCode = 400;
          res.end('Missing or invalid url param');
          return;
        }
        const upstream = await fetch(target, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (RSS Proxy)',
            'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
          },
        });
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/xml');
        const body = await upstream.text();
        res.end(body);
      } catch (err) {
        res.statusCode = 500;
        res.end('RSS proxy error');
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), rssProxyPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
