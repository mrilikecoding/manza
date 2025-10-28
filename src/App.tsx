import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
          Manza
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          A lightweight markdown editor with GitHub-style rendering
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
        >
          Count is {count}
        </button>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Foundation setup complete. Ready for feature development.
        </p>
      </div>
    </div>
  );
}

export default App;
