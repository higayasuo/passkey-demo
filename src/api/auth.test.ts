import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import auth from './auth';

describe('api', () => {
  it('GET /auth-options', async () => {
    const client = testClient(auth);
    const res = await client['auth-options'].$get();
    expect(res.status).toEqual(200);
    const body = await res.json();
    console.log(body);
    //expect(body).toEqual({ message: 'Hello, World!' });
  });
});
