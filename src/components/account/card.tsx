import { JSX } from 'hono/jsx/jsx-runtime';

type CardProps = {
  type: 'google' | 'passkey';
  children: JSX.Element;
  btnLabel?: string;
  onClick?: () => void;
};

export const Card = ({ children, btnLabel, type, onClick }: CardProps) => {
  const cardType = type === 'google' ? 'google-card' : 'passkey-card';
  return (
    <div class={`card ${cardType}`}>
      <div class="card-content">{children}</div>
      {btnLabel && onClick && (
        <div class="card-footer">
          <button onClick={onClick}>{btnLabel}</button>
        </div>
      )}
    </div>
  );
};
