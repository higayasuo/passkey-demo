import { Hono } from 'hono';

import { Env } from './env';

const app = new Hono<Env>();

export const routes = app.get('/api/clock', async (c) => {
  await c.env.SESSION_KV.put('test', 'test');
  const value = await c.env.SESSION_KV.get('test');
  return c.json(
    {
      value,
      time: new Date().toLocaleTimeString(),
    },
    200
  );
});

export type AppType = typeof routes;

app.get('/', (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link
          rel="stylesheet"
          href="https://cdn.simplecss.org/simple.min.css"
        />
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
