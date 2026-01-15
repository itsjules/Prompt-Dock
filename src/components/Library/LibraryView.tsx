import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Star, Clock, Grid, Tag, FolderPlus } from 'lucide-react';
import { usePromptStore } from '../../stores/usePromptStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import { BlockComponent } from '../Builder/Block'; // Reuse Block Component
import { AddToCollectionModal } from './AddToCollectionModal';
import './LibraryView.css';

export const LibraryView = () => {
    const { getAllPrompts, getFavorites: getFavPrompts, getRecents } = usePromptStore();
    const { getAllCollections } = useCollectionStore();
    const { getAllBlocks, getFavoriteBlocks: getFavBlocks } = useBlockStore();

    const { searchQuery, setActiveView, libraryTab, setLibraryTab, activeCollectionId, setActiveCollectionId } = useUIStore();
    const { loadPrompt, addBlockId } = useBuilderStore();

    // Use global state for active tab
    const activeTab = libraryTab;
    const setActiveTab = setLibraryTab;
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

    // Collection Modal State
    const [collectionModalItem, setCollectionModalItem] = useState<{ id: string, type: 'prompt' | 'block', title: string } | null>(null);

    const collections = getAllCollections();

    // --- DATA FETCHING & MERGING ---

    // Helper to get items based on active tab
    const { promtData, blockData } = useMemo(() => {
        let p = getAllPrompts();
        let b = getAllBlocks();

        if (activeTab === 'collections' && activeCollectionId) {
            const collection = collections.find(c => c.id === activeCollectionId);
            p = p.filter(item => collection?.promptIds.includes(item.id));
            b = b.filter(item => collection?.blockIds?.includes(item.id)); // Optional chaining for migration safety
        } else if (activeTab === 'favorites') {
            p = getFavPrompts();
            b = getFavBlocks();
        } else if (activeTab === 'recents') {
            p = getRecents();
            b = []; // Blocks don't have "recents" logic yet in this store version
        }

        return { promtData: p, blockData: b };
    }, [activeTab, activeCollectionId, collections, getAllPrompts, getAllBlocks, getFavPrompts, getFavBlocks, getRecents]);

    // Extract all unique tags (Prompts only for now, blocks don't have tags in schema yet)
    const allUniqueTags = useMemo(() => {
        const tags = new Set<string>();
        getAllPrompts().forEach(p => {
            if (p.tags) {
                [...(p.tags.style || []), ...(p.tags.topic || []), ...(p.tags.technique || [])]
                    .forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [getAllPrompts]);

    // --- SEARCH LOGIC ---

    // Unified item type for Fuse
    const searchItems = useMemo(() => {
        const pItems = promtData.map(p => ({
            id: p.id,
            type: 'prompt' as const,
            title: p.title,
            desc: p.description,
            content: '', // Prompts search mainly metadata, but could search block content too if needed
            tags: p.tags,
            original: p
        }));

        const bItems = blockData.map(b => ({
            id: b.id,
            type: 'block' as const,
            title: b.label, // Use label as title
            desc: `Type: ${b.type}`,
            content: b.content,
            tags: null,
            original: b
        }));

        return [...pItems, ...bItems];
    }, [promtData, blockData]);

    const fuse = useMemo(() => {
        return new Fuse(searchItems, {
            keys: [
                'title',
                'desc',
                'content', // Search block content!
                'tags.style',
                'tags.topic',
                'tags.technique'
            ],
            threshold: 0.4,
        });
    }, [searchItems]);

    // Filtered Results
    const displayedItems = useMemo(() => {
        let results = searchItems;

        // 1. Fuzzy Search
        if (searchQuery.trim()) {
            results = fuse.search(searchQuery).map(result => result.item);
        }

        // 2. Tag Filtering (Only applies to Prompts mostly)
        if (selectedTags.size > 0) {
            results = results.filter(item => {
                if (item.type === 'block') return true; // Don't filter blocks by tag
                // Strict filter: if tags are selected, only show items with those tags.
                // Blocks don't have tags, so they are hidden when filtering by tag.
                return false;
            });
        }

        return results;
    }, [fuse, searchQuery, searchItems, selectedTags]);

    // --- HANDLERS ---

    const handleUsePrompt = (promptId: string) => {
        const prompt = getAllPrompts().find(p => p.id === promptId);
        if (prompt) {
            usePromptStore.getState().incrementUsage(promptId);
            loadPrompt(prompt);
            setActiveView('builder');
        }
    };

    const handleUseBlock = (blockId: string) => {
        addBlockId(blockId);
        setActiveView('builder');
    };

    const handleAddToCollection = (id: string, type: 'prompt' | 'block', title: string) => {
        setCollectionModalItem({ id, type, title });
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
                    All Items
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
                {displayedItems.length === 0 ? (
                    <div className="empty-state">
                        <p>No items found. Try a different search or filter.</p>
                    </div>
                ) : (
                    <div className="prompts-grid">
                        {/* Section 1: Prompts */}
                        {displayedItems.filter(i => i.type === 'prompt').map(item => (
                            <PromptCard
                                key={item.id}
                                prompt={(item.original as any)}
                                onUse={() => handleUsePrompt(item.id)}
                                onAddToCollection={(p) => handleAddToCollection(p.id, 'prompt', p.title)}
                            />
                        ))}

                        {/* Section 2: Blocks */}
                        {displayedItems.filter(i => i.type === 'block').map(item => {
                            const block = item.original as any;
                            return (
                                <div key={item.id} className="library-block-wrapper" onClick={() => handleUseBlock(block.id)}>
                                    <div style={{ pointerEvents: 'none' }}>
                                        <BlockComponent
                                            block={block}
                                            onUpdate={() => { }}
                                            onDelete={() => { }}
                                        />
                                    </div>
                                    <div className="library-block-overlay">
                                        <div className="overlay-actions">
                                            <button
                                                className="overlay-btn"
                                                onClick={(e) => { e.stopPropagation(); handleAddToCollection(block.id, 'block', block.label); }}
                                                title="Add to Collection"
                                            >
                                                <FolderPlus size={16} />
                                            </button>
                                            <span className="add-text">Add to Canvas</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add To Collection Modal */}
            {collectionModalItem && (
                <AddToCollectionModal
                    itemId={collectionModalItem.id}
                    itemType={collectionModalItem.type}
                    itemTitle={collectionModalItem.title}
                    onClose={() => setCollectionModalItem(null)}
                />
            )}
        </div>
    );
};
