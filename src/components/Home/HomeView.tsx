import { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Star, Clock, Grid, Plus, Search, User, FileText, CheckSquare, MessageSquare, Palette, ShieldAlert } from 'lucide-react';
import { useUIStore, type LibraryTab } from '../../stores/useUIStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { CreateCollectionModal } from '../Library/CreateCollectionModal';
import { SuggestionItem, SearchSuggestions } from './SearchSuggestions';
import { RoleSelector } from '../Role/RoleSelector';
import { useRoleStore } from '../../stores/useRoleStore';
import './HomeView.css';

export const HomeView = () => {
    const { setActiveView, setLibraryTab, setSearchQuery, searchQuery, setActiveCollectionId, addRecentSearch } = useUIStore();
    const { getFavorites, getRecents } = usePromptStore();
    const { getAllCollections } = useCollectionStore();
    const { setForNew, loadPrompt, addBlockId } = useBuilderStore();
    const { getFavoriteBlocks } = useBlockStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const { getRelevanceScore } = useRoleStore();
    // Subscribe to activeRoleId to trigger re-renders
    useRoleStore(state => state.activeRoleId);

    const sortWithRole = (items: any[], type: 'prompt' | 'collection') => {
        return [...items].sort((a, b) => {
            const textA = type === 'prompt' ? `${a.title} ${a.description || ''}` : `${a.name} ${a.description || ''}`;
            const tagsA = type === 'prompt' ? [...(a.tags?.style || []), ...(a.tags?.topic || []), ...(a.tags?.technique || [])] : [];
            const scoreA = getRelevanceScore(textA, tagsA);

            const textB = type === 'prompt' ? `${b.title} ${b.description || ''}` : `${b.name} ${b.description || ''}`;
            const tagsB = type === 'prompt' ? [...(b.tags?.style || []), ...(b.tags?.topic || []), ...(b.tags?.technique || [])] : [];
            const scoreB = getRelevanceScore(textB, tagsB);

            if (scoreA !== scoreB) return scoreB - scoreA;
            // Tie-breaker: Recency if available, else name
            if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return 0;
        });
    };

    // Combine keys for sorting: Prompts and Blocks
    const favoritePrompts = getFavorites();
    const favoriteBlocks = getFavoriteBlocks();

    // Map to unified shape for sorting
    const unifiedFavorites = [
        ...favoritePrompts.map(p => ({ ...p, uiType: 'prompt' as const })),
        ...favoriteBlocks.map(b => ({ ...b, uiType: 'block' as const }))
    ];

    const sortUnified = (items: any[]) => {
        return [...items].sort((a, b) => {
            // Text for scoring
            const textA = a.uiType === 'prompt' ? `${a.title} ${a.description || ''}` : `${a.label} ${a.content}`;
            const textB = b.uiType === 'prompt' ? `${b.title} ${b.description || ''}` : `${b.label} ${b.content}`;

            // Tags
            const tagsA = a.uiType === 'prompt' ? [...(a.tags?.style || []), ...(a.tags?.topic || []), ...(a.tags?.technique || [])] : [];
            const tagsB = b.uiType === 'prompt' ? [...(b.tags?.style || []), ...(b.tags?.topic || []), ...(b.tags?.technique || [])] : [];

            const scoreA = getRelevanceScore(textA, tagsA);
            const scoreB = getRelevanceScore(textB, tagsB);

            if (scoreA !== scoreB) return scoreB - scoreA;
            if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return 0;
        });
    };

    const favorites = sortUnified(unifiedFavorites).slice(0, 10);
    const recents = getRecents(3);
    const collections = sortWithRole(getAllCollections(), 'collection').slice(0, 10);

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
        addRecentSearch(text);

        if (typeof suggestion === 'object' && suggestion.type === 'collection' && suggestion.id) {
            setSearchQuery(''); // Clear search so we see the whole collection
            setIsSearchFocused(false);
            handleNavigateToLibrary('collections', suggestion.id);
            return;
        }

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

    const handleOpenBlock = (blockId: string) => {
        // When clicking a favorite block, start a new prompt with this block
        const block = useBlockStore.getState().getBlock(blockId);
        if (block) {
            useBlockStore.getState().incrementUsage(blockId);
            setForNew();
            addBlockId(block.id); // Add the library block directly
            setActiveView('builder');
        }
    };

    const getBlockIcon = (blockType: string) => {
        switch (blockType) {
            case 'Role': return User;
            case 'Task': return CheckSquare;
            case 'Context': return FileText;
            case 'Output': return MessageSquare;
            case 'Style': return Palette;
            case 'Constraints': return ShieldAlert;
            default: return FileText;
        }
    };

    return (
        <div className="home-view">
            {/* Header / Greeting */}
            <div className="home-header">
                <div className="greeting-section">
                    <div className="greeting-text">
                        <h1>Hi there!</h1>
                        <p>What are you making today?</p>
                    </div>
                    {/* Role Selector */}
                    <div className="context-badge-wrapper">
                        <RoleSelector />
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
                            spellCheck={false}
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
                                {favorites.map(item => {
                                    if (item.uiType === 'prompt') {
                                        return (
                                            <div key={item.id} className="widget-item" onClick={() => handleOpenPrompt(item.id)}>
                                                <div className="widget-item-title">
                                                    <span style={{ opacity: 0.7, marginRight: '4px' }}>📄</span>
                                                    {item.title}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Block Item
                                        // @ts-ignore
                                        const Icon = getBlockIcon(item.type);
                                        return (
                                            <div key={item.id} className="widget-item" onClick={() => handleOpenBlock(item.id)}>
                                                <div className="widget-item-title">
                                                    <span style={{ opacity: 0.7, marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}><Icon size={12} /></span>
                                                    {item.label}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recents Widget */}
                <div className="dashboard-widget">
                    <div className="widget-header">
                        <h3><Clock size={16} /> Recent</h3>
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
