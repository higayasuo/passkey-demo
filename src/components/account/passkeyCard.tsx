import { useState, startViewTransition } from 'hono/jsx';
import { usePasskeys } from '../../hooks/usePasskeys';
import { Card } from './card';
import { useAccount } from '../../hooks/useAccount';
import { Modal } from '../common/modal';
import { Button } from '../common/button';

export type PasskeyInfo = {
  authenticators: any;
  createdAt: number;
  updatedAt: number;
  osName: string;
  osVersion: string;
};

const locale = 'ja-JP';
const onlyDate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const dateTime: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

type Progress = 'start' | 'confirm' | 'complete';

export const PasskeyCard = ({
  info,
  handleReload,
}: {
  info: PasskeyInfo;
  handleReload: () => Promise<void>;
}) => {
  const { unregistrationHandler } = usePasskeys();
  const { email } = useAccount();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<Progress>('start');

  const handleOpen = () => startViewTransition(() => setOpen(true));
  const handleClose = () => startViewTransition(() => setOpen(false));

  const handleDeletePasskey = async () => {
    if (!email) {
      return;
    }
    await unregistrationHandler(email);
    startViewTransition(() => setProgress('complete'));
  };

  const BaseCard = ({ onClick }: { onClick?: () => void }) => {
    return (
      <Card btnLabel="このパスキーを削除する" type="passkey" onClick={onClick}>
        <>
          <img src="/static/img/passkey-icon.svg" alt="passkey-icon" />
          {info && (
            <>
              <h4></h4>
              <div>
                <p>
                  登録日：
                  {new Date(info.createdAt).toLocaleDateString(
                    locale,
                    onlyDate
                  )}
                </p>
              </div>
              <div>
                <p>
                  登録OS：{info.osName} {info.osVersion}
                </p>
              </div>
              <div>
                <p>
                  最新の利用日：
                  {new Date(info.updatedAt).toLocaleDateString(
                    locale,
                    dateTime
                  )}
                </p>
              </div>
            </>
          )}
        </>
      </Card>
    );
  };

  const DeleteStart = () => {
    return (
      <>
        <h3>このパスキーを削除しますか？</h3>
        <BaseCard />
        <div class="btn-area">
          <Button
            text="キャンセル"
            size="medium"
            color="secondary"
            onClick={handleClose}
          />
          <Button
            text="削除する"
            size="medium"
            color="warning"
            onClick={() => startViewTransition(() => setProgress('confirm'))}
          />
        </div>
      </>
    );
  };

  const DeleteConfirm = () => {
    return (
      <>
        <h3>ご注意</h3>
        <img src="/static/img/warning-icon.svg" alt="warning-icon" />
        <p>
          このパスキーを削除すると、Googleアカウントでのみサインイン可能になります。
        </p>
        <p class="bold">
          生体認証などを利用してより安全にサインインできるパスキーををおすすめします。
        </p>
        <div class="btn-area">
          <Button
            text="キャンセル"
            size="medium"
            color="secondary"
            onClick={handleClose}
          />
          <Button
            text="削除する"
            size="medium"
            color="warning"
            onClick={handleDeletePasskey}
          />
        </div>
      </>
    );
  };
  const DeleteCompleted = () => {
    return (
      <>
        <h3>パスキーを削除しました</h3>
        <img src="/static/img/trash-icon.svg" alt="trash-icon" />
        <p>
          サーバーに登録されている情報は削除されました。デバイスに登録されている情報は、「
          <span class="bold">設定 &rarr; パスワード &rarr; マイパスワード</span>
          」から
          <span class="bold warning">ご自身で削除</span>してください
        </p>

        <div class="btn-area">
          <Button
            text="閉じる"
            size="medium"
            color="secondary"
            onClick={() => {
              handleReload();
              handleClose();
            }}
          />
        </div>
      </>
    );
  };

  return (
    <>
      {open && (
        <Modal handleClose={handleClose}>
          <div class="passkey-modal" onClick={(e) => e.stopPropagation()}>
            {progress === 'start' && <DeleteStart />}
            {progress === 'confirm' && <DeleteConfirm />}
            {progress === 'complete' && <DeleteCompleted />}
          </div>
        </Modal>
      )}
      <BaseCard onClick={handleOpen} />
    </>
  );
};
