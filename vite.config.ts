import pages from '@hono/vite-cloudflare-pages';
import devServer from '@hono/vite-dev-server';
import adapter from '@hono/vite-dev-server/cloudflare';
//import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  console.log('mode:', mode);
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
    'import.meta.env.OIDC_ISSUER': '"https://accounts.google.com"',
    'import.meta.env.OIDC_REDIRECT_URI':
      process.env.NODE_ENV === 'production'
        ? '"https://cloudflare-page.com/auth/callback"'
        : '"http://localhost:5173/auth/callback"',
    'import.meta.env.OIDC_CLIENT_ID':
      '"849535924220-oj94r23rvq3p8r115s73rq40pdmblkll.apps.googleusercontent.com"',
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
      // nodePolyfills({
      //   globals: {
      //     global: false,
      //     Buffer: true,
      //     process: true,
      //   },
      //   protocolImports: true,
      // }),
      pages(),
      devServer({
        adapter,
        entry: 'src/index.tsx',
      }),
    ],
  };
});
