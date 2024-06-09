import { describe, it, expect, vi } from 'vitest';

import { getCookie, setCookie } from 'hono/cookie';
import { testClient } from 'hono/testing';
import { Miniflare } from 'miniflare';

import { route } from '.';

describe('index', () => {
  it('api/add', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = await mf.getKVNamespace('SESSION_KV');
    const client = testClient(route, { SESSION_KV: kv });
    vi.mock('hono/cookie', () => {
      return {
        setCookie: vi.fn(),
        getCookie: vi.fn(),
      };
    });
    const mockSetCookie = vi.mocked(setCookie);
    const mockGetCookie = vi.mocked(getCookie);
    const mockCookie: Record<string, string> = {};

    mockSetCookie.mockImplementation((_, key, value) => {
      mockCookie[key] = value;
    });

    mockGetCookie.mockImplementation((_, key) => {
      return mockCookie[key];
    });

    const ret = await client.api.add.$post();
    const json = await ret.json();

    expect(ret.status).toEqual(200);
    expect(json.value).toEqual(1);

    const ret2 = await client.api.add.$post();
    const json2 = await ret2.json();

    expect(ret2.status).toEqual(200);
    expect(json2.value).toEqual(2);
  });
});
