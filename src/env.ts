// export type Env = {
//   Bindings: {
// 	SESSION_KV: KVNamespace;
//   };
// };

import { Session } from './session';

export type Env = {
  Bindings: {
    SESSION_KV: KVNamespace;
    USER_KV: KVNamespace;
  };
  Variables: {
    session: Session<{
      challenge: string;
      userName: string;
      counter: number;
      loggedIn: boolean;
    }>;
  };
};
