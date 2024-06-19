import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { User, Authenticator } from './types';

const USER_PREFIX = 'v1:user:';
const USER_NAME_ID_PREFIX = 'v1:name_id:';
const AUTHENTICATOR_ID_USER_ID_PREFIX = 'v1:authenticator_id_user_id:';

const putOptions: KVNamespacePutOptions = { expirationTtl: 60 * 60 };

export const userKey = (id: string): string => `${USER_PREFIX}${id}`;
export const userNameIdKey = (name: string): string =>
  `${USER_NAME_ID_PREFIX}${name}`;
export const authenticatorIDUserIDKey = (id: string): string =>
  `${AUTHENTICATOR_ID_USER_ID_PREFIX}${id}`;

export const setUser = async (kv: KVNamespace, user: User): Promise<void> => {
  await kv.put(userKey(user.id), JSON.stringify(user), putOptions);
  await kv.put(userNameIdKey(user.name), user.id, putOptions);
};

export const getUserByID = async (
  kv: KVNamespace,
  id: string
): Promise<User | null> => {
  const data = await kv.get(userKey(id));
  return data ? JSON.parse(data) : null;
};

export const getUserByName = async (
  kv: KVNamespace,
  name: string
): Promise<User | null> => {
  const id = await kv.get(userNameIdKey(name));

  if (!id) {
    return null;
  }

  return getUserByID(kv, id);
};

export const deleteUserByID = async (
  kv: KVNamespace,
  id: string
): Promise<void> => {
  const user = await getUserByID(kv, id);

  if (user) {
    await kv.delete(userKey(user.id));
    await kv.delete(userNameIdKey(user.name));
    await Promise.all(
      user.authenticators.map((auth) =>
        kv.delete(authenticatorIDUserIDKey(auth.id))
      )
    );
  }
};

export const deleteUserByName = async (
  kv: KVNamespace,
  name: string
): Promise<void> => {
  const id = await kv.get(userNameIdKey(name));

  if (id) {
    await deleteUserByID(kv, id);
  }
};

export const findAuthenticator = (
  authenticators: Authenticator[],
  credentialID: Uint8Array
): Authenticator | null => {
  const id = isoBase64URL.fromBuffer(credentialID);
  return authenticators.find((auth) => auth.id === id) || null;
};

export const putAuthenticatorIDUserID = async (
  kv: KVNamespace,
  authenticatorID: string,
  userID: string
): Promise<void> => {
  await kv.put(authenticatorIDUserIDKey(authenticatorID), userID, putOptions);
};

// export const addAuthenticator = async (
//   kv: KVNamespace,
//   user: User,
//   authenticator: Authenticator
// ): Promise<void> => {
//   user.authenticators.push(authenticator);
//   await setUser(kv, user);
//   await kv.put(authenticatorIdUserIdKey(authenticator.id), user.id, putOptions);
// };

export const getUserAndAuthenticatorByCredentialID = async (
  kv: KVNamespace,
  credentialID: Uint8Array
): Promise<{ user: User; authenticator: Authenticator } | null> => {
  const authenticatorID = isoBase64URL.fromBuffer(credentialID);
  const userID = await kv.get(authenticatorIDUserIDKey(authenticatorID));
  if (!userID) {
    return null;
  }

  const user = await getUserByID(kv, userID);
  if (!user) {
    return null;
  }

  const authenticator = await findAuthenticator(
    user.authenticators,
    credentialID
  );
  return { user, authenticator: authenticator! };
};

export const deleteAuthenticator = async (
  kv: KVNamespace,
  user: User,
  authenticatorID: string
): Promise<void> => {
  const index: number = user.authenticators.findIndex(
    (auth) => auth.id === authenticatorID
  );
  if (index >= 0) {
    user.authenticators.splice(index, 1);
    await setUser(kv, user);
  }
  await kv.delete(authenticatorIDUserIDKey(authenticatorID));
};
