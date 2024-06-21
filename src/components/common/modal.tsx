import { JSX } from 'hono/jsx/jsx-runtime';

export type ModalProps = {
  children: JSX.Element;
  handleClose: () => void;
};

export const Modal = ({ children, handleClose }: ModalProps) => {
  return (
    <div class="screen-overlay">
      <div class="device device-overlay" onClick={handleClose}>
        {children}
      </div>
    </div>
  );
};
