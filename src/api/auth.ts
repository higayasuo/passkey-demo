import { Hono } from 'hono';
import * as oauth2 from 'oauth4webapi';
import { createAuthParams, getClient, getAuthorizationServer } from '../auth';
import { Env } from '../env';
import { sessionMiddleware } from '../session';

const auth = new Hono<Env>()
  //.use(sessionMiddleware)
  .get('/auth-options', async (c) => {
    //console.log('USER_KV:', c.env.USER_KV);
    //console.log('SESSION_KV:', c.env.SESSION_KV);
    const authParams = createAuthParams();
    const code_challenge = await oauth2.calculatePKCECodeChallenge(
      authParams.code_verifier
    );
    await c.var.session.setBatch(authParams);

    const { client_id, issuer, redirect_uri } = getClient(c);
    const { authorization_endpoint } = await getAuthorizationServer(
      issuer as string
    );

    const params: Record<string, string> = {
      response_type: 'code',
      client_id,
      scope: 'openid email',
      redirect_uri: redirect_uri as string,
      ux_mode: 'popup',
      state: authParams.state,
      nonce: authParams.nonce,
      code_challenge,
      code_challenge_method: 'S256',
      prompt: 'consent',
    };
    const searchParams = new URLSearchParams(params);
    const url = `${authorization_endpoint}?${searchParams.toString()}`;
    return c.text(url);
  });

export default auth;
