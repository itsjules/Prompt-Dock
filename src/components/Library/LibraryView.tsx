import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Star, Clock, Grid, Tag, FolderPlus, Plus, Copy, Trash2, Filter, X, CheckSquare, ChevronDown, Repeat, ArrowUpDown, Upload } from 'lucide-react';
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
import type { BlockType } from '../../schemas/block.schema';
import './LibraryView.css';

export const LibraryView = () => {
    const { getAllPrompts, getFavorites: getFavPrompts, getRecents, deletePrompt } = usePromptStore();
    const { getAllCollections } = useCollectionStore();
    const { getAllBlocks, getFavoriteBlocks: getFavBlocks, deleteBlock, toggleFavorite: toggleBlockFavorite } = useBlockStore();

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

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedBlockTypes, setSelectedBlockTypes] = useState<Set<BlockType>>(new Set());
    // Default to showing both
    const [filterItemTypes, setFilterItemTypes] = useState<Set<'prompt' | 'block'>>(new Set(['prompt', 'block']));

    // Sort State
    const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'usage'>('relevance');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Filter Options
    const blockTypes: BlockType[] = ['Role', 'Task', 'Context', 'Output', 'Style', 'Constraints'];

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

        // 1.5 Item Type Filtering (Prompts vs Blocks)
        if (filterItemTypes.size < 2) { // If both are selected, no filtering needed
            results = results.filter(item => filterItemTypes.has(item.type));
        }

        // 2. Block Type Filtering
        if (selectedBlockTypes.size > 0) {
            results = results.filter(item => {
                // If block types are selected, we are looking for blocks of those types.
                // Prompts do not have block types, so they are filtered out.
                if (item.type !== 'block') return false;
                return selectedBlockTypes.has((item.original as any).type);
            });
        }

        // 3. Tag Filtering
        if (selectedTags.size > 0) {
            results = results.filter(item => {
                // If filtering by tags, blocks (which don't have tags in this schema) are hidden.
                if (item.type === 'block') return false;
                if (!item.tags) return false;
                const itemTags = [...(item.tags.style || []), ...(item.tags.topic || []), ...(item.tags.technique || [])];

                // Check if ALL selected tags match (AND logic)
                return [...selectedTags].every(t => itemTags.includes(t));
            });
        }

        // 4. Sorting
        if (sortBy === 'relevance' && activeRoleId) {
            // Existing Role-Based Relevance + Recency Fallback
            results = [...results].sort((a, b) => {
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
                // Tie-breaker: Recency
                const dateA = new Date(a.original.updatedAt || 0).getTime();
                const dateB = new Date(b.original.updatedAt || 0).getTime();
                return dateB - dateA;
            });
        } else if (sortBy === 'newest') {
            results = [...results].sort((a, b) => {
                const dateA = new Date(a.original.updatedAt || 0).getTime();
                const dateB = new Date(b.original.updatedAt || 0).getTime();
                return dateB - dateA;
            });
        } else if (sortBy === 'usage') {
            results = [...results].sort((a, b) => {
                const countA = (a.original as any).usageCount || 0;
                const countB = (b.original as any).usageCount || 0;
                if (countA !== countB) return countB - countA;
                // Tie-breaker: Newest
                const dateA = new Date(a.original.updatedAt || 0).getTime();
                const dateB = new Date(b.original.updatedAt || 0).getTime();
                return dateB - dateA;
            });
        } else {
            // Default Fallback (if no role or relevance selected but fallback needed, usually Newest)
            results = [...results].sort((a, b) => {
                const dateA = new Date(a.original.updatedAt || 0).getTime();
                const dateB = new Date(b.original.updatedAt || 0).getTime();
                return dateB - dateA;
            });
        }

        return results;
    }, [fuse, searchQuery, searchItems, selectedTags, selectedBlockTypes, filterItemTypes, activeRoleId, getRelevanceScore, sortBy]);

    const availableFiltersCount = selectedTags.size + selectedBlockTypes.size + (filterItemTypes.size < 2 ? 1 : 0);

    const toggleItemType = (type: 'prompt' | 'block') => {
        const newSet = new Set(filterItemTypes);
        if (newSet.has(type)) {
            // Don't allow unchecking the last one (always show at least one type)
            if (newSet.size > 1) newSet.delete(type);
        } else {
            newSet.add(type);
        }
        setFilterItemTypes(newSet);
    };

    const toggleBlockType = (type: BlockType) => {
        const newSet = new Set(selectedBlockTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }
        setSelectedBlockTypes(newSet);
    };

    const clearFilters = () => {
        setSelectedTags(new Set());
        setSelectedBlockTypes(new Set());
        setFilterItemTypes(new Set(['prompt', 'block']));
    };

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

    const handleDeletePrompt = (prompt: any) => {
        if (confirm(`Are you sure you want to delete "${prompt.title}"? This cannot be undone.`)) {
            deletePrompt(prompt.id);
        }
    };

    const handleDeleteBlock = (block: any) => {
        if (confirm(`Are you sure you want to delete "${block.label}"? This cannot be undone.`)) {
            deleteBlock(block.id);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <div style={{ flex: 1 }}>
                    <SearchBar />
                </div>
                {/* Import Prompt Button */}
                <button
                    className="btn-primary"
                    onClick={() => setActiveView('import')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                    }}
                    title="Import a prompt from text or file"
                >
                    <Upload size={16} />
                    Import Prompt
                </button>
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

                <div style={{ flex: 1 }} /> {/* Spacer */}

                {/* Sorting Dropdown */}
                <div className="filter-popover-wrapper" style={{ position: 'relative', marginRight: '0.5rem' }}>
                    <button
                        className={`filter-toggle-btn ${sortBy !== 'relevance' ? 'active' : ''}`}
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        title="Sort Order"
                    >
                        <ArrowUpDown size={14} />
                        <span style={{ textTransform: 'capitalize' }}>{sortBy}</span>
                        <ChevronDown size={14} style={{ opacity: 0.5 }} />
                    </button>
                    {isSortOpen && (
                        <>
                            <div className="filter-popover-backdrop" onClick={() => setIsSortOpen(false)} />
                            <div className="filter-popover" style={{ width: '150px', right: 0 }}>
                                <div className="filter-section">
                                    <button className={`sort-option ${sortBy === 'relevance' ? 'selected' : ''}`} onClick={() => { setSortBy('relevance'); setIsSortOpen(false); }}>
                                        Relevance
                                        {sortBy === 'relevance' && <CheckSquare size={12} />}
                                    </button>
                                    <button className={`sort-option ${sortBy === 'newest' ? 'selected' : ''}`} onClick={() => { setSortBy('newest'); setIsSortOpen(false); }}>
                                        Newest
                                        {sortBy === 'newest' && <CheckSquare size={12} />}
                                    </button>
                                    <button className={`sort-option ${sortBy === 'usage' ? 'selected' : ''}`} onClick={() => { setSortBy('usage'); setIsSortOpen(false); }}>
                                        Most Used
                                        {sortBy === 'usage' && <CheckSquare size={12} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="filter-popover-wrapper" style={{ position: 'relative' }}>
                    <button
                        className={`filter-toggle-btn ${availableFiltersCount > 0 ? 'active' : ''}`}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <Filter size={14} />
                        <span>Filter</span>
                        {availableFiltersCount > 0 && <span className="filter-badge">{availableFiltersCount}</span>}
                        <ChevronDown size={14} style={{ opacity: 0.5 }} />
                    </button>

                    {isFilterOpen && (
                        <>
                            <div className="filter-popover-backdrop" onClick={() => setIsFilterOpen(false)} />
                            <div className="filter-popover">
                                <div className="filter-section">
                                    <h4>Item Type</h4>
                                    <div className="filter-checkbox-grid">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={filterItemTypes.has('prompt')}
                                                onChange={() => toggleItemType('prompt')}
                                            />
                                            <span className="custom-checkbox">
                                                {filterItemTypes.has('prompt') && <CheckSquare size={12} />}
                                            </span>
                                            Full Prompts
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={filterItemTypes.has('block')}
                                                onChange={() => toggleItemType('block')}
                                            />
                                            <span className="custom-checkbox">
                                                {filterItemTypes.has('block') && <CheckSquare size={12} />}
                                            </span>
                                            Blocks
                                        </label>
                                    </div>
                                </div>

                                <div className="filter-divider" />

                                <div className="filter-section">
                                    <h4>Block Types</h4>
                                    <div className="filter-checkbox-grid">
                                        {blockTypes.map(type => (
                                            <label key={type} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBlockTypes.has(type)}
                                                    onChange={() => toggleBlockType(type)}
                                                />
                                                <span className="custom-checkbox">
                                                    {selectedBlockTypes.has(type) && <CheckSquare size={12} />}
                                                </span>
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="filter-divider" />

                                <div className="filter-section">
                                    <h4>Tags</h4>
                                    <div className="filter-tags-cloud">
                                        {allUniqueTags.length === 0 ? (
                                            <p className="empty-text">No tags available.</p>
                                        ) : (
                                            allUniqueTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    className={`filter-chip small ${selectedTags.has(tag) ? 'active' : ''}`}
                                                    onClick={() => toggleTag(tag)}
                                                >
                                                    {tag}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="filter-footer">
                                    <button className="text-btn small" onClick={clearFilters}>
                                        Clear All
                                    </button>
                                    <button className="btn-primary small" onClick={() => setIsFilterOpen(false)}>
                                        Done
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
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

            {/* Active Filters Display (Summary) - Moved out of filter-controls wrapper */}
            {availableFiltersCount > 0 && (
                <div className="active-filters-summary">
                    {[...selectedBlockTypes].map(type => (
                        <span key={type} className="active-filter-pill">
                            {type}
                            <button onClick={() => toggleBlockType(type as any)}><X size={10} /></button>
                        </span>
                    ))}
                    {[...selectedTags].map(tag => (
                        <span key={tag} className="active-filter-pill tag-pill">
                            <Tag size={10} />
                            {tag}
                            <button onClick={() => toggleTag(tag)}><X size={10} /></button>
                        </span>
                    ))}
                    <button className="clear-all-text-btn" onClick={clearFilters}>Clear all</button>
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
                                        onDelete={handleDeletePrompt}
                                    />
                                );
                            } else if (item.type === 'block') {
                                const block = item.original as any;
                                return (
                                    <div key={item.id} className="library-block-wrapper" onClick={() => handleUseBlock(block.id)}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                            {/* Block Header (Favorites) */}
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }} title="Usage Count">
                                                    <Repeat size={12} />
                                                    <span>{block.usageCount || 0}</span>
                                                </div>
                                                <button
                                                    className={`favorite-btn-mini ${block.isFavorite ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); toggleBlockFavorite(block.id); }}
                                                    title={block.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                                >
                                                    <Star size={14} fill={block.isFavorite ? "currentColor" : "none"} />
                                                </button>
                                            </div>

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
                                            <div style={{ flex: 1 }} />

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
                                                className="action-btn danger"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block); }}
                                                title="Delete Block"
                                            >
                                                <Trash2 size={16} />
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
