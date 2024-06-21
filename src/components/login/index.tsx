import { Button } from '../common/button';
import { useAccount } from '../../hooks/useAccount';
import { useRouter } from '../../hooks/useRouter';
import { usePasskeys } from '../../hooks/usePasskeys';

const GoogleLogin = () => {
  const { handleGoogleLogin } = useAccount();

  return (
    <div class="google-login">
      <img src="/static/img/google-icon.svg" alt="google-icon" />
      <a href="#" onClick={handleGoogleLogin}>
        Googleアカウント連携
      </a>
    </div>
  );
};

const HasPasseky = () => {
  const { handleRouteChange } = useRouter();
  const { authSuccess, authError, authenticationHandler } = usePasskeys();
  const { email, handlePasskeyLogin } = useAccount();

  const handleAuthentication = async () => {
    await authenticationHandler(email);

    if (authSuccess && !authError) {
      handlePasskeyLogin();
      handleRouteChange('top');
    }
  };

  return (
    <div>
      <section class="passkey-login">
        <h2>サインイン</h2>
        <p>
          パスキーを使用してサインインする場合は、次へをクリックしてください。パスキー以外の方法でログインする場合は、その他のログイン方法から選択してください。
        </p>
        <input type="text" value={email} />
        <div class="btn-area">
          <Button
            text="戻る"
            color="secondary"
            size="small"
            onClick={() => handleRouteChange('top')}
          />
          <Button
            text="次へ"
            color="primary"
            size="small"
            onClick={handleAuthentication}
          />
        </div>
      </section>
      <hr />
      <section class="other-login">
        <p>別の方法でログインする</p>
        <GoogleLogin />
      </section>
    </div>
  );
};

const HasNoPasseky = () => {
  return (
    <div>
      <section class="no-passkey-login">
        <h2>サインイン・アカウント作成</h2>
        <p>Googleアカウントでサインイン・アカウント作成を行ってください。</p>
        <GoogleLogin />
      </section>
    </div>
  );
};

export const Login = () => {
  const { hasPasskey, email } = useAccount();

  return (
    <main class="login-page">
      {hasPasskey ? <HasPasseky email={email} /> : <HasNoPasseky />}
    </main>
  );
};
