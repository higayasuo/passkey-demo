import { AuthenticatorTransportFuture } from '@simplewebauthn/types';

export type User = {
  id: string;
  name: string;
  authenticators: Authenticator[];
  registered: boolean;
};

export type Authenticator = {
  id: string;
  publicKey: string;
  counter: number;
  osName: string;
  osVersion: string;
  createdAt: number;
  updatedAt: number;
  transports?: AuthenticatorTransportFuture[];
};
