import { useState } from 'react';
import { Plus, Copy, Trash, Save } from 'lucide-react';
import { useBlockStore } from '../../stores/useBlockStore';
import { BlockComponent } from './Block';
import { BlockType } from '../../schemas/block.schema';
import './BuilderView.css';

const BLOCK_TYPES: BlockType[] = ['Role', 'Task', 'Context', 'Output', 'Style', 'Constraints'];

export const BuilderView = () => {
    // We keep track of the block IDs in order for this specific prompt being built
    const [blockIds, setBlockIds] = useState<string[]>([]);

    const { addBlock, updateBlock, deleteBlock } = useBlockStore();

    const handleAddBlock = (type: BlockType) => {
        const id = addBlock({
            type,
            content: '',
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
            // Cleanup blocks from store
            blockIds.forEach(id => deleteBlock(id));
            setBlockIds([]);
        }
    };

    const blocksMap = useBlockStore(state => state.blocks);
    const livePreview = blockIds
        .map(id => blocksMap[id])
        .filter(Boolean)
        .map(block => block.content)
        .filter(content => content && content.trim().length > 0)
        .join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(livePreview);
        // Could show a toast here
    };

    return (
        <div className="builder-view">
            <div className="builder-sidebar">
                <div className="sidebar-header">
                    <h3>Add Block</h3>
                </div>
                <div className="block-buttons">
                    {BLOCK_TYPES.map(type => (
                        <button
                            key={type}
                            className="add-block-btn"
                            onClick={() => handleAddBlock(type)}
                        >
                            <Plus size={14} /> {type}
                        </button>
                    ))}
                </div>

                <div className="sidebar-preview">
                    <div className="preview-header">
                        <h3>Live Preview</h3>
                        <button className="icon-btn" onClick={handleCopy} title="Copy to clipboard">
                            <Copy size={16} />
                        </button>
                    </div>
                    <div className="preview-content">
                        {livePreview || <span className="placeholder">Prompt preview will appear here...</span>}
                    </div>
                </div>
            </div>

            <div className="builder-canvas">
                <div className="canvas-header">
                    <h2>Prompt Builder</h2>
                    <div className="canvas-actions">
                        <button className="text-btn danger" onClick={handleClear}>
                            <Trash size={14} /> Clear
                        </button>
                        {/* Save placeholder */}
                        <button className="text-btn primary" title="Save feature coming soon">
                            <Save size={14} /> Save
                        </button>
                    </div>
                </div>

                <div className="blocks-list">
                    {blockIds.length === 0 ? (
                        <div className="canvas-empty">
                            <p>Select a block type from the left to start building.</p>
                        </div>
                    ) : (
                        blockIds.map(id => {
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
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
