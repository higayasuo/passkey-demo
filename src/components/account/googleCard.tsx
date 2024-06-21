import { useState } from 'hono/jsx';
import { Card } from './card';
import { Modal } from '../common/modal';
import { useAccount } from '../../hooks/useAccount';

export const GoogleCard = () => {
  const [open, setOpen] = useState(false);
  const { email } = useAccount();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      {open && (
        <Modal handleClose={handleClose}>
          <div class="signedin-modal">modal</div>
        </Modal>
      )}
      <Card
        // btnLabel="異なるGoogleアカウントに紐づける"
        type="google"
        // onClick={handleOpen}
      >
        <>
          <img src="/static/img/google-icon.svg" alt="google-icon" />
          <h4>{email}</h4>
          <div>
            <p>登録日：2024年6月21日</p>
            {/* <p>使用目的：バックアップ</p> */}
            {/* <p>登録OS：iOS 16.2</p> */}
          </div>
          <div>
            <p>最新の利用日：2024年6月21日 15:00</p>
          </div>
        </>
      </Card>
    </>
  );
};
