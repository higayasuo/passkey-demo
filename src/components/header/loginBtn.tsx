type LoginBtnProps = {
  onClick: () => void;
};

export const LoginBtn = ({ onClick }: LoginBtnProps) => {
  return (
    <button class="login-btn" onClick={onClick}>
      サインイン・アカウント作成
    </button>
  );
};
