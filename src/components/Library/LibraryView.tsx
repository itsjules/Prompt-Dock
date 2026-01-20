import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Star, Clock, Grid, Tag, FolderPlus, Plus, Copy } from 'lucide-react';
import { usePromptStore } from '../../stores/usePromptStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { useRoleStore } from '../../stores/useRoleStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import { BlockComponent } from '../Builder/Block'; // Reuse Block Component
import { AddToCollectionModal } from './AddToCollectionModal';
import { RoleSelector } from '../Role/RoleSelector';
import './LibraryView.css';

export const LibraryView = () => {
    const { getAllPrompts, getFavorites: getFavPrompts, getRecents } = usePromptStore();
    const { getAllCollections } = useCollectionStore();
    const { getAllBlocks, getFavoriteBlocks: getFavBlocks } = useBlockStore();

    const { searchQuery, setActiveView, libraryTab, setLibraryTab, activeCollectionId, setActiveCollectionId } = useUIStore();
    const { loadPrompt, addBlockId } = useBuilderStore();
    const activeRoleId = useRoleStore(state => state.activeRoleId);
    const getRelevanceScore = useRoleStore(state => state.getRelevanceScore);

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
                'content',
                'tags.style',
                'tags.topic',
                'tags.technique'
            ],
            threshold: 0.4,
            includeScore: true,
            sortFn: (a, b) => {
                return a.score - b.score;
            }
        });
    }, [searchItems]);

    // Filtered & Sorted Results
    const displayedItems = useMemo(() => {
        let results = searchItems;

        // 1. Fuzzy Search
        if (searchQuery.trim()) {
            const fuseResults = fuse.search(searchQuery);
            // Remap to items
            results = fuseResults.map(r => r.item);
        }

        // 2. Tag Filtering (Strict)
        if (selectedTags.size > 0) {
            results = results.filter(item => {
                if (item.type === 'block') return true;
                if (!item.tags) return false;
                // check intersection
                const itemTags = [...(item.tags.style || []), ...(item.tags.topic || []), ...(item.tags.technique || [])];
                return [...selectedTags].every(t => itemTags.includes(t));
            });
        }

        // 3. Role-Based Re-ranking (The "Reordering" requirement)
        // We calculate a score for each item based on the active role's keywords vs item metadata

        if (activeRoleId) {
            results = [...results].sort((a, b) => { // Stable sort copy
                // Calculate score for A
                const tagsA = a.type === 'prompt' && a.tags
                    ? [...(a.tags.style || []), ...(a.tags.topic || []), ...(a.tags.technique || [])]
                    : [];
                const textA = `${a.title} ${a.desc}`;
                const scoreA = getRelevanceScore(textA, tagsA);

                // Calculate score for B
                const tagsB = b.type === 'prompt' && b.tags
                    ? [...(b.tags.style || []), ...(b.tags.topic || []), ...(b.tags.technique || [])]
                    : [];
                const textB = `${b.title} ${b.desc}`;
                const scoreB = getRelevanceScore(textB, tagsB);

                if (scoreA !== scoreB) {
                    return scoreB - scoreA; // Descending order of relevance
                }
                // Tie-breaker: Recency (Updated At)
                const dateA = new Date(a.original.updatedAt).getTime();
                const dateB = new Date(b.original.updatedAt).getTime();
                return dateB - dateA;
            });
        }

        return results;
    }, [fuse, searchQuery, searchItems, selectedTags, activeRoleId, getRelevanceScore]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <div style={{ flex: 1 }}>
                    <SearchBar />
                </div>
                {/* Role Selector (Inline) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prioritizing:</span>
                    <RoleSelector />
                </div>
            </div>

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
                        {displayedItems.map(item => {
                            if (item.type === 'prompt') {
                                const prompt = item.original as any;
                                return (
                                    <PromptCard
                                        key={item.id}
                                        prompt={prompt}
                                        onUse={() => handleUsePrompt(item.id)}
                                        onAddToCollection={(p) => handleAddToCollection(p.id, 'prompt', p.title)}
                                    />
                                );
                            } else if (item.type === 'block') {
                                const block = item.original as any;
                                return (
                                    <div key={item.id} className="library-block-wrapper" onClick={() => handleUseBlock(block.id)}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <BlockComponent
                                                block={block}
                                                // @ts-ignore
                                                index={0} // Index required by props but unused if not draggable
                                                onUpdate={() => { }}
                                                onDelete={() => { }}
                                                hideDragHandle={true}
                                                hideDelete={true}
                                                isEditable={false}
                                                isDraggable={false}
                                            />
                                        </div>
                                        {/* Prompt-like Actions Footer */}
                                        <div className="block-card-footer">
                                            <button
                                                className="action-btn"
                                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(block.content); }}
                                                title="Copy Content"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={(e) => { e.stopPropagation(); handleAddToCollection(block.id, 'block', block.label); }}
                                                title="Add to Collection"
                                            >
                                                <FolderPlus size={16} />
                                            </button>
                                            <button
                                                className="action-btn primary"
                                                onClick={(e) => { e.stopPropagation(); handleUseBlock(block.id); }}
                                                title="Use this block"
                                            >
                                                <Plus size={16} /> Use
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
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
