import { useStorePersistence } from './hooks/useStorePersistence';
import { useUIStore } from './stores/useUIStore';
import { Layout } from './components/Layout';
import { LibraryView } from './components/Library/LibraryView';
import { BuilderView } from './components/Builder/BuilderView';
import { HomeView } from './components/Home/HomeView';
import { ImportView } from './components/Import';
import { SettingsView } from './components/Settings/SettingsView';
import './App.css';

function App() {
    // Initialize store persistence
    useStorePersistence();

    const activeView = useUIStore((state) => state.activeView);

    return (
        <Layout>
            {activeView === 'home' && <HomeView />}
            {activeView === 'library' && <LibraryView />}
            {activeView === 'builder' && <BuilderView />}
            {activeView === 'import' && <ImportView />}
            {activeView === 'settings' && <SettingsView />}
        </Layout>
    );
}

export default App;
