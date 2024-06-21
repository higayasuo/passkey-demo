import { Hono, Context } from 'hono';

import * as oauth2 from 'oauth4webapi';
import * as jose from 'jose';

import { Env } from './env';
import { sessionMiddleware } from './session';
import type { AuthParams, PubKeys, User } from './types';
import { getUserByName, setUser } from './user';
import { randomBase64URL } from './utils';

export const createAuthParams = (): AuthParams => {
  const code_verifier = oauth2.generateRandomCodeVerifier();
  const state = oauth2.generateRandomState();
  const nonce = oauth2.generateRandomNonce();

  return { code_verifier, state, nonce };
};

export const getClient = (c: Context<Env>): oauth2.Client => {
  return {
    issuer: import.meta.env.OIDC_ISSUER,
    client_id: import.meta.env.OIDC_CLIENT_ID,
    client_secret: c.env.OIDC_CLIENT_SECRET,
    redirect_uri: import.meta.env.OIDC_REDIRECT_URI,
  };
};

export const getAuthorizationServer = async (
  issuer: string
): Promise<oauth2.AuthorizationServer> => {
  const res = await oauth2.discoveryRequest(new URL(issuer));
  return (await res.json()) as oauth2.AuthorizationServer;
};

export const getPubKey = async (
  jwksUrl: string,
  kid: string
): Promise<jose.JWK | undefined> => {
  const res = await fetch(jwksUrl);
  const pubKeys = (await res.json()) as PubKeys;
  if (!pubKeys || !pubKeys.keys || !Array.isArray(pubKeys.keys)) {
    return undefined;
  }
  return pubKeys.keys.find((v) => v.kid === kid);
};

export const verifyIdToken = async (
  idToken: string,
  jwksUrl: string
): Promise<jose.JWTVerifyResult<jose.JWTPayload>> => {
  const { kid } = jose.decodeProtectedHeader(idToken);
  if (!kid) {
    throw new Error("ID token dosen't have kid parameter.");
  }

  const pubKey = await getPubKey(jwksUrl, kid);
  if (!pubKey) {
    throw new Error('Public key related with kid parameter was not found.');
  }

  const key = await jose.importJWK(pubKey);
  return jose.jwtVerify(idToken, key);
};

const auth = new Hono<Env>()
  //.use(sessionMiddleware)
  .get('/callback', async (c) => {
    try {
      const client = getClient(c);
      const as = await getAuthorizationServer(client.issuer as string);
      const { state, nonce, code_verifier } = await c.var.session.deleteBatch(
        'state',
        'nonce',
        'code_verifier'
      );
      //console.log('state :>> ', state);
      //console.log('url :>> ', c.req.url);
      const params = oauth2.validateAuthResponse(
        as,
        client,
        new URL(c.req.url),
        state
      );

      if (oauth2.isOAuth2Error(params)) {
        throw new Error(
          `OAuth2Error: [${params.error}] ${params.error_description}`
        );
      }

      const response = await oauth2.authorizationCodeGrantRequest(
        as,
        client,
        params,
        client.redirect_uri as string,
        code_verifier as string
      );

      const result = await oauth2.processAuthorizationCodeOpenIDResponse(
        as,
        client,
        response,
        nonce
      );

      if (oauth2.isOAuth2Error(result)) {
        throw new Error(
          `OAuth2Error: [${result.error}] ${result.error_description}`
        );
      }

      const verified = await verifyIdToken(
        result.id_token,
        as.jwks_uri as string
      );

      //console.log('payload :>> ', verified.payload);

      const userName = verified.payload.email as string;

      const user = await getUserByName(c.env.USER_KV, userName);

      if (!user) {
        const newUser: User = {
          id: randomBase64URL(),
          name: userName,
          oidcAccount: {
            iss: verified.payload.iss as string,
            sub: verified.payload.sub as string,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          authenticators: [],
        };
        await setUser(c.env.USER_KV, newUser);
      } else {
        user.oidcAccount.updatedAt = Date.now();
        await setUser(c.env.USER_KV, user);
      }
      await c.var.session.set('loggedIn', true);

      return c.redirect('/?userName=' + encodeURIComponent(userName));
    } catch (error: any) {
      console.error('Error during OAuth flow:', error);
      return c.redirect('/?error=' + encodeURIComponent(error.message));
    }
  });

export default auth;
