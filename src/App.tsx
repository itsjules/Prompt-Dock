import { useState } from 'react';
import { useStorePersistence } from './hooks/useStorePersistence';
import './App.css';

function App() {
    const [count, setCount] = useState(0);

    // Initialize store persistence
    useStorePersistence();

    return (
        <div className="App">
            <header className="App-header">
                <h1>PromptDock</h1>
                <p>Modular Prompt Building Tool</p>
                <button onClick={() => setCount((count) => count + 1)}>
                    Count: {count}
                </button>
                <p className="info">
                    Press <kbd>Ctrl+Shift+P</kbd> (or <kbd>Cmd+Shift+P</kbd> on Mac) to toggle this window
                </p>
            </header>
        </div>
    );
}

export default App;
