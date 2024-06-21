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
    const session = new Session<{ test: string }>('session_id', kv);

    expect(await session.get('test')).toEqual('aaa');
  });

  it('loadData when data does not exist in KV', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session<{ test: string }>('session_id', kv);

    expect(await session.get('test')).toBeUndefined();
  });

  it('get number from kv', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const data = { test: 1 };
    kv.put('session_id', JSON.stringify(data));
    const session = new Session<{ test: number }>('session_id', kv);

    expect(await session.get('test')).toEqual(1);
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
    const session = new Session<{ test: boolean }>('session_id', kv);

    expect(await session.get('test')).toEqual(false);
  });

  it('set string', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session<{ test: string }>('session_id', kv);
    await session.set('test', 'aaa');

    expect(await session.get('test')).toEqual('aaa');
    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":"aaa"}');
  });

  it('set number', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session<{ test: number }>('session_id', kv);
    await session.set('test', 1);

    expect(await session.get('test')).toEqual(1);
    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":1}');
  });

  it('set boolean', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session<{ test: boolean }>('session_id', kv);
    await session.set('test', true);

    expect(await session.get('test')).toEqual(true);
    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":true}');
  });

  it('setBatch, getBatch, deleteBatch', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session<{ test: string; test2: boolean }>(
      'session_id',
      kv
    );
    await session.setBatch({ test: 'aaa', test2: true });

    const result = await session.getBatch('test', 'test2');
    expect(result.test).toEqual('aaa');
    expect(result.test2).toEqual(true);

    const data = await kv.get('session_id');
    expect(data).toEqual('{"test":"aaa","test2":true}');

    const result2 = await session.deleteBatch('test', 'test2');
    expect(result2.test).toEqual('aaa');
    expect(result2.test2).toEqual(true);

    const data2 = await kv.get('session_id');
    expect(data2).toEqual('{}');
  });

  it('delete', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['SESSION_KV'],
    });
    const kv = (await mf.getKVNamespace('SESSION_KV')) as KVNamespace;
    const session = new Session<{ test: string }>('session_id', kv);
    await session.set('test', 'aaa');

    expect(await session.get('test')).toEqual('aaa');

    const result = await session.delete('test');
    expect(result).toEqual('aaa');
    expect(await session.get('test')).toBeUndefined();
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
    const session = new Session<{ test: string; test2: string }>(
      'session_id',
      kv
    );
    await session.set('test', 'aaa');
    await session.set('test2', 'bbb');

    expect(await session.get('test')).toEqual('aaa');
    expect(await session.get('test2')).toEqual('bbb');

    await session.clear();

    const data = await kv.get('session_id');
    expect(data).toEqual(null);
    expect(await session.get('test')).toBeUndefined();
    expect(await session.get('test2')).toBeUndefined();
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
      sameSite: 'Strict',
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
