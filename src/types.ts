import { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import * as jose from 'jose';

export type User = {
  id: string;
  name: string;
  oidcAccount: OIDCAccount;
  authenticators: Authenticator[];
  //registered: boolean;
};

export type Authenticator = {
  id: string;
  publicKey: string;
  counter: number;
  osName: string;
  osVersion: string;
  createdAt: number;
  updatedAt: number;
  transports: AuthenticatorTransportFuture[];
  selectedTransports: AuthenticatorTransportFuture[];
};

export type OIDCAccount = {
  iss: string;
  sub: string;
  createdAt: number;
  updatedAt: number;
};

export type AuthParams = {
  state: string;
  nonce: string;
  code_verifier: string;
};

export type PubKeys = {
  keys: jose.JWK[];
};
