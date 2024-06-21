import { useState } from 'hono/jsx';
import { hc } from 'hono/client';

import app from '../index';

const client = hc<typeof app>('/');

export const useGoogleAuth = () => {
  const [optError, setOptError] = useState<string>('');

  const handleGetOption = async () => {
    setOptError('');
    const res = await client.google.options.$get();

    if (res.status === 400) {
      setOptError('faild to get oidc url');
      return;
    }

    return await res.text();
  };

  const handleGoogleAuth = async () => {
    const url = await handleGetOption();
    if (!url) {
      return;
    }
    window.location.href = url;
  };

  return { optError, handleGetOption, handleGoogleAuth };
};
