import { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Star, Clock, Grid, Plus, Search, User } from 'lucide-react';
import { useUIStore, type LibraryTab } from '../../stores/useUIStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { CreateCollectionModal } from '../Library/CreateCollectionModal';
import { SearchSuggestions, SuggestionItem } from './SearchSuggestions';
import './HomeView.css';

export const HomeView = () => {
    const { setActiveView, setLibraryTab, setSearchQuery, searchQuery, setActiveCollectionId, addRecentSearch } = useUIStore();
    const { getFavorites, getRecents } = usePromptStore();
    const { getAllCollections } = useCollectionStore();
    const { setForNew, loadPrompt } = useBuilderStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const favorites = getFavorites().slice(0, 3);
    const recents = getRecents(3);
    const collections = getAllCollections().slice(0, 3);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigateToLibrary = (tab: LibraryTab, collectionId?: string) => {
        setSearchQuery(''); // Clear search query to ensure clean navigation
        setLibraryTab(tab);
        if (collectionId) {
            setActiveCollectionId(collectionId);
        } else {
            setActiveCollectionId(null);
        }
        setActiveView('library');
    };

    const handleStartFromScratch = () => {
        setForNew();
        setActiveView('builder');
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSelectSuggestion = (suggestion: SuggestionItem | string) => {
        const text = typeof suggestion === 'string' ? suggestion : suggestion.text;

        // Add specific text to history
        addRecentSearch(text);

        // Handle collection navigation
        if (typeof suggestion === 'object' && suggestion.type === 'collection' && suggestion.id) {
            setSearchQuery(''); // Clear search so we see the whole collection
            setIsSearchFocused(false);
            handleNavigateToLibrary('collections', suggestion.id);
            return;
        }

        // Default: Search in library
        setSearchQuery(text);
        setIsSearchFocused(false);
        setActiveView('library');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            handleSelectSuggestion(searchQuery.trim());
        }
    };

    const handleOpenPrompt = (promptId: string) => {
        const prompt = usePromptStore.getState().getPrompt(promptId);
        if (prompt) {
            usePromptStore.getState().incrementUsage(promptId);
            loadPrompt(prompt);
            setActiveView('builder');
        }
    };

    return (
        <div className="home-view">
            {/* Header / Greeting */}
            <div className="home-header">
                <div className="greeting-section">
                    <div className="greeting-text">
                        <h1>Hi there!</h1>
                        <p>What are you building today?</p>
                    </div>
                    {/* Placeholder Context Badge */}
                    <div className="context-badge">
                        <User size={14} />
                        <span>Personal</span>
                    </div>
                </div>

                <div className="home-search-container" ref={searchContainerRef}>
                    <div className={`search-bar-container ${isSearchFocused ? 'focused' : ''}`}>
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search your library..."
                            value={searchQuery}
                            onChange={handleSearch}
                            onFocus={() => setIsSearchFocused(true)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                    {isSearchFocused && (
                        <SearchSuggestions onSelect={handleSelectSuggestion} />
                    )}
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* Favorites Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3><Star size={16} fill="var(--text-primary)" /> Favorites</h3>
                        <button className="widget-action" onClick={() => handleNavigateToLibrary('favorites')}>
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                    <div className="widget-content">
                        {favorites.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No favorites yet.</p>
                        ) : (
                            <div className="widget-item-list">
                                {favorites.map(p => (
                                    <div key={p.id} className="widget-item" onClick={() => handleOpenPrompt(p.id)}>
                                        <div className="widget-item-title">{p.title}</div>
                                        <div className="widget-item-desc">{p.description || 'No description'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recents Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3><Clock size={16} /> Recent</h3>
                        <button className="widget-action" onClick={() => handleNavigateToLibrary('recents')}>
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                    <div className="widget-content">
                        {recents.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No recent prompts.</p>
                        ) : (
                            <div className="widget-item-list">
                                {recents.map(p => (
                                    <div key={p.id} className="widget-item" onClick={() => handleOpenPrompt(p.id)}>
                                        <div className="widget-item-title">{p.title}</div>
                                        <div className="widget-item-desc">Used {new Date(p.updatedAt).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Collections Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3><Grid size={16} /> Collections</h3>
                        <div className="widget-header-actions">
                            <button className="widget-action" onClick={() => setShowCreateModal(true)} title="New Collection">
                                <Plus size={18} />
                            </button>
                            <button className="widget-action" onClick={() => handleNavigateToLibrary('collections')}>
                                <ArrowUpRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="widget-content">
                        {collections.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No collections found.</p>
                        ) : (
                            <div className="widget-item-list">
                                {collections.map(c => (
                                    <div key={c.id} className="widget-item" onClick={() => handleNavigateToLibrary('collections', c.id)}>
                                        <div className="widget-item-title">{c.name}</div>
                                        <div className="widget-item-desc">
                                            {c.promptIds.length} prompts, {c.blockIds?.length || 0} blocks
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <button className="start-scratch-btn" onClick={handleStartFromScratch}>
                <Plus size={20} strokeWidth={3} />
                Start from Scratch
            </button>

            {/* Create Collection Modal */}
            {showCreateModal && (
                <CreateCollectionModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    );
};
