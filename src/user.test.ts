import { describe, it, expect, vi } from 'vitest';

import { Miniflare } from 'miniflare';
import { User, Authenticator } from './types';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import Bowser from 'bowser';

import {
  getUserByID,
  getUserByName,
  setUser,
  deleteUserByID,
  deleteUserByName,
  getUserAndAuthenticatorByCredentialID,
  findAuthenticator,
  userNameIdKey,
  authenticatorIDUserIDKey,
  deleteAuthenticator,
  putAuthenticatorIDUserID,
} from './user';

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.2 (KHTML, like Gecko) Ubuntu/11.10 Chromium/15.0.874.106 Chrome/15.0.874.106 Safari/535.2';

describe('user', () => {
  it('setUser & getUserByID', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    await setUser(kv, user);
    const user2 = await getUserByID(kv, '1');

    expect(user2).toEqual(user);
  });

  it('setUser & getUserByName', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    await setUser(kv, user);
    const user2 = await getUserByName(kv, 'test');

    expect(user2).toEqual(user);
  });

  it('putAuthenticatorIdUserId', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    await putAuthenticatorIDUserID(kv, '1', '2');

    expect(await kv.get(authenticatorIDUserIDKey('1'))).toBe('2');
  });

  it('deleteUserByID', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    const bowser = Bowser.parse(UA);
    const os = bowser.os;
    const now = Date.now();
    const authenticator: Authenticator = {
      id: isoBase64URL.fromBuffer(new Uint8Array([1, 2, 3])),
      publicKey: isoBase64URL.fromBuffer(new Uint8Array([4, 5, 6])),
      counter: 0,
      osName: os?.name || '',
      osVersion: os?.version || '',
      createdAt: now,
      updatedAt: now,
      transports: ['internal'],
    };
    console.log(authenticator);

    user.authenticators.push(authenticator);
    await putAuthenticatorIDUserID(kv, authenticator.id, user.id);
    await setUser(kv, user);

    expect(user.authenticators[0]).toEqual(authenticator);
    expect(await getUserByID(kv, '1')).toEqual(user);
    expect(await kv.get(userNameIdKey(user.name))).toBe('1');
    expect(await kv.get(authenticatorIDUserIDKey(authenticator.id))).toBe('1');

    await deleteUserByID(kv, '1');
    expect(await getUserByID(kv, '1')).toBeNull();
    expect(await kv.get(userNameIdKey(user.name))).toBeNull();
    expect(await kv.get(authenticatorIDUserIDKey(authenticator.id))).toBeNull();
  });

  it('deleteUserByName', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    const bowser = Bowser.parse(UA);
    const os = bowser.os;
    const now = Date.now();
    const authenticator: Authenticator = {
      id: isoBase64URL.fromBuffer(new Uint8Array([1, 2, 3])),
      publicKey: isoBase64URL.fromBuffer(new Uint8Array([4, 5, 6])),
      counter: 0,
      osName: os?.name || '',
      osVersion: os?.version || '',
      createdAt: now,
      updatedAt: now,
      transports: ['internal'],
    };

    user.authenticators.push(authenticator);
    await putAuthenticatorIDUserID(kv, authenticator.id, user.id);
    await setUser(kv, user);

    expect(await getUserByID(kv, '1')).toEqual(user);
    expect(await kv.get(userNameIdKey(user.name))).toBe('1');
    expect(await kv.get(authenticatorIDUserIDKey(authenticator.id))).toBe('1');

    await deleteUserByName(kv, 'test');
    expect(await getUserByID(kv, '1')).toBeNull();
    expect(await kv.get(userNameIdKey(user.name))).toBeNull();
    expect(await kv.get(authenticatorIDUserIDKey(authenticator.id))).toBeNull();
  });

  it('findAuthenticator', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    const bowser = Bowser.parse(UA);
    const os = bowser.os;
    const now = Date.now();
    const authenticator: Authenticator = {
      id: isoBase64URL.fromBuffer(new Uint8Array([1, 2, 3])),
      publicKey: isoBase64URL.fromBuffer(new Uint8Array([4, 5, 6])),
      counter: 0,
      osName: os!.name || '',
      osVersion: os!.version || '',
      createdAt: now,
      updatedAt: now,
      transports: ['internal'],
    };

    user.authenticators.push(authenticator);

    expect(
      findAuthenticator(user.authenticators, new Uint8Array([1, 2, 3]))
    ).toEqual(authenticator);
    expect(
      findAuthenticator(user.authenticators, new Uint8Array([1, 2, 3, 4]))
    ).toBeNull();
  });

  it('getUserAndAuthenticatorByCredentialID', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    const bowser = Bowser.parse(UA);
    const os = bowser.os;
    const now = Date.now();
    const authenticator: Authenticator = {
      id: isoBase64URL.fromBuffer(new Uint8Array([1, 2, 3])),
      publicKey: isoBase64URL.fromBuffer(new Uint8Array([4, 5, 6])),
      counter: 0,
      osName: os!.name || '',
      osVersion: os!.version || '',
      createdAt: now,
      updatedAt: now,
      transports: ['internal'],
    };

    user.authenticators.push(authenticator);
    await putAuthenticatorIDUserID(kv, authenticator.id, user.id);
    await setUser(kv, user);

    const result = await getUserAndAuthenticatorByCredentialID(
      kv,
      new Uint8Array([1, 2, 3])
    );

    expect(result?.user).toEqual(user);
    expect(result?.authenticator).toEqual(authenticator);
  });

  it('deleteAuthenticator', async () => {
    const mf = new Miniflare({
      modules: true,
      script: '',
      kvNamespaces: ['USER_KV'],
    });
    const kv = (await mf.getKVNamespace('USER_KV')) as KVNamespace;

    const user: User = {
      id: '1',
      name: 'test',
      authenticators: [],
      registered: false,
    };

    const bowser = Bowser.parse(UA);
    const os = bowser.os;
    const now = Date.now();
    const authenticator: Authenticator = {
      id: isoBase64URL.fromBuffer(new Uint8Array([1, 2, 3])),
      publicKey: isoBase64URL.fromBuffer(new Uint8Array([4, 5, 6])),
      counter: 0,
      osName: os!.name || '',
      osVersion: os!.version || '',
      createdAt: now,
      updatedAt: now,
      transports: ['internal'],
    };

    user.authenticators.push(authenticator);
    await putAuthenticatorIDUserID(kv, authenticator.id, user.id);
    await setUser(kv, user);

    expect(await getUserByID(kv, '1')).toEqual(user);
    expect(await kv.get(userNameIdKey(user.name))).toBe('1');
    expect(await kv.get(authenticatorIDUserIDKey(authenticator.id))).toBe('1');

    await deleteAuthenticator(kv, user, authenticator.id);
    expect((await getUserByID(kv, '1'))?.authenticators.length).toEqual(0);
    expect(await kv.get(authenticatorIDUserIDKey(authenticator.id))).toBeNull();
  });
});
