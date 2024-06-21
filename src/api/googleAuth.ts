import { Hono, Context } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import * as oauth2 from 'oauth4webapi';
import * as jose from 'jose';
import { Env } from '../env';
import { sessionMiddleware } from '../session';

type PubKeys = {
  keys: jose.JWK[];
};

// state、nonce、PKCEの値を生成
const initClient = async (c: Context) => {
  const codeVerifier = oauth2.generateRandomCodeVerifier();
  const state = oauth2.generateRandomState();
  const nonce = oauth2.generateRandomNonce();
  const codeChallenge = await oauth2.calculatePKCECodeChallenge(codeVerifier);

  setCookie(c, 'state', state, { path: '/', httpOnly: true, secure: true });
  setCookie(c, 'nonce', nonce, { path: '/', httpOnly: true, secure: true });
  setCookie(c, 'code_verifier', codeVerifier, {
    path: '/',
    httpOnly: true,
    secure: true,
  });

  return { codeVerifier, state, nonce, codeChallenge };
};

// state、nonce、PKCEの検証値をcookieから取得
const getCookieParams = (c: Context) => {
  const state = getCookie(c, 'state');
  const nonce = getCookie(c, 'nonce');
  const code_verifier = getCookie(c, 'code_verifier');
  deleteCookie(c, 'state');
  deleteCookie(c, 'nonce');
  deleteCookie(c, 'code_verifier');

  return {
    state,
    nonce,
    code_verifier,
  };
};

// 環境変数から設定値を取得
const getClientInfo = (c: Context): oauth2.Client => {
  const { OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_REDIRECT_URI } = import.meta.env;

  return {
    issuer: OIDC_ISSUER,
    client_id: OIDC_CLIENT_ID,
    client_secret: c.env.OIDC_CLIENT_SECRET,
    redirect_uri: OIDC_REDIRECT_URI,
  };
};

// 公開鍵を取得
const getAuthorizationServer = async (
  issuer: string
): Promise<oauth2.AuthorizationServer> => {
  const res = await oauth2.discoveryRequest(new URL(issuer));
  return (await res.json()) as oauth2.AuthorizationServer;
};

const getPubKey = async (
  kid: string,
  oauth2JwksUrl: string
): Promise<jose.JWK | undefined> => {
  const res = await fetch(oauth2JwksUrl);
  const pubKeys = (await res.json()) as PubKeys;
  if (!pubKeys || !pubKeys.keys || !Array.isArray(pubKeys.keys)) {
    return;
  }
  return pubKeys.keys.find((v) => v.kid === kid);
};

// IDトークンの署名を検証
const verifyIdToken = async (
  c: Context,
  idToken: string,
  oauth2JwksUrl?: string
): Promise<jose.JWTVerifyResult<jose.JWTPayload>> => {
  // JWTのHeaderからkidを取得
  const header = jose.decodeProtectedHeader(idToken);
  const kid = header.kid;
  if (!kid) {
    throw new Error("ID token dosen't have kid parameter.");
  }
  if (!oauth2JwksUrl) {
    throw new Error('jwks_uri endpoint is undefined.');
  }
  // kidに紐づく公開鍵をGoogleから取得
  const pubKey = await getPubKey(kid, oauth2JwksUrl);
  if (!pubKey) {
    throw new Error('Public key related with kid parameter was not found.');
  }
  // 署名を検証
  const key = await jose.importJWK(pubKey);
  const verified = await jose.jwtVerify(idToken, key);
  return verified;
};

const googleAuth = new Hono<Env>()
  .use(sessionMiddleware)
  .get('/google/options', async (c) => {
    const { state, nonce, codeChallenge } = await initClient(c);
    const { client_id, issuer, redirect_uri } = getClientInfo(c);
    const { authorization_endpoint } = await getAuthorizationServer(
      issuer as string
    );

    const params: Record<string, string> = {
      response_type: 'code',
      client_id: client_id,
      scope: 'openid email',
      redirect_uri: typeof redirect_uri === 'string' ? redirect_uri : '',
      ux_mode: 'popup',
      // display: 'popup',
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent',
    };
    const searchParams = new URLSearchParams(params);
    const url = `${authorization_endpoint}?${searchParams.toString()}`;
    return c.text(url);
  })
  .get('/auth/callback', async (c) => {
    try {
      const client = getClientInfo(c);
      const as = await getAuthorizationServer(client.issuer as string);
      const { state, nonce, code_verifier } = getCookieParams(c);
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

      // 署名以外の検証
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

      // 署名の検証
      const verified = await verifyIdToken(c, result.id_token, as.jwks_uri);

      // セッションに、login済みフラグ、iss、subを格納(今回はlogに表示するだけ)
      console.log('login :>> ', true);
      console.log('iss :>> ', verified.payload.iss);
      console.log('sub :>> ', verified.payload.sub);
      console.log('email :>> ', verified.payload.email);

      setCookie(c, 'email', verified.payload.email as string, {
        path: '/',
        httpOnly: true,
        secure: true,
      });

      // return c.json(verified);
      return c.redirect('/');
    } catch (error: any) {
      console.error('Error during OAuth flow:', error);
      return c.text(error.message);
    }
  });

export default googleAuth;
