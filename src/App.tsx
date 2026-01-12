import { useStorePersistence } from './hooks/useStorePersistence';
import { useUIStore } from './stores/useUIStore';
import { Layout } from './components/Layout';
import { LibraryView } from './components/Library/LibraryView';
import { BuilderView } from './components/Builder/BuilderView';
import './App.css';

function App() {
    // Initialize store persistence
    useStorePersistence();

    const activeView = useUIStore((state) => state.activeView);

    return (
        <Layout>
            {activeView === 'home' && <LibraryView />}
            {activeView === 'library' && <LibraryView />}
            {activeView === 'builder' && <BuilderView />}
            {activeView === 'settings' && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    <h2>Settings</h2>
                    <p>Coming soon in Phase 3...</p>
                </div>
            )}
        </Layout>
    );
}

export default App;
