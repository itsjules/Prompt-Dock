import { useState } from 'react';
import { Plus, Copy, Trash, Save, Search, User, CheckSquare, FileText, MessageSquare, Palette, ShieldAlert, ChevronRight } from 'lucide-react';
import { useBlockStore } from '../../stores/useBlockStore';
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

// Mock data for the "Picker" pane to simulate the "Collection" feel from the sketch
const MOCK_PRESETS: Record<BlockType, string[]> = {
    Role: ['UX Expert', 'Senior Developer', 'Creative Writer', 'Data Analyst'],
    Task: ['Analyze Data', 'Write Documentation', 'Debug Code', 'Brainstorm Ideas'],
    Context: ['Technical Audience', 'Beginner Friendly', 'Executive Summary'],
    Output: ['Markdown Table', 'JSON Format', 'Bullet Points'],
    Style: ['Professional', 'Casual', 'Socratic', 'Concise'],
    Constraints: ['No Jargon', 'Under 500 words', 'Use active voice'],
};

export const BuilderView = () => {
    const [selectedCategory, setSelectedCategory] = useState<BlockType>('Role');
    const [pickerSearch, setPickerSearch] = useState('');

    // We keep track of the block IDs in order for this specific prompt being built
    const [blockIds, setBlockIds] = useState<string[]>([]);

    const { addBlock, updateBlock, deleteBlock } = useBlockStore();
    const blocksMap = useBlockStore(state => state.blocks);

    const handleAddBlock = (type: BlockType, content: string = '') => {
        const id = addBlock({
            type,
            content,
        });
        setBlockIds([...blockIds, id]);
    };

    const handleUpdateBlock = (id: string, content: string) => {
        updateBlock(id, { content });
    };

    const handleDeleteBlock = (id: string) => {
        deleteBlock(id);
        setBlockIds(blockIds.filter(bId => bId !== id));
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear all blocks?')) {
            blockIds.forEach(id => deleteBlock(id));
            setBlockIds([]);
        }
    };

    const livePreview = blockIds
        .map(id => blocksMap[id])
        .filter(Boolean)
        .map(block => block.content)
        .filter(content => content && content.trim().length > 0)
        .join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(livePreview);
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
                    {blockIds.length === 0 ? (
                        <div className="canvas-empty-state">
                            <p>Select blocks from the left to build your prompt.</p>
                        </div>
                    ) : (
                        <div className="canvas-blocks">
                            {blockIds.map(id => {
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
                    <button className="footer-btn secondary" onClick={() => {/* Save logic */ }}>
                        <Save size={16} /> Save Full Prompt
                    </button>
                    <button className="footer-btn primary" onClick={handleCopy}>
                        <Copy size={16} /> Copy
                    </button>
                </div>
            </div>
        </div>
    );
};
