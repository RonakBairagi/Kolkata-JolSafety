import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const ttsPlugin = () => ({
  name: 'tts-api-server',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/tts')) {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost:3000');
          const text = (parsedUrl.searchParams.get('text') || '').trim();
          const lang = (parsedUrl.searchParams.get('lang') || 'en').toLowerCase();

          if (!text) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing text parameter' }));
            return;
          }

          // Bengali: 'bn-IN' (Native Kolkata speaker), Hindi: 'hi-IN', English: 'en-IN'
          const targetLang = lang === 'bn' ? 'bn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(targetLang)}&client=tw-ob&q=${encodeURIComponent(text)}`;

          const googleRes = await fetch(ttsUrl, {
            headers: {
              'Referer': 'https://translate.google.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (googleRes.ok) {
            const arrayBuffer = await googleRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
            return;
          }
        } catch (err: any) {
          console.error('TTS middleware error:', err);
        }
      }
      next();
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ttsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
