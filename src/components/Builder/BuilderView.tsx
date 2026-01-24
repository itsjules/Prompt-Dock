import { useState, useMemo } from 'react';
import { Plus, Copy, Trash, Save, Search, User, CheckSquare, FileText, MessageSquare, Palette, ShieldAlert, ChevronRight, Check, Loader2, X, Eye, Folder, MoreVertical, Edit2, Trash2, PanelLeftClose, PanelLeftOpen, Star } from 'lucide-react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useBlockStore } from '../../stores/useBlockStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { BlockComponent } from './Block';
import { BlockType } from '../../schemas/block.schema';
import { SaveMetadataModal } from './SaveMetadataModal';
import './BuilderView.css';

// ... (keep existing imports and helpers)
// (Note: Preserving getRelativeTime, BLOCK_TYPES, TYPE_ICONS, BLOCK_TEMPLATES, etc. implicitly by targeting correct lines for replacement or ensuring they are in the file context if I were doing a full file replace. Since I am replacing a chunk, I must be careful.)
// Use replace_file_content carefully. 

// Actually, I should use multi_replace to be safe with large files, but replace_file_content is requested for single contiguous block.
// The file is large. I will use multi_replace for safety and precision.


// Simple relative time helper
const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
};

const BLOCK_TYPES: BlockType[] = ['Role', 'Task', 'Context', 'Output', 'Style', 'Constraints'];

// Map block types to icons
const TYPE_ICONS: Record<BlockType, React.ElementType> = {
    Role: User,
    Task: CheckSquare,
    Context: FileText,
    Output: MessageSquare,
    Style: Palette,
    Constraints: ShieldAlert,
};

// Templates for creating new blocks (Best Practices)
const BLOCK_TEMPLATES: Record<BlockType, { hint: string, template: string, labelExample: string, contentTip: string }> = {
    Role: {
        hint: "Define who the AI is acting as. Be specific about expertise and traits.",
        template: "Act as an expert [Role] who specializes in [Field]. You have deep knowledge of [Topic] and prioritize [Principle].",
        labelExample: "Frontend Expert",
        contentTip: "Tip: Define the persona's specific expertise and point of view."
    },
    Task: {
        hint: "Define exactly what you want the AI to do. Start with an action verb.",
        template: "Your task is to [Action] the following [Input]. Ensure you cover [Requirement 1] and [Requirement 2].",
        labelExample: "Summarize Text",
        contentTip: "Tip: Use a direct action verb (e.g., 'Analyze', 'Write', 'Classify')."
    },
    Context: {
        hint: "Provide constraints, background info, or audience details.",
        template: "The target audience is [Audience]. The tone should be [Tone]. Avoid [Negative Constraint].",
        labelExample: "Target Audience",
        contentTip: "Tip: Provide the 'who', 'where', and 'why' that frames the request."
    },
    Output: {
        hint: "Specify the exact format and structure of the response.",
        template: "Return the result in [Format] format. Do not include [Exclusion]. Structure the response with the following headers: [Header 1], [Header 2].",
        labelExample: "JSON Format",
        contentTip: "Tip: Define the exact format (e.g., 'JSON list', '3 bullet points')."
    },
    Style: {
        hint: "Define the tone, voice, and writing style.",
        template: "Use a [Adjective] tone. specific vocabulary related to [Field]. Avoid passive voice.",
        labelExample: "Professional Tone",
        contentTip: "Tip: Specify the tone (e.g. 'Formal', 'Witty') to guide the voice."
    },
    Constraints: {
        hint: "Hard limits on what the AI can/cannot do.",
        template: "Do not use [Forbidden Element]. Limit response length to [Number] words.",
        labelExample: "No Markdown",
        contentTip: "Tip: Set hard boundaries (e.g. 'No jargon', 'Max 50 words')."
    }
};

const getCategoryIcon = (type: string) => {
    return (TYPE_ICONS as any)[type] || Folder;
};

const getCategoryTemplate = (type: string) => {
    return (BLOCK_TEMPLATES as any)[type] || {
        hint: "Define the content for this block.",
        template: "Enter content here...",
        labelExample: "My Custom Block",
        contentTip: "Tip: Be precise about what you want."
    };
};

