import { describe, it, expect, vi } from 'vitest';

import { Context } from 'hono';
import { Miniflare } from 'miniflare';
import { getCookie, setCookie } from 'hono/cookie';

import { Session, generateAndSetSessionId, sessionMiddleware } from './session';
import { m } from 'vitest/dist/reporters-BXNXFKfg.js';

describe('session', () => {
  it('SESSION_KV', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = await mf.getKVNamespace('SESSION_KV');

    await kv.put('test', 'aaa');
    const value = await kv.get('test');
    expect(value).toEqual('aaa');
  });

  it('constructor without expirationTtl', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('test', kv);

    expect(session.sessionId).toEqual('test');
    expect(session.expirationTtl).toEqual(60 * 60 * 24);
  });

  it('constructor with expirationTtl', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('test', kv, 60);

    expect(session.sessionId).toEqual('test');
    expect(session.expirationTtl).toEqual(60);
  });

  it('loadData from KV', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const data = { test: 'aaa' };
    kv.put('session_id', JSON.stringify(data));
    const session = new Session('session_id', kv);

    expect(await session.getString('test')).toEqual('aaa');
  });

  it('loadData when data does not exist in KV', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('session_id', kv);

    expect(await session.getString('test')).toBeUndefined();
  });

  it('getNumber', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const data = { test: 1 };
    kv.put('session_id', JSON.stringify(data));
    const session = new Session('session_id', kv);

    expect(await session.getNumber('test')).toEqual(1);
  });

  it('getBoolean', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const data = { test: false };
    kv.put('session_id', JSON.stringify(data));
    const session = new Session('session_id', kv);

    expect(await session.getBoolean('test')).toEqual(false);
  });

  it('setString', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('session_id', kv);
    await session.setString('test', 'aaa');

    expect(await session.getString('test')).toEqual('aaa');
    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":"aaa"}');
  });

  it('setNumber', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('session_id', kv);
    await session.setNumber('test', 1);

    expect(await session.getNumber('test')).toEqual(1);
    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":1}');
  });

  it('setBoolean', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('session_id', kv);
    await session.setBoolean('test', true);

    expect(await session.getNumber('test')).toEqual(true);
    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":true}');
  });

  it('delete', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('session_id', kv);
    await session.setString('test', 'aaa');

    expect(await session.getString('test')).toEqual('aaa');

    await session.delete('test');
    expect(await session.getString('test')).toBeUndefined();
    const data = await kv.get('session_id');
    expect(data).toEqual('{}');
  });

  it('clear', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session('session_id', kv);
    await session.setString('test', 'aaa');
    await session.setString('test2', 'bbb');

    expect(await session.getString('test')).toEqual('aaa');
    expect(await session.getString('test2')).toEqual('bbb');

    await session.clear();

    const data = await kv.get('session_id');
    expect(data).toEqual(null);
    expect(await session.getString('test')).toBeUndefined();
    expect(await session.getString('test2')).toBeUndefined();
  });
});

describe('sessionMiddleware', () => {
  it('crypto.randomUUID', async () => {
    const uuid = crypto.randomUUID();
    expect(uuid.length).toEqual(36);
  });

  it('mock cookie', async () => {
    // vi.mock('hono/cookie', () => {
    //   return {
    //     setCookie: vi.fn(),
    //     getCookie: vi.fn(),
    //   };
    // });
    const mockSetCookie = vi.mocked(setCookie);
    const mockGetCookie = vi.mocked(getCookie);
    const c = {} as Context;

    setCookie(c, 'key1', 'value1');
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      'key1',
      'value1'
    );

    mockGetCookie.mockImplementation((_, key) => {
      if (key === 'aaa') {
        return 'value1';
      }
      return undefined;
    });
    expect(getCookie(c, 'aaa')).toEqual('value1');
    expect(getCookie(c, 'bbb')).toBeUndefined();
  });

  it('generateAndSetSessionId', async () => {
    // vi.mock('hono/cookie', () => {
    //   return {
    //     setCookie: vi.fn(),
    //     getCookie: vi.fn(),
    //   };
    // });
    const mockSetCookie = vi.mocked(setCookie);
    const c = {} as Context;

    const sessionId = generateAndSetSessionId(c);
    expect(sessionId.length).toEqual(36);
    expect(mockSetCookie).toHaveBeenCalledWith(c, '__session', sessionId, {
      httpOnly: true,
      maxAge: 86400,
      path: '/',
      secure: true,
    });
  });

  it('sessionMiddleware', async () => {
    vi.mock('hono/cookie', () => {
      return {
        setCookie: vi.fn(),
        getCookie: vi.fn(),
      };
    });
    //const mockSetCookie = vi.mocked(setCookie);
    const mockGetCookie = vi.mocked(getCookie);
    const mockSet = vi.fn();
    const mockGet = vi.fn();
    const c = {} as Context<{ Variables: { session: Session } }>;
    c.set = mockSet;
    c.get = mockGet;
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    c.env = { SESSION_KV: kv };
    const mockNext = vi.fn();

    await sessionMiddleware(c, mockNext);

    // const setCalls = mockSet.mock.calls;
    // expect(setCalls.length).toEqual(1);
    // expect(setCalls[0][0]).toEqual('session');
    // const session = setCalls[0][1] as Session;
    expect(mockGetCookie).toHaveBeenCalledWith(c, '__session');
    expect(mockSet).toHaveBeenCalledWith('session', expect.any(Session));
    expect(mockNext).toHaveBeenCalled();
  });
});
