import { useEffect, useState } from 'hono/jsx';
import { useGoogleAuth } from './useGoogleAuth';

export const useAccount = () => {
  const [email, setEmail] = useState<string>('');
  const [hasPasskey, setHasPasskey] = useState<string>('');
  const [login, setLogin] = useState<boolean>(false);
  const { handleGoogleAuth } = useGoogleAuth();

  useEffect(() => {
    const email = localStorage.getItem('email');
    const hasPasskey = localStorage.getItem('has_passeky');
    const login = localStorage.getItem('login');
    if (email) {
      setEmail(email);
    }
    if (hasPasskey) {
      setHasPasskey(hasPasskey);
    }
    setLogin(toBoolean(login || 'false'));
  }, [localStorage]);

  const toBoolean = (booleanStr: string) => {
    return booleanStr.toLowerCase() === 'true';
  };

  const handleGoogleLogin = () => {
    // TODO 本来はIDトークンが返ってきたタイミングでフラグを切り替える
    !hasPasskey && localStorage.setItem('is_created', 'true');
    localStorage.setItem('login', 'true');
    handleGoogleAuth();
  };

  const isCreated = (): boolean => {
    // const loginType = localStorage.getItem('login_type');
    // localStorage.removeItem('login_type');

    // return !hasPasskey && loginType === 'google';
    const loginType = localStorage.getItem('is_created');
    localStorage.removeItem('is_created');

    return loginType ? toBoolean(loginType) : false;
  };

  const handleLogin = (email: string) => {
    localStorage.setItem('email', email);
    localStorage.setItem('login', 'true');
    setEmail(() => email);
  };

  const handlePasskeyLogin = () => {
    localStorage.setItem('login', 'true');
    setLogin(() => true);
  };

  const handleLogout = () => {
    localStorage.setItem('login', 'false');
    localStorage.removeItem('login_type');
    setLogin(() => false);
    setEmail(() => '');
  };

  return {
    email,
    login,
    hasPasskey,
    handleLogin,
    handleLogout,
    handleGoogleLogin,
    isCreated,
    handlePasskeyLogin,
  };
};
