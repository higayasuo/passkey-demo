import { Header } from '../header';
import { useRouter } from '../../hooks/useRouter';

export const Device = () => {
  const { view } = useRouter();

  return (
    <div class="screen">
      <div class="device">
        <Header />
        {view}
      </div>
    </div>
  );
};
