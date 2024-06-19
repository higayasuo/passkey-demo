import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { getCookie, setCookie } from 'hono/cookie';

type Value = string | number | boolean;

export const EXPIRATION_TTL = 60 * 60 * 24;

const SESSION_COOKIE_NAME = '__session';

// type Keys<
//   S extends String = string,
//   N extends String = string,
//   B extends String = string
// > = {
//   StringValueKey?: S;
//   NumberValueKey?: N;
//   BooleanValueKey?: B;
// };

export class Session<T extends Record<string, Value> = {}> {
  #data: Record<string, Value> = {};

  #sessionId: string;

  #kv: KVNamespace;

  #expirationTtl: number;

  #loaded = false;

  constructor(
    sessionId: string,
    kv: KVNamespace,
    expirationTtl: number = EXPIRATION_TTL
  ) {
    this.#sessionId = sessionId;
    this.#kv = kv;
    this.#expirationTtl = expirationTtl;
  }

  public get sessionId() {
    return this.#sessionId;
  }

  public get expirationTtl() {
    return this.#expirationTtl;
  }

  public async loadData() {
    if (this.#loaded) {
      return;
    }

    const data = await this.#kv.get(this.sessionId);
    if (data) {
      this.#data = JSON.parse(data);
    } else {
      this.#data = {};
    }

    this.#loaded = true;
  }

  public async get<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    await this.loadData();
    return this.#data[key as string] as T[K];
  }

  // public async getString(
  //   key: K['StringValueKey']
  // ): Promise<string | undefined> {
  //   return this.get<string>(key as string);
  // }

  // public async getNumber(
  //   key: K['NumberValueKey']
  // ): Promise<number | undefined> {
  //   return this.get<number>(key as string);
  // }

  // public async getBoolean(
  //   key: K['BooleanValueKey']
  // ): Promise<boolean | undefined> {
  //   return this.get<boolean>(key as string);
  // }

  public async set<K extends keyof T>(key: K, value: T[K]) {
    await this.loadData();
    this.#data[key as string] = value;
    await this.#kv.put(this.sessionId, JSON.stringify(this.#data), {
      expirationTtl: this.expirationTtl,
    });
  }

  // public async setString(key: K['StringValueKey'], value: string) {
  //   return this.set<string>(key as string, value);
  // }

  // public async setNumber(key: K['NumberValueKey'], value: number) {
  //   return this.set<number>(key as string, value);
  // }

  // public async setBoolean(key: K['BooleanValueKey'], value: boolean) {
  //   return this.set<boolean>(key as string, value);
  // }

  public async delete<K extends keyof T>(key: K) {
    await this.loadData();
    delete this.#data[key as string];
    await this.#kv.put(this.sessionId, JSON.stringify(this.#data));
  }

  public async clear() {
    this.#data = {};
    await this.#kv.delete(this.sessionId);
  }
}

export const generateAndSetSessionId = (c: Context): string => {
  const sessionId = crypto.randomUUID();
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    path: '/',
    maxAge: EXPIRATION_TTL,
    sameSite: 'Strict',
  });
  return sessionId;
};

export const sessionMiddleware = createMiddleware(
  async (c: Context, next: () => Promise<void>) => {
    const sessionId =
      getCookie(c, SESSION_COOKIE_NAME) || generateAndSetSessionId(c);
    c.set('session', new Session(sessionId, c.env.SESSION_KV, EXPIRATION_TTL));
    await next();
  }
);
