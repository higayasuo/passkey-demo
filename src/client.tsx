// import { useState } from 'hono/jsx';
import { render } from 'hono/jsx/dom';
// import { hc } from 'hono/client';

// import {
//   startAuthentication,
//   startRegistration,
// } from '@simplewebauthn/browser';

import app from './index';
import { AppProvider } from './hooks/useRouter';
import { Device } from './components/device';

// const client = hc<typeof app>('/');

// function App() {
//   const [regSuccess, setRegSuccess] = useState('');
//   const [regError, setRegError] = useState('');
//   const [authSuccess, setAuthSuccess] = useState('');
//   const [authError, setAuthError] = useState('');
//   const [unregSuccess, setUnregSuccess] = useState('');
//   const [authenticatorsSuccess, setAuthenticatorsSuccess] = useState('');
//   const [usernameError, setUsernameError] = useState('');

//   const registrationHandler = async () => {
//     setRegSuccess('');
//     setRegError('');
//     setUsernameError('');

//     const username = document.getElementById('username') as HTMLInputElement;
//     if (!username || !username.value) {
//       setUsernameError('Username must not be empty');
//       return;
//     }

//     const genResp = await client.api.passkey[
//       'generate-registration-options'
//     ].$post({
//       json: { userName: username.value },
//     });

//     if (genResp.status === 400) {
//       setRegError((await genResp.json()).error);
//       return;
//     }

//     const options = await genResp.json();
//     setRegSuccess(JSON.stringify(options, undefined, 2));

//     let startResp;
//     try {
//       startResp = await startRegistration(options);
//     } catch (e: any) {
//       setRegError(e.message);
//       return;
//     }
//     const verifyResp = await client.api.passkey['verify-registration'].$post({
//       json: startResp,
//     });

//     if (verifyResp.status === 400 || verifyResp.status === 404) {
//       setRegError((await verifyResp.json()).error);
//       return;
//     }

//     const verifyJson = await verifyResp.json();

//     if (verifyJson && verifyJson.verified) {
//       setRegSuccess(JSON.stringify(verifyJson, undefined, 2));
//     } else {
//       setRegError(JSON.stringify(verifyJson, undefined, 2));
//     }
//   };

//   const authenticationHandler = async () => {
//     setAuthSuccess('');
//     setAuthError('');
//     setUsernameError('');

//     const username = document.getElementById('username') as HTMLInputElement;
//     if (!username || !username.value) {
//       setUsernameError('Username must not be empty');
//       return;
//     }

//     const genResp = await client.api.passkey[
//       'generate-authentication-options'
//     ].$post({
//       json: { userName: username.value },
//     });

//     if (genResp.status === 404) {
//       setAuthError((await genResp.json()).error);
//       return;
//     }

//     const options = await genResp.json();
//     setAuthSuccess(JSON.stringify(options, undefined, 2));

//     let startResp;
//     try {
//       startResp = await startAuthentication(options);
//     } catch (e: any) {
//       setAuthError(e.message);
//       return;
//     }
//     const verifyResp = await client.api.passkey['verify-authentication'].$post({
//       json: startResp,
//     });

//     if (verifyResp.status === 400 || verifyResp.status === 404) {
//       setAuthError((await verifyResp.json()).error);
//       return;
//     }

//     const verifyJson = await verifyResp.json();

//     if (verifyJson && verifyJson.verified) {
//       setAuthSuccess(JSON.stringify(verifyJson, undefined, 2));
//     } else {
//       setAuthError(JSON.stringify(verifyJson, undefined, 2));
//     }
//   };

//   const unregistrationHandler = async () => {
//     setUnregSuccess('');
//     setUsernameError('');

//     const username = document.getElementById('username') as HTMLInputElement;
//     if (!username || !username.value) {
//       setUsernameError('Username must not be empty');
//       return;
//     }

//     const resp = await client.api.passkey['unregister'].$post({
//       json: { userName: username.value },
//     });

//     if (resp.status === 200) {
//       setUnregSuccess(JSON.stringify(await resp.json(), undefined, 2));
//     }
//   };

//   const authenticatorsHandler = async () => {
//     setAuthenticatorsSuccess('');
//     setUsernameError('');

//     const username = document.getElementById('username') as HTMLInputElement;
//     if (!username || !username.value) {
//       setUsernameError('Username must not be empty');
//       return;
//     }

//     const resp = await client.api.passkey.authenticators.$get({
//       query: { userName: username.value },
//     });

//     if (resp.status === 200) {
//       setAuthenticatorsSuccess(JSON.stringify(await resp.json(), undefined, 2));
//     }
//   };

//   return (
//     <>
//       <h1>Passkey Demo</h1>

//       <section>
//         <input
//           type="text"
//           id="username"
//           autoComplete="username webauthn"
//           autofocus
//         />
//         <span class="error">{usernameError}</span>
//       </section>

//       <section id="registration">
//         <button onClick={registrationHandler}>
//           <strong>Register</strong>
//         </button>
//         <p class="success">{regSuccess}</p>
//         <p class="error">{regError}</p>
//       </section>

//       <section id="authentication">
//         <button onClick={authenticationHandler}>
//           <strong>Authenticate</strong>
//         </button>
//         <p class="success">{authSuccess}</p>
//         <p class="error">{authError}</p>
//       </section>

//       <section id="unregistration">
//         <button onClick={unregistrationHandler}>
//           <strong>Unregister</strong>
//         </button>
//         <p class="success">{unregSuccess}</p>
//       </section>

//       <section id="authenticators">
//         <button onClick={authenticatorsHandler}>
//           <strong>Authenticators</strong>
//         </button>
//         <p class="success">{authenticatorsSuccess}</p>
//       </section>
//     </>
//   );
// }

function App() {
  return (
    <AppProvider>
      <Device />
    </AppProvider>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

render(<App />, root);
