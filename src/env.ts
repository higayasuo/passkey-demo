// export type Env = {
//   Bindings: {
// 	SESSION_KV: KVNamespace;
//   };
// };

import { Session } from './session';

export type Env = {
  Bindings: {
    SESSION_KV: KVNamespace;
  };
  Variables: {
    session: Session;
  };
};
