import { describe, it, expect } from 'vitest';

import { Miniflare } from 'miniflare';

import { Session } from './session';

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
