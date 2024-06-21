import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    env: {
      OIDC_ISSUER: 'https://accounts.google.com',
      OIDC_REDIRECT_URI: 'http://localhost:5173/auth/callback',
      OIDC_CLIENT_ID: 'CLIENT_ID',
    },
  },
});
