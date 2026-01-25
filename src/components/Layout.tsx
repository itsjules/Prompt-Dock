import { useUIStore } from '../stores/useUIStore';
import { Layers, Library, Settings, Home, Download } from 'lucide-react';
import './Layout.css';
import logo from '../assets/logo.png';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const { activeView, setActiveView } = useUIStore();

    return (
        <div className="layout">
            <div className="layout-background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>

            <nav className="top-navbar">
                <div className="nav-level-left">
                    <div className="dock-logo" onClick={() => setActiveView('home')} title="Home">
                        <img src={logo} alt="PromptDock" />
                    </div>
                </div>

                <div className="nav-level-right">
                    <div className="dock-items">
                        <button
                            className={`dock-item ${activeView === 'home' ? 'active' : ''}`}
                            onClick={() => setActiveView('home')}
                            title="Home"
                        >
                            <Home size={18} />
                        </button>
                        <button
                            className={`dock-item ${activeView === 'library' ? 'active' : ''}`}
                            onClick={() => setActiveView('library')}
                            title="Library"
                        >
                            <Library size={18} />
                        </button>
                        <button
                            className={`dock-item ${activeView === 'builder' ? 'active' : ''}`}
                            onClick={() => setActiveView('builder')}
                            title="Builder"
                        >
                            <Layers size={18} />
                        </button>
                        <button
                            className={`dock-item ${activeView === 'import' ? 'active' : ''}`}
                            onClick={() => setActiveView('import')}
                            title="Import"
                        >
                            <Download size={18} />
                        </button>
                        <button
                            className={`dock-item ${activeView === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveView('settings')}
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </nav>
            <main className="layout-content">
                {children}
            </main>
        </div>
    );
};
