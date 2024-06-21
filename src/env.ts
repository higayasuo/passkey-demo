// export type Env = {
//   Bindings: {
// 	SESSION_KV: KVNamespace;
//   };
// };

import { Session } from './session';

export type SessionVars = {
  challenge: string;
  userName: string;
  counter: number;
  loggedIn: boolean;
  state: string;
  nonce: string;
  code_verifier: string;
};

export type Env = {
  Bindings: {
    SESSION_KV: KVNamespace;
    USER_KV: KVNamespace;
    OIDC_CLIENT_SECRET: string;
  };
  Variables: {
    session: Session<SessionVars>;
  };
};
