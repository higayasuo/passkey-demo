import { Hono } from 'hono';

import { Env } from './env';
import passkey from './api/passkey';
import apiAuth from './api/auth';
import auth from './auth';

const app = new Hono<Env>()
  .route('/api/passkey', passkey)
  .route('/api/auth', apiAuth)
  .route('/auth', auth)
  .get('/', (c) => {
    // console.log('OIDC_CLIENT_ID:', import.meta.env.OIDC_CLIENT_ID);
    // console.log('OIDC_CLIENT_SECRET:', c.env.OIDC_CLIENT_SECRET);
    // console.log('OIDC_ISSUER:', import.meta.env.OIDC_ISSUER);
    // console.log('OIDC_REDIRECT_URI:', import.meta.env.OIDC_REDIRECT_URI);
    return c.html(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>Passkey Demo</title>
          {/* <link
            rel="stylesheet"
            href="https://cdn.simplecss.org/simple.min.css"
          /> */}
          <link href="/static/style.css" rel="stylesheet" />
          {import.meta.env.PROD ? (
            <script type="module" src="/static/client.js" />
          ) : (
            <script type="module" src="/src/client.tsx" />
          )}
        </head>
        <body>
          <div id="root" />
        </body>
      </html>
    );
  });

export default app;
