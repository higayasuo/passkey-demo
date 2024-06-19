import { isoBase64URL } from '@simplewebauthn/server/helpers';

export const randomUint8Array = (len = 32): Uint8Array => {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return buf;
};

export const randomBase64URL = (len = 32): string => {
  const buf = randomUint8Array(len);
  return isoBase64URL.fromBuffer(buf);
};
