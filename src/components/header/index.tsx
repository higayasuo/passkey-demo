import { useAccount } from '../../hooks/useAccount';
import { Profile } from './profile';
import { LoginBtn } from './loginBtn';
import { useEffect, useState, startViewTransition } from 'hono/jsx';
import { useRouter } from '../../hooks/useRouter';

export const Header = () => {
  const { email, login, handleLogout } = useAccount();
  const [view, setView] = useState(false);
  const { path, handleRouteChange } = useRouter();

  useEffect(() => {
    startViewTransition(() => setView(login));
  }, [login]);

  return (
    <>
      <header class="header">
        <div>
          <div class="title" onClick={() => handleRouteChange('top')}>
            <img src="/static/img/logo.svg" alt="logo" />
            <h1>Innolab Store</h1>
          </div>
          {view ? (
            <Profile
              email={email}
              handleRouteChange={() => handleRouteChange('account')}
              handleLogout={() => {
                handleLogout();
                handleRouteChange('top');
              }}
            />
          ) : (
            path !== 'login' && (
              <LoginBtn onClick={() => handleRouteChange('login')} />
            )
          )}
        </div>
        <section class="toolbar">
          <span>カートを見る</span>
        </section>
      </header>
    </>
  );
};
