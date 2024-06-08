type Value = string | number | boolean;

export class Session {
  #data: Record<string, Value> = {};

  #sessionId: string;

  #kv: KVNamespace;

  #expirationTtl: number;

  #loaded = false;

  constructor(
    sessionId: string,
    kv: KVNamespace,
    expirationTtl: number = 60 * 60 * 24
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
