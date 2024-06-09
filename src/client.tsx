import { useState } from 'hono/jsx';
import { render } from 'hono/jsx/dom';
import { hc } from 'hono/client';
import type { AppType } from './index';

const client = hc<AppType>('/');

function App() {
  return (
    <>
      <h1>Hello, hono/jsx/dom!</h1>
      <h2>Local Counter</h2>
      <Counter />
      <h2>Session Counter</h2>
      <SessionCounter />
    </>
  );
}

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      You clicked me {count} times using local variable
    </button>
  );
};

const SessionCounter = () => {
  const [value, setValue] = useState(0);

  const handleClick = async () => {
    const response = await client.api.add.$post();
    const data = await response.json();
    setValue(data.value);
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>
        You clicked me {value} times using session variable
      </button>
    </div>
  );
};

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

render(<App />, root);
