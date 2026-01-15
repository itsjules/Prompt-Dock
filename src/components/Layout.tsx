import { useUIStore } from '../stores/useUIStore';
import { Layers, Library, Settings, Home } from 'lucide-react';
import './Layout.css';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const { activeView, setActiveView } = useUIStore();

    return (
        <div className="layout">
            <header className="layout-header">
                <div className="logo-section" onClick={() => setActiveView('home')} style={{ cursor: 'pointer' }}>
                    <h2>PromptDock</h2>
                </div>
                <nav className="main-nav">
                    <button
                        className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
                        onClick={() => setActiveView('home')}
                        title="Home"
                    >
                        <Home size={20} />
                    </button>
                    <button
                        className={`nav-item ${activeView === 'library' ? 'active' : ''}`}
                        onClick={() => setActiveView('library')}
                        title="Library"
                    >
                        <Library size={20} />
                    </button>
                    <button
                        className={`nav-item ${activeView === 'builder' ? 'active' : ''}`}
                        onClick={() => setActiveView('builder')}
                        title="Builder"
                    >
                        <Layers size={20} />
                    </button>
                    {/* Settings placeholder for now */}
                    <button
                        className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveView('settings')}
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </nav>
            </header>
            <main className="layout-content">
                {children}
            </main>
        </div>
    );
};
