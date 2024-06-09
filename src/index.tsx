import { Hono } from 'hono';

import { Env } from './env';
import { sessionMiddleware } from './session';

const app = new Hono<Env>();

app.use('*', sessionMiddleware);

export const route = app.post('/api/add', async (c) => {
  const value = ((await c.var.session.getNumber('counter')) || 0) + 1;
  await c.var.session.setNumber('counter', value);
  return c.json(
    {
      value,
    },
    200
  );
});

export type AppType = typeof route;

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
