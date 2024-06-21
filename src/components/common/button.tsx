type ButtonProps = {
  text: string;
  size: 'small' | 'medium' | 'large';
  color: 'primary' | 'secondary' | 'warning';
  onClick?: () => void;
};

export const Button = ({ text, size, color, onClick }: ButtonProps) => {
  const sizeClass =
    size === 'small'
      ? 'btn-small'
      : size === 'medium'
      ? 'btn-medium'
      : 'btn-large';
  const colorClass =
    color === 'primary'
      ? 'btn-primary'
      : color === 'secondary'
      ? 'btn-secondary'
      : 'btn-warning';
  return (
    <button class={`btn ${sizeClass} ${colorClass}`} onClick={onClick}>
      {text}
    </button>
  );
};
