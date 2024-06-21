import { JSX } from 'hono/jsx/jsx-runtime';
import { GoogleCard } from './googleCard';
import { PasskeyCard, PasskeyInfo } from './passkeyCard';
import { Button } from '../common/button';
import { usePasskeys } from '../../hooks/usePasskeys';
import { useAccount } from '../../hooks/useAccount';
import { useEffect, useState } from 'hono/jsx';

type ContainerProps = {
  title: string;
  children: JSX.Element;
};

const Container = ({ title, children }: ContainerProps) => {
  return (
    <section class="container">
      <h3>{title}</h3>
      {children}
    </section>
  );
};

type QAProps = {
  question: string;
  answer: string;
};

const QA = ({ question, answer }: QAProps) => {
  return (
    <div class="qa">
      <h4>{question}</h4>
      <p>{answer}</p>
    </div>
  );
};

export const Account = () => {
  const [passkeyInfos, setPasskeyInfos] = useState<PasskeyInfo[]>([]);
  const {
    authenticatorsHandler,
    authenticatorsSuccess,
    usernameError,
    registrationHandler,
    regError,
  } = usePasskeys();
  const { email, hasPasskey } = useAccount();

  useEffect(() => {
    setPasskeyInfos(() => []);
    console.log('passkeyInfos :>> ', passkeyInfos);
    console.log('authenticatorsSuccess :>> ', authenticatorsSuccess);
    if (!email) {
      return;
    }
    if (authenticatorsSuccess.length > 0) {
      const json = JSON.parse(authenticatorsSuccess);
      setPasskeyInfos(() => json.authenticators);
      return;
    } else {
      setPasskeyInfos(() => []);
    }

    const f = async () => {
      await authenticatorsHandler(email);
      if (usernameError) {
        return;
      }
    };
    f();
  }, [email, hasPasskey, authenticatorsSuccess]);

  const handleRegisterPasskey = async () => {
    await registrationHandler(email);
    await authenticatorsHandler(email);
    if (regError) {
      console.error(regError);
    }
  };

  const handleReload = async () => {
    setPasskeyInfos(() => []);
  };

  return (
    <main class="account-page">
      <h2>アカウント管理</h2>

      <Container title="現在のログイン設定">
        <ol>
          <li>Googleアカウントによるサインイン</li>
          {hasPasskey && passkeyInfos.length > 0 && (
            <li>パスキーを利用したサインイン</li>
          )}
        </ol>
      </Container>
      <Container title="アカウント情報">
        <GoogleCard />
      </Container>
      <Container title="設定されているパスキー">
        <div class="passkey-div">
          <div class="card-area">
            {/* TODO ローカル以外のパスキーもある */}
            {!hasPasskey && (
              <>
                <h4>現在、パスキーはありません。</h4>
                <img
                  class="auth-icon"
                  src="/static/img/auth-icon.svg"
                  alt="auth-icon"
                />
              </>
            )}

            {hasPasskey &&
              passkeyInfos.length !== 0 &&
              passkeyInfos.map((info, index) => (
                <PasskeyCard info={info} handleReload={handleReload} />
              ))}
          </div>
          <Button
            text="新たにパスキーを作成する"
            size="large"
            color="primary"
            onClick={handleRegisterPasskey}
          />
          <p>
            別のデバイスを使用するときなど、新たにパスキーを作成してください。
          </p>
          <div class="qa-area">
            <QA
              question="パスキーをオススメする理由"
              answer="パスキーを使えば、複雑なパスワードを覚える必要はありません。"
            />
            <QA
              question="パスキーとは何ですか？"
              answer="パスキーは、指紋、顔、またはスクリーンロックを使用して作成する暗号化されたデジタルキーです。"
            />
            <QA
              question="パスキーはどこに保存されますか？"
              answer="パスキーはパスワードマネージャーに保存されるため、他のデバイスでもサインインできます。"
            />
            <QA
              question="デバイスをなくすとどうなりますか？"
              answer="別のデバイスを手に入れ、同じOSアカウントでログインすると、前と同様にパスキーが利用できます。バックアップ用のGoogleアカウントを登録しておけば、OSのアカウントは関係なく、Googleアカウントでこのサービスを利用できます。"
            />
          </div>
        </div>
      </Container>
    </main>
  );
};
