import { useState } from 'react';
import { Plus, Copy, Trash, Save, Search, User, CheckSquare, FileText, MessageSquare, Palette, ShieldAlert, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useBlockStore } from '../../stores/useBlockStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { BlockComponent } from './Block';
import { BlockType } from '../../schemas/block.schema';
import { MOCK_PRESETS } from '../../constants/presets';
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

export const BuilderView = () => {
    const [selectedCategory, setSelectedCategory] = useState<BlockType>('Role');
    const [pickerSearch, setPickerSearch] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // New state for inline naming
    const [isNaming, setIsNaming] = useState(false);
    const [tempName, setTempName] = useState('New Prompt');

    // Global Stores
    const { activePromptId, currentBlockIds, addBlockId, removeBlockId, clear: clearBuilder } = useBuilderStore();
    const { addBlock, updateBlock, deleteBlock } = useBlockStore();
    const blocksMap = useBlockStore(state => state.blocks);
    const { addPrompt, updatePrompt, getPrompt } = usePromptStore();

    const handleAddBlock = (type: BlockType, content: string = '') => {
        const id = addBlock({
            type,
            content,
        });
        addBlockId(id);
    };

    const handleUpdateBlock = (id: string, content: string) => {
        updateBlock(id, { content });
    };

    const handleDeleteBlock = (id: string) => {
        // Remove from builder list
        removeBlockId(id);
        deleteBlock(id);
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear all blocks?')) {
            clearBuilder();
            setIsNaming(false);
        }
    };

    const livePreview = currentBlockIds
        .map(id => blocksMap[id])
        .filter(Boolean)
        .map(block => block.content)
        .filter(content => content && content.trim().length > 0)
        .join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(livePreview);
        // Optional: Could add copy feedback here too
    };

    const handleSaveClick = async () => {
        if (currentBlockIds.length === 0) {
            alert('Cannot save an empty prompt.');
            return;
        }

        if (saveStatus !== 'idle') return;

        if (activePromptId) {
            // Existing prompt - save immediately
            performSave();
        } else {
            // New prompt - show naming input
            setTempName('New Prompt');
            setIsNaming(true);
        }
    };

    const performSave = async (nameOverride?: string) => {
        try {
            setSaveStatus('saving');
            // Simulate minimal delay for UX
            await new Promise(resolve => setTimeout(resolve, 600));

            if (activePromptId) {
                updatePrompt(activePromptId, {
                    blocks: currentBlockIds,
                });
                finalizeSave();
            } else {
                // Creating new
                const title = nameOverride || tempName;
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
                    setIsNaming(false);
                } else {
                    console.error('Failed to retrieve new prompt immediately.');
                    setSaveStatus('idle');
                }
            }
        } catch (error: any) {
            console.error('Error in handleSave:', error);
            setSaveStatus('idle');
            alert(`An error occurred while saving: ${error.message || error}`);
        }
    };

    const finalizeSave = () => {
        setSaveStatus('saved');
        setTimeout(() => {
            setSaveStatus('idle');
        }, 2000);
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
                                onClick={() => setSelectedCategory(type)}
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
                            placeholder="Search..."
                            value={pickerSearch}
                            onChange={(e) => setPickerSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="picker-content">
                    {/* "Create New" Card */}
                    <div
                        className="picker-card create-new"
                        onClick={() => handleAddBlock(selectedCategory)}
                    >
                        <Plus size={20} />
                        <span>New {selectedCategory}</span>
                    </div>

                    {/* Mock Presets */}
                    {MOCK_PRESETS[selectedCategory]
                        .filter(item => item.toLowerCase().includes(pickerSearch.toLowerCase()))
                        .map((preset, idx) => (
                            <div
                                key={idx}
                                className="picker-card preset"
                                onClick={() => handleAddBlock(selectedCategory, preset)} // Pre-fill content
                            >
                                <span className="preset-name">{preset}</span>
                                <Plus size={14} className="add-icon" />
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* PANE 3: PROMPT CANVAS */}
            <div className="pane-canvas">
                <div className="canvas-header">
                    <h3>Prompt</h3>
                    <button className="text-btn danger" onClick={handleClear} title="Clear all">
                        <Trash size={14} />
                    </button>
                </div>

                <div className="canvas-scroll-area">
                    {currentBlockIds.length === 0 ? (
                        <div className="canvas-empty-state">
                            <p>Select blocks from the left to build your prompt.</p>
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
                                        onUpdate={handleUpdateBlock}
                                        onDelete={handleDeleteBlock}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="canvas-footer">
                    {isNaming ? (
                        <div className="footer-naming-mode" style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="naming-input"
                                autoFocus
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    flex: 1,
                                    outline: 'none'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') performSave();
                                    if (e.key === 'Escape') setIsNaming(false);
                                }}
                            />
                            <button className="footer-btn secondary" onClick={() => setIsNaming(false)}>Cancel</button>
                            <button className="footer-btn primary" onClick={() => performSave()}>Save</button>
                        </div>
                    ) : (
                        <>
                            <button
                                className={`footer-btn secondary ${saveStatus === 'saved' ? 'success' : ''}`}
                                onClick={handleSaveClick}
                                disabled={saveStatus === 'saving'}
                            >
                                {saveStatus === 'idle' && (
                                    <>
                                        <Save size={16} />
                                        {activePromptId ? 'Save Changes' : 'Save New'}
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
                            <button className="footer-btn primary" onClick={handleCopy}>
                                <Copy size={16} /> Copy
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
