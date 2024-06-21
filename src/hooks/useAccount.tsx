import { useEffect, useState } from 'hono/jsx';
import { useGoogleAuth } from './useGoogleAuth';

const EMAIL = 'email';
const HAS_PASSKEY = 'has_passekey';
const LOGIN = 'login';
const IS_CREATED = 'is_created';

export const useAccount = () => {
  const [email, setEmail] = useState<string>('');
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);
  const [login, setLogin] = useState<boolean>(false);
  const { handleGoogleAuth } = useGoogleAuth();

  useEffect(() => {
    const email = localStorage.getItem(EMAIL);
    const hasPasskey = toBoolean(localStorage.getItem(HAS_PASSKEY) || 'false');
    const login = toBoolean(localStorage.getItem(LOGIN) || 'false');
    console.log('useAccount hasPasskey :>> ', hasPasskey);
    if (email) {
      setEmail(() => email);
    }
    setHasPasskey(() => hasPasskey);
    setLogin(login);
  }, [
    localStorage.getItem(EMAIL),
    localStorage.getItem(HAS_PASSKEY),
    localStorage.getItem(LOGIN),
  ]);

  const toBoolean = (booleanStr: string) => {
    return booleanStr.toLowerCase() === 'true';
  };

  const handleGoogleLogin = () => {
    // TODO 本来はIDトークンが返ってきたタイミングでフラグを切り替える
    !hasPasskey && localStorage.setItem(IS_CREATED, 'true');
    handleGoogleAuth();
  };

  const isCreated = (): boolean => {
    const loginType = localStorage.getItem(IS_CREATED);
    localStorage.removeItem(IS_CREATED);

    return loginType ? toBoolean(loginType) : false;
  };

  const handleLogin = (email: string) => {
    localStorage.setItem(EMAIL, email);
    localStorage.setItem(LOGIN, 'true');
    setEmail(() => email);
    setLogin(() => true);
  };

  const handlePasskeyLogin = () => {
    localStorage.setItem(LOGIN, 'true');
    setLogin(() => true);
  };

  const handleLogout = () => {
    localStorage.setItem(LOGIN, 'false');
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