// Notion-inspired color palette (lighter, more vibrant)
// Theme-aligned palette (Earthy Bauhaus / Vibrant Teal)
const CATEGORY_COLORS = [
    { name: 'Cobalt', value: '#3D5AFE' },     // Vibrant Blue
    { name: 'Tangerine', value: '#FF6D00' },  // Vibrant Orange
    { name: 'Magenta', value: '#D500F9' },    // Vibrant Pink/Purple
    { name: 'Lime', value: '#76FF03' },       // Electric Green
    { name: 'Crimson', value: '#FF1744' },    // Bright Red
    { name: 'Turquoise', value: '#00E5FF' },  // Bright Cyan (Distinct from Teal)
    { name: 'Violet', value: '#651FFF' },     // Deep Violet
    { name: 'Gold', value: '#FFD600' },       // Bright Yellow/Gold
    { name: 'Slate', value: '#607D8B' },      // Cool Grey (Neutral option)
    { name: 'Coral', value: '#FF4081' },      // Pinkish Red
    { name: 'Mint', value: '#1DE9B6' },       // Vibrant Mint
    { name: 'Azure', value: '#00B0FF' }       // Sky Blue
];

export const BuilderView = () => {
    const [selectedCategory, setSelectedCategory] = useState<BlockType>('Role');
    const [pickerSearch, setPickerSearch] = useState('');
    const [filterFavorites, setFilterFavorites] = useState(false);

    // UI State
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isShowingPreview, setIsShowingPreview] = useState(false);
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
    const [metadataMode, setMetadataMode] = useState<'create' | 'edit'>('create');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Block Editing State (Persisted in Store)
    const [blockSaveCandidate, setBlockSaveCandidate] = useState<string | null>(null); // ID of block being saved

    // New Block Creation State
    const [isCreatingBlock, setIsCreatingBlock] = useState(false);
    const [newBlockLabel, setNewBlockLabel] = useState('');
    const [newBlockContent, setNewBlockContent] = useState('');

    // Category Creation State
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].value);

    // Category Menu State
    const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editCategoryNewName, setEditCategoryNewName] = useState('');
    const [editCategoryDesc, setEditCategoryDesc] = useState('');
    const [editCategoryColor, setEditCategoryColor] = useState('');

    // Global Stores
    const {
        activePromptId,
        currentBlockIds,
        addBlockId,
        removeBlockId,
        moveBlock,
        reorderBlocks,
        clear: clearBuilder,
        draftMetadata,
        isDirty,
        localBlockEdits,
        setLocalBlockEdit,
        removeLocalBlockEdit
    } = useBuilderStore();
    const { addBlock, updateBlock, getBlocksByType, addCategory, updateCategory, removeCategory, customCategories, incrementUsage: incrementBlockUsage, toggleFavorite: toggleBlockFavorite } = useBlockStore();
    const blocksMap = useBlockStore(state => state.blocks);
    const { addPrompt, updatePrompt, getPrompt, incrementUsage: incrementPromptUsage } = usePromptStore();

    const activePrompt = activePromptId ? getPrompt(activePromptId) : null;

    // Helper to get category color
    const getCategoryColor = (type: string) => {
        const customCat = customCategories.find(c => c.name === type);
        return customCat?.color;
    };

    // Derived Data: Available Blocks in Category
    const categoryBlocks = useMemo(() => {
        return getBlocksByType(selectedCategory);
    }, [selectedCategory, blocksMap]);

    // Search Filtering
    // Search Filtering
    const filteredBlocks = useMemo(() => {
        const lowerSearch = pickerSearch.toLowerCase();
        return categoryBlocks.filter(block => {
            const matchesSearch = block.label?.toLowerCase().includes(lowerSearch) || block.content.toLowerCase().includes(lowerSearch);
            const matchesFav = filterFavorites ? block.isFavorite : true;
            return matchesSearch && matchesFav;
        });
    }, [categoryBlocks, pickerSearch, filterFavorites]);

    const [isCopied, setIsCopied] = useState(false);

    // --- Actions ---

    const handleAddBlockToCanvas = (id: string) => {
        addBlockId(id);
    };

    const handleCreateCategory = (andCreateBlock: boolean) => {
        if (!newCategoryName.trim()) {
            alert("Category Name is required.");
            return;
        }

        // Check if exists
        const exists = BLOCK_TYPES.includes(newCategoryName as any) || customCategories.some(c => c.name === newCategoryName);
        if (exists) {
            alert("Category already exists.");
            return;
        }

        addCategory({ name: newCategoryName, description: newCategoryDesc, color: selectedColor });

        if (andCreateBlock) {
            setSelectedCategory(newCategoryName as BlockType);
            setIsCreatingBlock(true);
            setNewBlockLabel('');
            setNewBlockContent(''); // No template for custom yet
        }

        setIsCreatingCategory(false);
        setNewCategoryName('');
        setNewCategoryDesc('');
        setSelectedColor(CATEGORY_COLORS[0].value);
    };

    const handleEditCategory = (categoryName: string) => {
        const category = customCategories.find(c => c.name === categoryName);
        if (!category) return;

        setEditingCategoryName(categoryName);
        setEditCategoryNewName(category.name);
        setEditCategoryDesc(category.description);
        setEditCategoryColor(category.color);
        setIsEditingCategory(true);
        setCategoryMenuOpen(null);
    };

    const handleSaveEditCategory = () => {
        if (!editCategoryNewName.trim()) {
            alert("Category Name is required.");
            return;
        }

        const exists = (BLOCK_TYPES.includes(editCategoryNewName as any) ||
            customCategories.some(c => c.name === editCategoryNewName && c.name !== editingCategoryName));
        if (exists) {
            alert("Category name already exists.");
            return;
        }

        updateCategory(editingCategoryName, {
            name: editCategoryNewName,
            description: editCategoryDesc,
            color: editCategoryColor
        });

        if (selectedCategory === editingCategoryName) {
            setSelectedCategory(editCategoryNewName as BlockType);
        }

        setIsEditingCategory(false);
        setEditingCategoryName('');
    };

    const handleDeleteCategory = (categoryName: string) => {
        if (confirm(`Are you sure you want to delete the "${categoryName}" category?`)) {
            removeCategory(categoryName);
            setCategoryMenuOpen(null);

            if (selectedCategory === categoryName) {
                setSelectedCategory('Role');
            }
        }
    };

    const handleCreateBlockClick = () => {
        setNewBlockLabel('');
        setNewBlockContent(getCategoryTemplate(selectedCategory).template);
        setIsCreatingBlock(true);
    };

    const handleSaveNewBlock = () => {
        if (!newBlockLabel.trim() || !newBlockContent.trim()) {
            alert("Label and Content are required.");
            return;
        }

        const id = addBlock({
            type: selectedCategory,
            label: newBlockLabel,
            content: newBlockContent,
            isFavorite: false
        });

        addBlockId(id); // Auto-add to canvas? Yes, usually desired.
        setIsCreatingBlock(false);
    };

    const handleUpdateBlockInCanvas = (id: string, content: string) => {
        setLocalBlockEdit(id, { content });
    };

    const handleUpdateBlockLabel = (id: string, label: string) => {
        setLocalBlockEdit(id, { label });
    };

    const handleRequestSaveBlock = (id: string) => {
        setBlockSaveCandidate(id);
    };

    const handleResolveBlockSave = (action: 'overwrite' | 'fork' | 'discard') => {
        if (!blockSaveCandidate) return;
        const id = blockSaveCandidate;
        const edits = localBlockEdits[id];
        const originalBlock = blocksMap[id];

        if (!edits || !originalBlock) {
            setBlockSaveCandidate(null);
            return;
        }

        const newContent = edits.content !== undefined ? edits.content : originalBlock.content;
        const newLabel = edits.label !== undefined ? edits.label : originalBlock.label;

        if (action === 'overwrite') {
            updateBlock(id, {
                content: newContent,
                label: newLabel
            });
        } else if (action === 'fork') {
            // Create new block
            const newId = addBlock({
                type: originalBlock.type,
                label: newLabel + ' (Copy)',
                content: newContent,
                isFavorite: false
            });
            // Replace in canvas
            const index = currentBlockIds.indexOf(id);
            if (index !== -1) {
                // We need a replaceBlockId function in store or just remove/add
                // Since we don't have replace, we remove and add at index
                // Wait, useBuilderStore might not have replace.
                // Let's implement manual replace using removeBlockId and addBlockId
                // Actually, `addBlockId` appends. We need to insert at index.
                // `addBlockId` supports index? Let's check store definition or usage.
                // usage: addBlockId(id, index?)
                // Yes, checking imports... usage in handleDragEnd: addBlockId(originalId, destination.index);
                // So we can do:
                removeBlockId(id);
                addBlockId(newId, index);
            }
        }

        // Cleanup
        removeLocalBlockEdit(id);
        setBlockSaveCandidate(null);
    };


    const handleDeleteBlockFromCanvas = (id: string) => {
        removeBlockId(id);
        // Also clear local edits
        removeLocalBlockEdit(id);
    };

    const handleMoveBlockInCanvas = (id: string, direction: 'up' | 'down') => {
        moveBlock(id, direction);
    };

    const handleClearCanvas = () => {
        if (confirm('Are you sure you want to clear all blocks from the canvas?')) {
            clearBuilder();
            // local edits cleared by clearBuilder store action
        }
    };

    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        // CASE 1: Reordering within the Canvas
        if (source.droppableId === 'builder-canvas' && destination.droppableId === 'builder-canvas') {
            const items = Array.from(currentBlockIds);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            reorderBlocks(items);
            return;
        }

        // CASE 2: Dragging from Library to Canvas
        if (source.droppableId === 'library-list' && destination.droppableId === 'builder-canvas') {
            // The draggableId is like "library-<uuid>"
            const originalId = result.draggableId.replace('library-', '');
            addBlockId(originalId, destination.index);
            return;
        }
    };

    const livePreview = currentBlockIds
        .map(id => {
            const block = blocksMap[id];
            if (!block) return null;
            // Use local content if available
            const edits = localBlockEdits[id];
            return edits?.content !== undefined ? edits.content : block.content;
        })
        .filter(Boolean)
        .filter(content => content && content.trim().length > 0)
        .join('\n\n');

    const handleCopyPreview = () => {
        navigator.clipboard.writeText(livePreview);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);

        // Track Usage
        if (activePromptId) {
            incrementPromptUsage(activePromptId);
        }
        // Track usage for all blocks used in this composition
        currentBlockIds.forEach(id => {
            // We only track usage for blocks that are actually in the library (not just local drafts, though they might be same ID)
            // The store handles invalid IDs gracefully.
            incrementBlockUsage(id);
        });
    };

    // --- Prompt Persisting ---

    const handleOpenSaveModal = () => {
        setMetadataMode('create');
        setIsMetadataModalOpen(true);
    };

    const handleEditMetadata = () => {
        // If it's a new prompt (no ID), treat it as "creating" for the modal text (e.g. "Save Prompt"),
        // unless you strictly want "Edit" semantics. Given the user wants to "name and save", 'create' or 'edit' works,
        // but 'create' matches the "Save" button behavior for new prompts. 
        // However, "Edit" icon implies editing. 
        // Let's stick to 'edit' if we want to imply modifying current draft state, 
        // BUT 'create' mode usually hides the "Delete" button which is good for new prompts.
        setMetadataMode(activePromptId ? 'edit' : 'create');
        setIsMetadataModalOpen(true);
    };

    const handleSavePromptClick = async () => {
        if (currentBlockIds.length === 0) {
            alert('Cannot save an empty prompt.');
            return;
        }

        // Warn if there are unsaved block edits?
        if (Object.keys(localBlockEdits).length > 0) {
            if (!confirm("You have unsaved edits to some blocks. These local edits will NOT be saved to the library, but they will be saved as part of this prompt's composition. Continue?")) {
                return;
            }
            // Actually, for Prompt persistence, we usually save the Block IDs.
            // If the user made local edits, those ARE NOT standard blocks yet.
            // The prompt data structure usually just stores IDs.
            // If we just save IDs, the local edits are LOST upon reload unless we persist them.
            // Requirement check: "save this edited version if i want to" -> implied block saving.
            // If the user strictly saves the PROMPT, the prompt probably refers to Block IDs.
            // If the blocks aren't updated, the prompt will load old content.
            // CRITICAL: We should probably force resolving block saves or auto-fork/overwrite?
            // "but i should also be able to save this edited version IF i want to" implies optionality.
            // If they DON'T save the block, what happens?
            // Standard behavior: The prompt is a collection of blocks. If I change the text in the canvas, 
            // usually in tools like this, it diverges from the library block (becomes detached or requires saving).
            // Current app architecture: `currentBlockIds` is list of strings. `usePromptStore` saves `blocks: string[]`.
            // So it ONLY saves IDs.
            // So if I don't save the block changes to the library (overwrite or fork), they are LOST.
            // So I MUST warn the user or auto-save.
            // The prompt saving logic in `performPromptSave` uses `currentBlockIds`.
            // The `localBlockEdits` are ephemeral.
            // I will add a check: if `localBlockEdits` has keys, force user to resolve them or warn they will be lost.
            // The alert above warns they will be saved "as part of this prompt composition" -> THIS IS FALSE currently.
            // Correct warning: "You have unsaved edits. Please save your block changes (overwrite or fork) before saving the prompt, otherwise these changes will be lost."
        }

        if (!activePromptId) {
            // New prompt -> Open Modal
            handleOpenSaveModal();
        } else {
            // Existing prompt -> Just Save
            await performPromptSave();
        }
    };

    const performPromptSave = async () => {
        if (Object.keys(localBlockEdits).length > 0) {
            alert("Please save your block edits (using the save icon on the block) before saving the prompt to ensure changes are persisted.");
            return;
        }

        try {
            setSaveStatus('saving');
            await new Promise(resolve => setTimeout(resolve, 600)); // UX delay

            // Get fresh state to avoid stale closure issues
            // eslint-disable-next-line
            const { draftMetadata, currentBlockIds, loadPrompt } = useBuilderStore.getState();

            if (activePromptId) {
                // Update existing
                updatePrompt(activePromptId, {
                    blocks: currentBlockIds,
                    title: draftMetadata.title,
                    description: draftMetadata.description,
                    tags: draftMetadata.tags as any
                });
                // Find prompt to reload proper "last updated" time?
                // The store updates efficiently, but let's Ensure we update our usage.
                finalizeSave();
            } else {
                // Create new
                const title = draftMetadata.title;
                if (!title.trim()) {
                    alert('Please enter a valid name.');
                    setSaveStatus('idle');
                    return;
                }

                const newId = addPrompt({
                    title,
                    description: draftMetadata.description,
                    blocks: currentBlockIds,
                    tags: draftMetadata.tags as any
                });

                const newPrompt = getPrompt(newId);
                if (newPrompt) {
                    loadPrompt(newPrompt);
                    finalizeSave();
                    setIsMetadataModalOpen(false);
                } else {
                    console.error('Failed to reload new prompt.');
                    setSaveStatus('idle');
                }
            }
        } catch (error: any) {
            console.error('Save failed:', error);
            setSaveStatus('idle');
            alert(`Error saving: ${error.message}`);
        }
    };
    const { deletePrompt } = usePromptStore();

    const handleDeleteActivePrompt = () => {
        if (!activePromptId) return;

        if (confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
            // 1. Delete from store
            deletePrompt(activePromptId);

            // 2. Clear builder state
            clearBuilder();
            // Reset metadata defaults manually if needed, but clearBuilder might not touch draftMetadata
            useBuilderStore.getState().setDraftMetadata({
                title: 'New Prompt',
                description: '',
                tags: { topic: [], technique: [], style: [] }
            });

            // 3. UI Feedback from Modal
            setIsMetadataModalOpen(false);
            setSaveStatus('idle'); // Just in case
        }
    };


    const finalizeSave = () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    return (
        <>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="builder-layout">
                    {/* PANE 1 & 2: SIDEBARS */}
                    {isSidebarOpen && (
                        <>
                            <div className="pane-categories">
                                <div className="pane-header">
                                    <h3>Categories</h3>
                                </div>
                                <div className="category-list">
                                    {[...BLOCK_TYPES, ...customCategories.map(c => c.name)].map(type => {
                                        const Icon = getCategoryIcon(type);
                                        const isCustom = customCategories.some(c => c.name === type);
                                        return (
                                            <div key={type} className="category-tab-wrapper">
                                                <button
                                                    className={`category-tab ${selectedCategory === type ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setSelectedCategory(type as BlockType);
                                                        setIsCreatingBlock(false);
                                                    }}
                                                >
                                                    <Icon size={16} />
                                                    <span>{type}</span>
                                                </button>
                                                {isCustom && (
                                                    <div className="category-menu-container">
                                                        <button
                                                            className="category-menu-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCategoryMenuOpen(categoryMenuOpen === type ? null : type);
                                                            }}
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                        {categoryMenuOpen === type && (
                                                            <div className="category-menu-dropdown">
                                                                <button onClick={() => handleEditCategory(type)}>
                                                                    <Edit2 size={14} />
                                                                    <span>Edit</span>
                                                                </button>
                                                                <button onClick={() => handleDeleteCategory(type)} className="danger">
                                                                    <Trash2 size={14} />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Footer / Add Category Button */}
                                <div className="pane-categories-footer">
                                    <button
                                        className="add-category-ghost-btn"
                                        onClick={() => setIsCreatingCategory(true)}
                                        title="Add New Category"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>


                            {/* PANE 2: BLOCK PICKER / BROWSER */}
                            <div className="pane-picker">
                                <div className="pane-header">
                                    <h3>{selectedCategory.endsWith('s') ? selectedCategory : `${selectedCategory}s`}</h3>
                                    <div className="picker-header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <button
                                            className={`icon-btn-ghost ${filterFavorites ? 'active' : ''}`}
                                            onClick={() => setFilterFavorites(!filterFavorites)}
                                            title="Filter Favorites"
                                            style={{ color: filterFavorites ? '#ffb400' : 'var(--text-secondary)' }}
                                        >
                                            <Star size={16} fill={filterFavorites ? "currentColor" : "none"} />
                                        </button>
                                        <div className="picker-search">
                                            <Search size={14} />
                                            <input
                                                type="text"
                                                placeholder={`Search ${selectedCategory}s...`}
                                                value={pickerSearch}
                                                onChange={(e) => setPickerSearch(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            className="icon-btn-ghost"
                                            onClick={() => setIsSidebarOpen(false)}
                                            title="Close Sidebar"
                                        >
                                            <PanelLeftClose size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="picker-content">
                                    {/* Create New Block Card */}
                                    <div
                                        className={`picker-card create-new ${isCreatingBlock ? 'active' : ''}`}
                                        onClick={handleCreateBlockClick}
                                    >
                                        <Plus size={20} />
                                        <span style={{ pointerEvents: 'none' }}>New {selectedCategory}</span>
                                    </div>



                                    {/* Block List (Draggable Source) */}
                                    <Droppable droppableId="library-list" isDropDisabled={true}>
                                        {(provided) => (
                                            <div
                                                className="blocks-list"
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                {filteredBlocks.map((block, index) => (
                                                    <BlockComponent
                                                        key={block.id}
                                                        index={index}
                                                        block={block}
                                                        draggableId={`library-${block.id}`}
                                                        isEditable={false}
                                                        isDraggable={true}
                                                        hideDelete={true}
                                                        hideAdd={false}
                                                        hideControls={true}
                                                        onUpdate={() => { }} // No-op
                                                        onDelete={() => { }} // No-op
                                                        onAdd={handleAddBlockToCanvas}
                                                        onToggleFavorite={toggleBlockFavorite}
                                                        categoryColor={getCategoryColor(block.type)}
                                                        isCompact={true}
                                                        autoExpandTextarea={true}
                                                    />
                                                ))}
                                                {provided.placeholder}
                                                {filteredBlocks.length === 0 && !isCreatingBlock && (
                                                    <div className="empty-search">
                                                        <p>No blocks found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            </div>
                        </>
                    )}

                    {/* PANE 3: PROMPT CANVAS */}
                    <div className="pane-canvas">
                        <div className="canvas-header">
                            <div className="canvas-title-group">
                                {!isSidebarOpen && (
                                    <button
                                        className="icon-btn-ghost active"
                                        onClick={() => setIsSidebarOpen(true)}
                                        title="Show Sidebar"
                                        style={{ marginRight: '0.5rem' }}
                                    >
                                        <PanelLeftOpen size={16} />
                                    </button>
                                )}
                                <h3>{draftMetadata.title || 'Untitled Prompt'}</h3>
                                <button className="icon-btn-ghost" onClick={handleEditMetadata} title="Edit details">
                                    <Edit2 size={14} />
                                </button>
                                {activePromptId && (
                                    <>
                                        <span className="last-saved-label">
                                            {activePrompt?.updatedAt ? `Saved ${getRelativeTime(activePrompt.updatedAt)}` : 'Unsaved'}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="canvas-actions">
                                <button
                                    className={`text-btn ${isShowingPreview ? 'active' : ''}`}
                                    onClick={() => setIsShowingPreview(!isShowingPreview)}
                                    title={isShowingPreview ? "Show Blocks" : "Show Live Preview"}
                                >
                                    <Eye size={14} />
                                </button>
                                <button className="text-btn danger" onClick={handleClearCanvas} title="Clear all">
                                    <Trash size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="canvas-scroll-area">
                            {isShowingPreview ? (
                                <div className="canvas-preview-mode">
                                    <pre className="full-prompt-text">
                                        {livePreview || "Your prompt is empty. Add blocks to build it!"}
                                    </pre>
                                </div>
                            ) : (
                                <>
                                    {currentBlockIds.length === 0 ? (
                                        <Droppable droppableId="builder-canvas">
                                            {(provided) => (
                                                <div
                                                    className="canvas-empty-state"
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                >
                                                    <p>Select blocks from the library to build your prompt.</p>
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    ) : (
                                        <Droppable droppableId="builder-canvas">
                                            {(provided) => (
                                                <div
                                                    className="canvas-blocks"
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    {currentBlockIds.map((id, index) => {
                                                        const block = blocksMap[id];
                                                        if (!block) return null;
                                                        // Pass local edits to block
                                                        const edits = localBlockEdits[id];
                                                        const displayContent = edits?.content !== undefined ? edits.content : block.content;
                                                        const displayLabel = edits?.label !== undefined ? edits.label : block.label;
                                                        const isDirty = edits !== undefined;

                                                        return (
                                                            <BlockComponent
                                                                key={`${id}-${index}`}
                                                                draggableId={`canvas-${id}-${index}`}
                                                                index={index}
                                                                block={block}
                                                                isEditable={true}
                                                                autoExpandTextarea={true}
                                                                // Pass draft props
                                                                draftContent={displayContent}
                                                                draftLabel={displayLabel}
                                                                isDirty={isDirty}
                                                                // Handlers
                                                                onUpdate={handleUpdateBlockInCanvas}
                                                                onLabelUpdate={handleUpdateBlockLabel}
                                                                onSave={handleRequestSaveBlock}
                                                                onDelete={handleDeleteBlockFromCanvas}
                                                                onMove={handleMoveBlockInCanvas}
                                                                categoryColor={getCategoryColor(block.type)}
                                                            />
                                                        );
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    )}
                                </>
                            )}
                        </div>


                        <div className="canvas-footer">
                            <button
                                className={`footer-btn secondary ${saveStatus === 'saved' ? 'success' : ''}`}
                                onClick={handleSavePromptClick}
                                disabled={saveStatus === 'saving' || (!isDirty && !!activePromptId)}
                                title={!isDirty && !!activePromptId ? "No changes to save" : "Save Prompt"}
                            >
                                {saveStatus === 'idle' && (
                                    <>
                                        <Save size={16} />
                                        {activePromptId ? (isDirty ? 'Save Changes' : 'Saved') : 'Save Prompt'}
                                    </>
                                )}
                                {saveStatus === 'saving' && (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                )}
                                {saveStatus === 'saved' && (
                                    <>
                                        <Check size={16} />
                                        Saved!
                                    </>
                                )}
                            </button>
                            <button
                                className={`footer-btn primary ${isCopied ? 'success' : ''}`}
                                onClick={handleCopyPreview}
                            >
                                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>


                </div >
            </DragDropContext >

            <SaveMetadataModal
                isOpen={isMetadataModalOpen}
                onClose={() => setIsMetadataModalOpen(false)}
                onSave={performPromptSave}
                isSaving={saveStatus === 'saving'}
                initialData={draftMetadata}
                mode={metadataMode}
                onDelete={activePromptId ? handleDeleteActivePrompt : undefined}
            />

            {/* BLOCK SAVE RESOLUTION MODAL */}
            {/* BLOCK SAVE RESOLUTION MODAL */}
            {blockSaveCandidate && createPortal(
                <div className="category-creation-overlay">
                    <div className="category-creation-toast" style={{ maxWidth: '400px' }}>
                        <div className="toast-header">
                            <h3>Unsaved Block Changes</h3>
                            <button onClick={() => setBlockSaveCandidate(null)}><X size={16} /></button>
                        </div>
                        <p style={{ padding: '0 1.5rem', marginBottom: '1rem', color: '#ccc', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            You have modified <strong>{blocksMap[blockSaveCandidate]?.label}</strong>. How would you like to save these changes?
                        </p>
                        <div className="toast-actions" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                            <button className="primary" onClick={() => handleResolveBlockSave('overwrite')}>
                                Overwrite Original
                                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>Updates this block everywhere it's used.</span>
                            </button>
                            <button className="secondary" onClick={() => handleResolveBlockSave('fork')}>
                                Save as Copy
                                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>Creates a new block. Best for safe editing.</span>
                            </button>
                            <button className="secondary danger" onClick={() => handleResolveBlockSave('discard')} style={{ marginTop: '0.5rem' }}>
                                Discard Changes
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* CATEGORY CREATION MODAL/TOAST */}
            {
                isCreatingCategory && createPortal(
                    <div className="category-creation-overlay">
                        <div className="category-creation-toast">
                            <div className="toast-header">
                                <h3>Create New Category</h3>
                                <button onClick={() => setIsCreatingCategory(false)}><X size={16} /></button>
                            </div>

                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Negative examples"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    placeholder="What is this category for?"
                                    value={newCategoryDesc}
                                    onChange={e => setNewCategoryDesc(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker-grid">
                                    {CATEGORY_COLORS.map((color) => {
                                        const isUsed = customCategories.some(c => c.color === color.value);
                                        const isSelected = selectedColor === color.value;
                                        return (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={`color-swatch ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`}
                                                style={{ backgroundColor: color.value }}
                                                onClick={() => setSelectedColor(color.value)}
                                                title={`${color.name}${isUsed ? ' (already used)' : ''}`}
                                            >
                                                {isSelected && <Check size={14} color="white" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="toast-actions">
                                <button className="footer-btn secondary" onClick={() => handleCreateCategory(true)}>Additional block</button>
                                <button className="footer-btn primary" onClick={() => handleCreateCategory(false)}>Create Category</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
            {/* EDIT CATEGORY DIALOG */}
            {
                isEditingCategory && createPortal(
                    <div className="category-creation-overlay">
                        <div className="category-creation-toast">
                            <div className="toast-header">
                                <h3>Edit Category</h3>
                                <button onClick={() => setIsEditingCategory(false)}><X size={16} /></button>
                            </div>

                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Technical Prompts"
                                    value={editCategoryNewName}
                                    onChange={e => setEditCategoryNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    placeholder="What is this category for?"
                                    value={editCategoryDesc}
                                    onChange={e => setEditCategoryDesc(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker-grid">
                                    {CATEGORY_COLORS.map((color) => {
                                        const isUsed = customCategories.some(c => c.color === color.value && c.name !== editingCategoryName);
                                        const isSelected = editCategoryColor === color.value;
                                        return (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={`color-swatch ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}`}
                                                style={{ backgroundColor: color.value }}
                                                onClick={() => setEditCategoryColor(color.value)}
                                                title={`${color.name}${isUsed ? ' (already used)' : ''}`}
                                            >
                                                {isSelected && <Check size={14} color="white" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="toast-actions">
                                <button className="secondary" onClick={() => handleDeleteCategory(editingCategoryName)}>Delete</button>
                                <button className="primary" onClick={handleSaveEditCategory}>Save Changes</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* BLOCK CREATION TOAST */}
            {isCreatingBlock && createPortal(
                <div className="category-creation-overlay">
                    <div className="category-creation-toast">
                        <div className="toast-header">
                            <h3>New {selectedCategory}</h3>
                            <button onClick={() => setIsCreatingBlock(false)}><X size={16} /></button>
                        </div>

                        <div className="form-hint" style={{ marginBottom: '1rem' }}>
                            {getCategoryTemplate(selectedCategory).hint}
                            <div style={{ marginTop: '0.4rem', color: 'var(--accent-primary)', fontStyle: 'normal' }}>
                                {getCategoryTemplate(selectedCategory).contentTip}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Label</label>
                            <input
                                type="text"
                                placeholder={`Label (e.g. '${getCategoryTemplate(selectedCategory).labelExample}')`}
                                value={newBlockLabel}
                                onChange={(e) => setNewBlockLabel(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Content</label>
                            <textarea
                                placeholder="Content..."
                                value={newBlockContent}
                                onChange={(e) => setNewBlockContent(e.target.value)}
                                rows={6}
                            />
                        </div>

                        <div className="toast-actions">
                            <button className="secondary" onClick={() => setIsCreatingBlock(false)}>Cancel</button>
                            <button className="primary" onClick={handleSaveNewBlock}>Create Block</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
