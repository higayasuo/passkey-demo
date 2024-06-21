import { startViewTransition, useEffect, useState } from 'hono/jsx';
import { Modal } from '../common/modal';
import { Button } from '../common/button';
import { useAccount } from '../../hooks/useAccount';
import { usePasskeys } from '../../hooks/usePasskeys';

type SigninModalProps = {
  type: 'signin' | 'signup';
  handleClose: () => void;
};

const SiginedInModal = ({ type, handleClose }: SigninModalProps) => {
  // const { handleRouteChange } = useRouter();
  const { email, handlePasskeyLogin } = useAccount();
  const { regSuccess, regError, registrationHandler } = usePasskeys();

  const handleRegisterPasskey = async () => {
    await registrationHandler(email);
    if (!regSuccess && regError) {
      // TODO エラーメッセージを表示する
      // confirm(regError);
      return;
    }
    handlePasskeyLogin();
    handleClose();
  };

  const title =
    type === 'signin' ? 'ログインしました！' : 'アカウントが作成されました！';

  return (
    <Modal handleClose={handleClose}>
      <div class="signedin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <img
          src="/static/img/passkey-cheked-icon.svg"
          alt="passkey-cheked-icon"
        />
        <p>Innolab Storeをお楽しみください！</p>
        {/* TODO パスキーを作成する文言を入れる */}
        <div class="qa">
          <h4>パスキーを作成しませんか？</h4>
          <p>
            パスキーを作成するとお使いの端末の生体認証などを利用してログインすることができます。
          </p>
        </div>
        <div class="btn-area">
          <Button
            text="パスキーをを作成する"
            color="primary"
            onClick={handleRegisterPasskey}
            size="large"
          />
          <Button
            text="この画面を閉じてお買い物を楽しむ"
            color="secondary"
            onClick={handleClose}
            size="large"
          />
          {/* <Button
            text="アカウント画面を見る"
            color="primary"
            onClick={() => handleRouteChange('account')}
            size="large"
          /> */}
        </div>
      </div>
    </Modal>
  );
};

export const Top = () => {
  const [openModal, setOpenModal] = useState(false);
  const { handleLogin, hasPasskey } = useAccount();

  const handleOpenModal = () => startViewTransition(() => setOpenModal(true));
  const handleCloseModal = () => {
    startViewTransition(() => setOpenModal(false));
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userName = searchParams.get('userName');

    if (userName) {
      handleLogin(userName);
      if (localStorage.getItem('has_passkey') === 'false') {
        handleOpenModal();
      }
      window.history.replaceState({}, '', '/');
    }
  }, [hasPasskey]);

  return (
    <main class="top-page">
      {openModal && (
        <SiginedInModal type="signup" handleClose={handleCloseModal} />
      )}
      <h2 class="main-color">夏インテリアの季節！</h2>
      <p class="main-color">夏にぴったりなインテリアが見つかります</p>
      <img src="/static/img/main-image.svg" alt="main-image" />
    </main>
  );
};
