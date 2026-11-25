import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isHmrDisabled = process.env.DISABLE_HMR === 'true';
  const pwaManifest = {
    id: '/',
    name: 'DigiLegends Idle',
    short_name: 'DigiLegends',
    description:
      'DigiLegends Idle — MMORPG no Mundo Digital. Escolha seu Domador, evolua seu Digimon e salve seu progresso na nuvem.',
    theme_color: '#040d21',
    background_color: '#030816',
    display: 'standalone' as const,
    orientation: 'any' as const,
    scope: '/',
    start_url: '/',
    lang: 'pt-BR',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: pwaManifest,
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /\/assets\/.*\.(?:png|jpg|jpeg|webp|svg|gif)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'digilegends-media-cache',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          // vite-plugin-pwa's dev SW loader calls import.meta.hot.send(), which throws when HMR is disabled.
          enabled: !isHmrDisabled,
          type: 'module',
        },
      }),
      ...(isHmrDisabled
        ? [
            {
              name: 'dev-manifest-without-hmr',
              apply: 'serve' as const,
              configureServer(server: {
                middlewares: {
                  use: (
                    fn: (
                      req: {url?: string},
                      res: {
                        statusCode: number;
                        setHeader: (name: string, value: string) => void;
                        end: (body: string) => void;
                      },
                      next: () => void,
                    ) => void,
                  ) => void;
                };
              }) {
                server.middlewares.use((req, res, next) => {
                  if (req.url === '/manifest.webmanifest') {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/manifest+json');
                    res.end(JSON.stringify(pwaManifest, null, 2));
                    return;
                  }
                  next();
                });
              },
              transformIndexHtml(html: string) {
                if (html.includes('rel="manifest"')) {
                  return html;
                }
                return html.replace(
                  '</head>',
                  '    <link rel="manifest" href="/manifest.webmanifest" />\n  </head>',
                );
              },
            },
          ]
        : []),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
