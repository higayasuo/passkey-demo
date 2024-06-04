import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import { hc } from "hono/client";
import type { AppType } from "./index";

const client = hc<AppType>("/");

function App() {
	return (
		<>
			<h1>Hello, hono/jsx/dom!</h1>
			<h2>Example of useState()</h2>
			<Counter />
			<h2>Example of API fetch()</h2>
			<ClockButton />
		</>
	);
}

const Counter = () => {
	const [count, setCount] = useState(0);
	return (
		<button type="button" onClick={() => setCount(count + 1)}>
			You clicked me {count} times
		</button>
	);
};

const ClockButton = () => {
	const [response, setResponse] = useState<string | null>(null);

	const handleClick = async () => {
		const response = await client.api.clock.$get();
		const data = await response.json();
		setResponse(JSON.stringify(data, null, 2));
	};

	return (
		<div>
			<button type="button" onClick={handleClick}>
				Get Server Time
			</button>
			{response && <pre>{response}</pre>}
		</div>
	);
};

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}

render(<App />, root);
