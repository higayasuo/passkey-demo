import { useEffect, useState } from 'hono/jsx';

type ProfileProps = {
  email: string;
  handleLogout: () => void;
  handleRouteChange: () => void;
};

export const Profile = ({
  email,
  handleLogout,
  handleRouteChange,
}: ProfileProps) => {
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const device = document.querySelector('.device');
    device?.addEventListener('click', handleClose);
  });

  const handleClose = () => setOpen(false);
  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <nav class="profile" onClick={(e) => handleToggle(e)}>
      {open && (
        <table class="menu">
          <tr>
            <td onClick={handleRouteChange}>アカウント</td>
          </tr>

          <tr>
            <td onClick={handleLogout}>ログアウト</td>
          </tr>
        </table>
      )}
      <img src="/static/img/profile-icon.svg" alt="profile-icon" />
      <span>{email}</span>
    </nav>
  );
};
