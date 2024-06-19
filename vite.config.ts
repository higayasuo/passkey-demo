import pages from '@hono/vite-cloudflare-pages';
import devServer from '@hono/vite-dev-server';
import adapter from '@hono/vite-dev-server/cloudflare';

import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const define = {
    'import.meta.env.RP_ID':
      process.env.NODE_ENV === 'production'
        ? '"cloudflare-pages.com"'
        : '"localhost"',
    'import.meta.env.RP_NAME': '"Passkey demo"',
    'import.meta.env.ORIGIN':
      process.env.NODE_ENV === 'production'
        ? '"https://cloudflare-page.com"'
        : '"http://localhost:5173"',
  };
  if (mode === 'client') {
    return {
      define,
      esbuild: {
        jsxImportSource: 'hono/jsx/dom', // Optimized for hono/jsx/dom
      },
      build: {
        rollupOptions: {
          input: './src/client.tsx',
          output: {
            entryFileNames: 'static/client.js',
          },
        },
      },
    };
  }
  return {
    ssr: {
      external: ['@simplewebauthn/server'],
    },
    define,
    plugins: [
      nodePolyfills({
        globals: {
          Buffer: true,
          global: false,
          process: true,
        },
        overrides: {
          fs: 'memfs',
        },
      }),
      pages(),
      devServer({
        adapter,
        entry: 'src/index.tsx',
      }),
    ],
  };
});
