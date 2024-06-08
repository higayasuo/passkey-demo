import { describe, it, expect } from 'vitest';

import { testClient } from 'hono/testing';
import { Miniflare } from 'miniflare';

import { routes } from '.';

describe('index', () => {
  it('api/clock', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = await mf.getKVNamespace('SESSION_KV');
    const client = testClient(routes, { SESSION_KV: kv });
    const ret = await client.api.clock.$get();
    const json = await ret.json();

    expect(ret.status).toEqual(200);
    expect(json.value).toEqual('test');
  });
});
