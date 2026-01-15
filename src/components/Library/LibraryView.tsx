import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Star, Clock, Grid, Tag } from 'lucide-react';
import { usePromptStore } from '../../stores/usePromptStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import './LibraryView.css';


export const LibraryView = () => {
    const { getAllPrompts, getFavorites, getRecents } = usePromptStore();
    const { getAllCollections } = useCollectionStore();
    const { searchQuery, setActiveView, libraryTab, setLibraryTab } = useUIStore();
    const { loadPrompt } = useBuilderStore();

    // Use global state for active tab
    const activeTab = libraryTab;
    const setActiveTab = setLibraryTab;
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

    const collections = getAllCollections();

    // Get base prompts according to tab
    const basePrompts = useMemo(() => {
        if (activeTab === 'collections' && activeCollectionId) {
            const collection = collections.find(c => c.id === activeCollectionId);
            const allPrompts = getAllPrompts();
            return allPrompts.filter(p => collection?.promptIds.includes(p.id));
        }

        switch (activeTab) {
            case 'favorites': return getFavorites();
            case 'recents': return getRecents();
            default: return getAllPrompts();
        }
    }, [activeTab, activeCollectionId, collections, getAllPrompts, getFavorites, getRecents]);

    // Extract all unique tags from all prompts for the filter bar
    const allUniqueTags = useMemo(() => {
        const allPrompts = getAllPrompts();
        const tags = new Set<string>();
        allPrompts.forEach(p => {
            if (p.tags) {
                [...(p.tags.style || []), ...(p.tags.topic || []), ...(p.tags.technique || [])]
                    .forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [getAllPrompts]);

    // Setup Fuse instance with block content support
    const fuse = useMemo(() => {
        const blocksMap = useBlockStore.getState().blocks;

        const searchablePrompts = basePrompts.map(p => ({
            ...p,
            mergedBlockContent: p.blocks
                .map(id => blocksMap[id]?.content || '')
                .join(' ')
        }));

        return new Fuse(searchablePrompts, {
            keys: [
                'title',
                'description',
                'tags.style',
                'tags.topic',
                'tags.technique',
                'mergedBlockContent'
            ],
            threshold: 0.4,
        });
    }, [basePrompts]);

    // Filter prompts
    const displayedPrompts = useMemo(() => {
        let results = basePrompts;

        // 1. Fuzzy Search
        if (searchQuery.trim()) {
            results = fuse.search(searchQuery).map(result => result.item);
        }

        // 2. Tag Filtering
        if (selectedTags.size > 0) {
            results = results.filter(p => {
                const promptTags = [
                    ...(p.tags?.style || []),
                    ...(p.tags?.topic || []),
                    ...(p.tags?.technique || [])
                ];
                // Check if prompt has ALL selected tags (or change to SOME if preferred)
                return Array.from(selectedTags).every(tag => promptTags.includes(tag));
            });
        }

        return results;
    }, [fuse, searchQuery, basePrompts, selectedTags]);

    const handleUsePrompt = (promptId: string) => {
        const prompt = basePrompts.find(p => p.id === promptId);
        if (prompt) {
            usePromptStore.getState().incrementUsage(promptId);
            loadPrompt(prompt);
            setActiveView('builder');
        }
    };

    const toggleTag = (tag: string) => {
        const newTags = new Set(selectedTags);
        if (newTags.has(tag)) {
            newTags.delete(tag);
        } else {
            newTags.add(tag);
        }
        setSelectedTags(newTags);
    };

    return (
        <div className="library-view">
            <SearchBar />

            {/* Library Tabs */}
            <div className="library-tabs">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <Grid size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    All Prompts
                </button>
                <button
                    className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    <Star size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Favorites
                </button>
                <button
                    className={`tab-btn ${activeTab === 'recents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recents')}
                >
                    <Clock size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Recents
                </button>
                <button
                    className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collections')}
                >
                    <Grid size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Collections
                </button>
            </div>

            {/* Collection Selector */}
            {activeTab === 'collections' && (
                <div className="collection-selector">
                    {collections.length === 0 ? (
                        <p className="empty-notice">No collections found.</p>
                    ) : (
                        collections.map(c => (
                            <button
                                key={c.id}
                                className={`filter-chip ${activeCollectionId === c.id ? 'active' : ''}`}
                                onClick={() => setActiveCollectionId(c.id)}
                            >
                                {c.name}
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Filter Bar */}
            {allUniqueTags.length > 0 && (
                <div className="filter-bar">
                    {allUniqueTags.map(tag => (
                        <button
                            key={tag}
                            className={`filter-chip ${selectedTags.has(tag) ? 'active' : ''}`}
                            onClick={() => toggleTag(tag)}
                        >
                            <Tag size={12} />
                            {tag}
                        </button>
                    ))}
                    {selectedTags.size > 0 && (
                        <button
                            className="text-btn"
                            style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}
                            onClick={() => setSelectedTags(new Set())}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            <div className="library-content">
                {displayedPrompts.length === 0 ? (
                    <div className="empty-state">
                        <p>No prompts found. Try a different search or filter.</p>
                    </div>
                ) : (
                    <div className="prompts-grid">
                        {displayedPrompts.map(prompt => (
                            <PromptCard
                                key={prompt.id}
                                prompt={prompt}
                                onUse={() => handleUsePrompt(prompt.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
