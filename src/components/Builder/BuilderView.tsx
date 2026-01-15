import { useState, useMemo } from 'react';
import { Plus, Copy, Trash, Save, Search, User, CheckSquare, FileText, MessageSquare, Palette, ShieldAlert, ChevronRight, Check, Loader2, X } from 'lucide-react';
import { useBlockStore } from '../../stores/useBlockStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { BlockComponent } from './Block';
import { BlockType } from '../../schemas/block.schema';
import './BuilderView.css';

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
const BLOCK_TEMPLATES: Record<BlockType, { hint: string, template: string }> = {
    Role: {
        hint: "Define who the AI is acting as. Be specific about expertise and traits.",
        template: "Act as an expert [Role] who specializes in [Field]. You have deep knowledge of [Topic] and prioritize [Principle]."
    },
    Task: {
        hint: "Define exactly what you want the AI to do. Start with an action verb.",
        template: "Your task is to [Action] the following [Input]. Ensure you cover [Requirement 1] and [Requirement 2]."
    },
    Context: {
        hint: "Provide constraints, background info, or audience details.",
        template: "The target audience is [Audience]. The tone should be [Tone]. Avoid [Negative Constraint]."
    },
    Output: {
        hint: "Specify the exact format and structure of the response.",
        template: "Return the result in [Format] format. Do not include [Exclusion]. Structure the response with the following headers: [Header 1], [Header 2]."
    },
    Style: {
        hint: "Define the tone, voice, and writing style.",
        template: "Use a [Adjective] tone. specific vocabulary related to [Field]. Avoid passive voice."
    },
    Constraints: {
        hint: "Hard limits on what the AI can/cannot do.",
        template: "Do not use [Forbidden Element]. Limit response length to [Number] words."
    }
};

