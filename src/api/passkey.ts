import { Hono } from 'hono';

import {
  GenerateAuthenticationOptionsOpts,
  VerifiedAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { User, Authenticator } from '../types';
import {
  getUserByName,
  setUser,
  findAuthenticator,
  putAuthenticatorIDUserID,
  deleteUserByName,
} from '../user';
import { Env } from '../env';
import { randomBase64URL } from '../utils';
import { sessionMiddleware } from '../session';
import Bowser from 'bowser';

const { RP_ID, RP_NAME, ORIGIN } = import.meta.env;

//console.log('env', import.meta.env);

const schema = z.object({
  userName: z.string().min(1),
});

const passkey = new Hono<Env>()
  //.use(sessionMiddleware)
  .post(
    '/generate-registration-options',
    zValidator('json', schema),
    async (c) => {
      const { userName } = await c.req.valid('json');

      const user: User = (await getUserByName(c.env.USER_KV, userName)) || {
        id: randomBase64URL(),
        name: userName,
        authenticators: [],
        registered: false,
      };

      if (user.registered) {
        return c.json(
          {
            error: `User is already registered: ${userName}`,
          },
          400
        );
      }

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: user.id,
        userName: user.name,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: user.authenticators.map((authenticator) => {
          return {
            id: isoBase64URL.toBuffer(authenticator.id),
            type: 'public-key',
            transports: authenticator.transports,
          };
        }),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          requireResidentKey: true,
          authenticatorAttachment: 'platform',
        },
        supportedAlgorithmIDs: [-7, -257],
      });

      setUser(c.env.USER_KV, user);
      await c.var.session.set('challenge', options.challenge);
      await c.var.session.set('userName', userName);

      return c.json(options, 200);
    }
  )
  .post('/verify-registration', async (c) => {
    const body: RegistrationResponseJSON = await c.req.json();
    const userName = await c.var.session.get('userName');

    if (!userName) {
      return c.json({ error: `No user name found: ${userName}` }, 404);
    }

    const user = await getUserByName(c.env.USER_KV, userName);

    if (!user) {
      return c.json({ error: `No user found: ${userName}` }, 404);
    }

    const expectedChallenge = await c.var.session.get('challenge');
    if (!expectedChallenge) {
      return c.json({ error: 'No challenge found' }, 400);
    }

    const opts: VerifyRegistrationResponseOpts = {
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    };

    let verification;
    try {
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      console.error(error);
      return c.json({ error: 'Can not validate response signature' }, 400);
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return c.json({ error: 'Can not validate response signature' }, 400);
    }

    const { credentialPublicKey, credentialID, counter } = registrationInfo;
    const existingAuthenticator = findAuthenticator(
      user.authenticators,
      credentialID
    );

    const now = Date.now();
    if (!existingAuthenticator) {
      const ua = c.req.header('User-Agent');
      const bowser = Bowser.parse(ua || '');
      const os = bowser.os;
      const newAuthenticator: Authenticator = {
        id: isoBase64URL.fromBuffer(credentialID),
        publicKey: isoBase64URL.fromBuffer(credentialPublicKey),
        counter,
        createdAt: now,
        updatedAt: now,
        osName: os.name || '',
        osVersion: os.version || '',
        transports: body.response.transports,
      };
      user.authenticators.push(newAuthenticator);
      putAuthenticatorIDUserID(c.env.USER_KV, newAuthenticator.id, user.id);
    }

    user.registered = true;
    await setUser(c.env.USER_KV, user);
    await c.var.session.delete('challenge');
    await c.var.session.set('loggedIn', true);

    return c.json({ verified: true }, 200);
  })
  .post(
    '/generate-authentication-options',
    zValidator('json', schema),
    async (c) => {
      const { userName } = await c.req.valid('json');

      if (!userName) {
        return c.json({ error: `No user name found: ${userName}` }, 404);
      }

      const user = await getUserByName(c.env.USER_KV, userName);

      if (!user) {
        return c.json({ error: 'user not found' }, 404);
      }

      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: user.authenticators.map((authenticator) => ({
          id: isoBase64URL.toBuffer(authenticator.id),
          type: 'public-key',
          //transports: authenticator.transports,
          transports: ['internal'],
        })),
        userVerification: 'preferred',
        rpID: RP_ID,
      };

      const options = await generateAuthenticationOptions(opts);

      await c.var.session.set('challenge', options.challenge);
      await c.var.session.set('userName', userName);

      return c.json(options, 200);
    }
  )
  .post('/verify-authentication', async (c) => {
    const body: AuthenticationResponseJSON = await c.req.json();
    const userName = await c.var.session.get('userName');

    if (!userName) {
      return c.json({ error: `No user name found: ${userName}` }, 404);
    }

    const user = await getUserByName(c.env.USER_KV, userName);

    if (!user) {
      return c.json({ error: `User not found: ${userName}` }, 404);
    }

    const expectedChallenge = await c.var.session.get('challenge');

    if (!expectedChallenge) {
      return c.json({ error: `Challenge not found` }, 404);
    }

    const credentialID = isoBase64URL.toBuffer(body.id);
    const authenticator = findAuthenticator(user.authenticators, credentialID);

    if (!authenticator) {
      return c.json({ error: 'authenticator is not registered' }, 404);
    }

    let verification: VerifiedAuthenticationResponse;

    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: body,
        expectedChallenge: expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: isoBase64URL.toBuffer(authenticator.id),
          credentialPublicKey: isoBase64URL.toBuffer(authenticator.publicKey),
          counter: authenticator.counter,
          transports: authenticator.transports,
        },
        requireUserVerification: false,
      };

      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 400);
    }

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      return c.json({ error: 'authenticate signature is failed' }, 400);
    }

    authenticator.counter = authenticationInfo.newCounter;
    authenticator.updatedAt = Date.now();

    await setUser(c.env.USER_KV, user);
    await c.var.session.set('loggedIn', true);
    await c.var.session.delete('challenge');

    return c.json(
      {
        verified: true,
      },
      200
    );
  })
  .post('/unregister', zValidator('json', schema), async (c) => {
    const { userName } = await c.req.valid('json');

    await deleteUserByName(c.env.USER_KV, userName);
    return c.json({ success: true }, 200);
  })
  .get('/authenticators', zValidator('query', schema), async (c) => {
    const { userName } = await c.req.valid('query');

    const user = await getUserByName(c.env.USER_KV, userName);

    if (!user) {
      return c.json({ error: `User not found: ${userName}` }, 404);
    }
    return c.json({ authenticators: user.authenticators }, 200);
  });

export default passkey;
