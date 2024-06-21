import {
  createContext,
  startViewTransition,
  useContext,
  useEffect,
  useState,
} from 'hono/jsx';
import { JSX } from 'hono/jsx/jsx-runtime';
import { Login } from '../components/login';
import { Top } from '../components/top';
import { Account } from '../components/account';

type Path = 'top' | 'login' | 'account';

const PathSettings: Record<Path, JSX.Element> = {
  top: <Top />,
  login: <Login />,
  account: <Account />,
};

type AppContextType = {
  path: Path;
  setPath: (path: Path) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
  const [path, setPath] = useState<Path>('top');

  return (
    <AppContext.Provider value={{ path, setPath }}>
      {children}
    </AppContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(AppContext);
  const [view, setView] = useState<JSX.Element>(<Top />);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }

  useEffect(() => {
    startViewTransition(() => setView(PathSettings[context.path]));
  }, [context.path]);

  const handleRouteChange = (path: Path) => {
    localStorage.setItem('path', path);
    context.setPath(path);
  };

  return { ...context, view, handleRouteChange };
};