export const BuilderView = () => {
    const [selectedCategory, setSelectedCategory] = useState<BlockType>('Role');
    const [pickerSearch, setPickerSearch] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Naming / Creation State
    const [isNamingPrompt, setIsNamingPrompt] = useState(false);
    const [promptName, setPromptName] = useState('New Prompt');

    // New Block Creation State
    const [isCreatingBlock, setIsCreatingBlock] = useState(false);
    const [newBlockLabel, setNewBlockLabel] = useState('');
    const [newBlockContent, setNewBlockContent] = useState('');

    // Global Stores
    const { activePromptId, currentBlockIds, addBlockId, removeBlockId, clear: clearBuilder } = useBuilderStore();
    const { addBlock, updateBlock, deleteBlock, getBlocksByType } = useBlockStore();
    const blocksMap = useBlockStore(state => state.blocks);
    const { addPrompt, updatePrompt, getPrompt } = usePromptStore();

    // Derived Data: Available Blocks in Category
    const categoryBlocks = useMemo(() => {
        return getBlocksByType(selectedCategory);
    }, [selectedCategory, blocksMap]);

    // Search Filtering
    const filteredBlocks = useMemo(() => {
        const lowerSearch = pickerSearch.toLowerCase();
        return categoryBlocks.filter(block =>
            block.label?.toLowerCase().includes(lowerSearch) ||
            block.content.toLowerCase().includes(lowerSearch)
        );
    }, [categoryBlocks, pickerSearch]);

    // --- Actions ---

    const handleAddBlockToCanvas = (id: string) => {
        addBlockId(id);
    };

    const handleCreateBlockClick = () => {
        setNewBlockLabel('');
        setNewBlockContent(BLOCK_TEMPLATES[selectedCategory].template);
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
            content: newBlockContent
        });

        addBlockId(id); // Auto-add to canvas? Yes, usually desired.
        setIsCreatingBlock(false);
    };

    const handleUpdateBlockInCanvas = (id: string, content: string) => {
        // NOTE: This updates the global block definition, affecting all prompts using it.
        // In a real app, you might warn the user or create a fork.
        // For now, we update in place as per simplified requirements.
        updateBlock(id, { content });
    };

    const handleDeleteBlockFromCanvas = (id: string) => {
        removeBlockId(id);
        // We do NOT delete from the global library here, just the canvas.
    };

    const handleClearCanvas = () => {
        if (confirm('Are you sure you want to clear all blocks from the canvas?')) {
            clearBuilder();
            setIsNamingPrompt(false);
        }
    };

    const livePreview = currentBlockIds
        .map(id => blocksMap[id])
        .filter(Boolean)
        .map(block => block.content)
        .filter(content => content && content.trim().length > 0)
        .join('\n\n');

    const handleCopyPreview = () => {
        navigator.clipboard.writeText(livePreview);
    };

    // --- Prompt Persisting ---

    const handleSavePromptClick = async () => {
        if (currentBlockIds.length === 0) {
            alert('Cannot save an empty prompt.');
            return;
        }
        if (saveStatus !== 'idle') return;

        if (activePromptId) {
            await performPromptSave();
        } else {
            setPromptName('New Prompt');
            setIsNamingPrompt(true);
        }
    };

    const performPromptSave = async (nameOverride?: string) => {
        try {
            setSaveStatus('saving');
            await new Promise(resolve => setTimeout(resolve, 600)); // UX delay

            if (activePromptId) {
                updatePrompt(activePromptId, {
                    blocks: currentBlockIds,
                });
                finalizeSave();
            } else {
                const title = nameOverride || promptName;
                if (!title.trim()) {
                    alert('Please enter a valid name.');
                    setSaveStatus('idle');
                    return;
                }

                const newId = addPrompt({
                    title,
                    blocks: currentBlockIds,
                    tags: { style: [], topic: [], technique: [] }
                });

                const newPrompt = getPrompt(newId);
                if (newPrompt) {
                    useBuilderStore.getState().loadPrompt(newPrompt);
                    finalizeSave();
                    setIsNamingPrompt(false);
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

    const finalizeSave = () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    return (
        <div className="builder-layout">
            {/* PANE 1: CATEGORY NAVIGATION */}
            <div className="pane-categories">
                <div className="pane-header">
                    <h3>Collection</h3>
                </div>
                <div className="category-list">
                    {BLOCK_TYPES.map(type => {
                        const Icon = TYPE_ICONS[type];
                        return (
                            <button
                                key={type}
                                className={`category-tab ${selectedCategory === type ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedCategory(type);
                                    setIsCreatingBlock(false);
                                }}
                            >
                                <Icon size={16} />
                                <span>{type}</span>
                                {selectedCategory === type && <ChevronRight className="active-indicator" size={14} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PANE 2: BLOCK PICKER / BROWSER */}
            <div className="pane-picker">
                <div className="pane-header">
                    <h3>{selectedCategory}s</h3>
                    <div className="picker-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder={`Search ${selectedCategory}s...`}
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="picker-content">
                    {/* Create New Block Card */}
                    <div
                        className={`picker-card create-new ${isCreatingBlock ? 'active' : ''}`}
                        onClick={handleCreateBlockClick}
                    >
                        <Plus size={20} />
                        <span>New {selectedCategory}</span>
                    </div>

                    {/* Creation Form (Inline) */}
                    {isCreatingBlock && (
                        <div className="block-creation-form">
                            <div className="form-header">
                                <span>New {selectedCategory}</span>
                                <button className="close-btn" onClick={() => setIsCreatingBlock(false)}><X size={14} /></button>
                            </div>
                            <div className="form-hint">
                                {BLOCK_TEMPLATES[selectedCategory].hint}
                            </div>
                            <input
                                type="text"
                                placeholder="Label (e.g. 'Frontend Expert')"
                                value={newBlockLabel}
                                onChange={(e) => setNewBlockLabel(e.target.value)}
                                autoFocus
                                className="creation-input"
                            />
                            <textarea
                                placeholder="Content..."
                                value={newBlockContent}
                                onChange={(e) => setNewBlockContent(e.target.value)}
                                className="creation-textarea"
                                rows={4}
                            />
                            <button className="create-confirm-btn" onClick={handleSaveNewBlock}>
                                Create Block
                            </button>
                        </div>
                    )}

                    {/* Block List */}
                    <div className="blocks-list">
                        {filteredBlocks.map(block => (
                            <div
                                key={block.id}
                                className="picker-card block-item"
                                onClick={() => handleAddBlockToCanvas(block.id)}
                            >
                                <div className="block-item-header">
                                    <span className="block-label">{block.label || 'Untitled Block'}</span>
                                    <Plus size={14} className="add-icon" />
                                </div>
                                <div className="block-preview">
                                    {block.content.substring(0, 60)}...
                                </div>
                            </div>
                        ))}
                        {filteredBlocks.length === 0 && !isCreatingBlock && (
                            <div className="empty-search">
                                <p>No blocks found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PANE 3: PROMPT CANVAS */}
            <div className="pane-canvas">
                <div className="canvas-header">
                    <h3>Prompt Canvas</h3>
                    <button className="text-btn danger" onClick={handleClearCanvas} title="Clear all">
                        <Trash size={14} />
                    </button>
                </div>

                <div className="canvas-scroll-area">
                    {currentBlockIds.length === 0 ? (
                        <div className="canvas-empty-state">
                            <p>Select blocks from the library to build your prompt.</p>
                        </div>
                    ) : (
                        <div className="canvas-blocks">
                            {currentBlockIds.map(id => {
                                const block = blocksMap[id];
                                if (!block) return null;
                                return (
                                    <BlockComponent
                                        key={id}
                                        block={block}
                                        onUpdate={handleUpdateBlockInCanvas}
                                        onDelete={handleDeleteBlockFromCanvas}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="canvas-footer">
                    {isNamingPrompt ? (
                        <div className="footer-naming-mode">
                            <input
                                type="text"
                                value={promptName}
                                onChange={(e) => setPromptName(e.target.value)}
                                className="naming-input"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') performPromptSave();
                                    if (e.key === 'Escape') setIsNamingPrompt(false);
                                }}
                            />
                            <button className="footer-btn secondary" onClick={() => setIsNamingPrompt(false)}>Cancel</button>
                            <button className="footer-btn primary" onClick={() => performPromptSave()}>Save</button>
                        </div>
                    ) : (
                        <>
                            <button
                                className={`footer-btn secondary ${saveStatus === 'saved' ? 'success' : ''}`}
                                onClick={handleSavePromptClick}
                                disabled={saveStatus === 'saving'}
                            >
                                {saveStatus === 'idle' && (
                                    <>
                                        <Save size={16} />
                                        {activePromptId ? 'Save Prompt' : 'Save As New'}
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
                            <button className="footer-btn primary" onClick={handleCopyPreview}>
                                <Copy size={16} /> Copy
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
