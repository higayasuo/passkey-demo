import { describe, it, expect } from 'vitest';

import { Context } from 'hono';
import path from 'path';
import * as oauth2 from 'oauth4webapi';

import { Env } from './env';
import type { PubKeys } from './types';
import {
  createAuthParams,
  getClient,
  getAuthorizationServer,
  getPubKey,
} from './auth';

import { config } from 'dotenv';

describe('auth', () => {
  it('createAuthParams', async () => {
    const params = createAuthParams();
    expect(params.state).toBeDefined();
    expect(params.nonce).toBeDefined();
    expect(params.code_verifier).toBeDefined();
  });

  it('getClient', async () => {
    const c = {
      env: {
        OIDC_CLIENT_SECRET: 'hoge',
      },
    } as Context<Env>;

    const client = getClient(c);
    expect(client.client_secret).toEqual('hoge');
    expect(client.issuer).toEqual(import.meta.env.OIDC_ISSUER);
    expect(client.client_id).toEqual(import.meta.env.OIDC_CLIENT_ID);
    expect(client.redirect_uri).toEqual(import.meta.env.OIDC_REDIRECT_URI);
  });

  it('getAuthorizationServer', async () => {
    const as = await getAuthorizationServer(import.meta.env.OIDC_ISSUER);
    expect(as.token_endpoint).toBeDefined();
    expect(as.jwks_uri).toBeDefined();
  });

  it('getPubKey', async () => {
    const as = await getAuthorizationServer(import.meta.env.OIDC_ISSUER);
    const jwksUri = as.jwks_uri as string;
    const res = await fetch(jwksUri);
    const json = (await res.json()) as PubKeys;
    const kid = json.keys[0].kid as string;
    const pubKey = await getPubKey(jwksUri, kid);
    expect(pubKey).toBeDefined();
    expect(pubKey?.kid).toEqual(kid);
  });

  it('dotenv', async () => {
    //console.log(path.join(process.cwd(), '.env.vars'));
    config({ path: path.join(process.cwd(), '.dev.vars') });

    expect(import.meta.env.OIDC_CLIENT_SECRET).toBeDefined();
  });
});
