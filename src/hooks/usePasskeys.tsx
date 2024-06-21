import { useState } from 'hono/jsx';
import { hc } from 'hono/client';

import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

import app from '../index';

const client = hc<typeof app>('/');

export const usePasskeys = () => {
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authError, setAuthError] = useState('');
  const [unregSuccess, setUnregSuccess] = useState('');
  const [authenticatorsSuccess, setAuthenticatorsSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const registrationHandler = async (email: string) => {
    setRegSuccess('');
    setRegError('');
    setUsernameError('');
    // const username = document.getElementById('username') as HTMLInputElement;
    if (!email) {
      setUsernameError('email must not be empty');
      return;
    }
    const genResp = await client.api.passkey[
      'generate-registration-options'
    ].$post({
      json: { userName: email },
    });
    if (genResp.status === 400) {
      setRegError((await genResp.json()).error);
      return;
    }
    const options = await genResp.json();
    setRegSuccess(JSON.stringify(options, undefined, 2));
    let startResp;
    try {
      startResp = await startRegistration(options);
    } catch (e: any) {
      setRegError(e.message);
      return;
    }
    const verifyResp = await client.api.passkey['verify-registration'].$post({
      json: startResp,
    });
    if (verifyResp.status === 400 || verifyResp.status === 404) {
      setRegError((await verifyResp.json()).error);
      return;
    }
    const verifyJson = await verifyResp.json();
    if (verifyJson && verifyJson.verified) {
      setRegSuccess(JSON.stringify(verifyJson, undefined, 2));
      localStorage.setItem('has_passeky', 'true');
    } else {
      setRegError(JSON.stringify(verifyJson, undefined, 2));
    }
  };

  const authenticationHandler = async (email: string) => {
    setAuthSuccess('');
    setAuthError('');
    setUsernameError('');
    // const username = document.getElementById('username') as HTMLInputElement;
    if (!email) {
      setUsernameError('Username must not be empty');
      return;
    }
    const genResp = await client.api.passkey[
      'generate-authentication-options'
    ].$post({
      json: { userName: email },
    });
    if (genResp.status === 404) {
      setAuthError((await genResp.json()).error);
      return;
    }
    const options = await genResp.json();
    setAuthSuccess(JSON.stringify(options, undefined, 2));
    let startResp;
    try {
      startResp = await startAuthentication(options);
    } catch (e: any) {
      setAuthError(e.message);
      return;
    }
    const verifyResp = await client.api.passkey['verify-authentication'].$post({
      json: startResp,
    });
    if (verifyResp.status === 400 || verifyResp.status === 404) {
      setAuthError((await verifyResp.json()).error);
      return;
    }
    const verifyJson = await verifyResp.json();
    if (verifyJson && verifyJson.verified) {
      setAuthSuccess(JSON.stringify(verifyJson, undefined, 2));
    } else {
      setAuthError(JSON.stringify(verifyJson, undefined, 2));
    }
  };
  const unregistrationHandler = async (email: string) => {
    setUnregSuccess('');
    setUsernameError('');
    // const username = document.getElementById('username') as HTMLInputElement;
    if (!email) {
      setUsernameError('Username must not be empty');
      return;
    }
    const resp = await client.api.passkey['unregister'].$post({
      json: { userName: email },
    });
    if (resp.status === 200) {
      setUnregSuccess(JSON.stringify(await resp.json(), undefined, 2));
    }
  };
  const authenticatorsHandler = async (email: string) => {
    setAuthenticatorsSuccess('');
    setUsernameError('');
    // const username = document.getElementById('username') as HTMLInputElement;
    if (!email) {
      setUsernameError('Username must not be empty');
      return;
    }
    const resp = await client.api.passkey.authenticators.$get({
      query: { userName: email },
    });
    if (resp.status === 200) {
      setAuthenticatorsSuccess(JSON.stringify(await resp.json(), undefined, 2));
    }
  };

  return {
    regSuccess,
    regError,
    authSuccess,
    authError,
    unregSuccess,
    usernameError,
    authenticatorsSuccess,
    registrationHandler,
    authenticationHandler,
    unregistrationHandler,
    authenticatorsHandler,
  };
};
