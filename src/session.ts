import { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { getCookie, setCookie } from 'hono/cookie';

type Value = string | number | boolean;

export const EXPIRATION_TTL = 60 * 60 * 24;

const SESSION_COOKIE_NAME = '__session';

export class Session {
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

  private async get<T>(key: string): Promise<T | undefined> {
    await this.loadData();
    return this.#data[key] as T;
  }

  public async getString(key: string): Promise<string | undefined> {
    return this.get<string>(key);
  }

  public async getNumber(key: string): Promise<number | undefined> {
    return this.get<number>(key);
  }

  public async getBoolean(key: string): Promise<boolean | undefined> {
    return this.get<boolean>(key);
  }

  private async set<T extends Value>(key: string, value: T) {
    await this.loadData();
    this.#data[key] = value;
    await this.#kv.put(this.sessionId, JSON.stringify(this.#data), {
      expirationTtl: this.expirationTtl,
    });
  }

  public async setString(key: string, value: string) {
    return this.set<string>(key, value);
  }

  public async setNumber(key: string, value: number) {
    return this.set<number>(key, value);
  }

  public async setBoolean(key: string, value: boolean) {
    return this.set<boolean>(key, value);
  }

  public async delete(key: string) {
    await this.loadData();
    delete this.#data[key];
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
