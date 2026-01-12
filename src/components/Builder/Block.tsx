import { Trash2, GripVertical } from 'lucide-react';
import type { Block, BlockType } from '../../schemas/block.schema';
import './Block.css';

interface BlockProps {
    block: Block;
    onUpdate: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}

const BLOCK_COLORS: Record<BlockType, string> = {
    Role: '#e3f2fd',    // Blue
    Task: '#f3e5f5',    // Purple
    Context: '#fff3e0', // Orange
    Output: '#e8f5e9',  // Green
    Style: '#fbe9e7',   // Deep Orange
    Constraints: '#ffebee', // Red
};

export const BlockComponent = ({ block, onUpdate, onDelete }: BlockProps) => {
    return (
        <div className="block-item" style={{ borderLeftColor: BLOCK_COLORS[block.type] }}>
            <div className="block-header" style={{ backgroundColor: BLOCK_COLORS[block.type] }}>
                <div className="block-drag-handle">
                    <GripVertical size={14} color="#888" />
                </div>
                <span className="block-type">{block.type}</span>
                <button
                    className="block-delete-btn"
                    onClick={() => onDelete(block.id)}
                    title="Remove block"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="block-content-area">
                <textarea
                    className="block-textarea"
                    value={block.content}
                    onChange={(e) => onUpdate(block.id, e.target.value)}
                    placeholder={`Enter ${block.type} here...`}
                    rows={3}
                />
            </div>
        </div>
    );
};
