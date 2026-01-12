import { Trash2, GripVertical } from 'lucide-react';
import type { Block, BlockType } from '../../schemas/block.schema';
import './Block.css';

interface BlockProps {
    block: Block;
    onUpdate: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}

const BLOCK_COLORS: Record<BlockType, string> = {
    Role: '#1e3a5f',        // Dark Blue
    Task: '#4a2c5a',        // Dark Purple
    Context: '#5d3a1a',     // Dark Orange/Brown
    Output: '#1b4d3e',      // Dark Green
    Style: '#5a2e2e',       // Dark Red/Brown
    Constraints: '#5a1e1e', // Dark Red
};

// Accent colors for borders/text to make them pop against the dark backgrounds
const BLOCK_ACCENTS: Record<BlockType, string> = {
    Role: '#90caf9',
    Task: '#e1bee7',
    Context: '#ffcc80',
    Output: '#a5d6a7',
    Style: '#ffab91',
    Constraints: '#ef9a9a',
};

export const BlockComponent = ({ block, onUpdate, onDelete }: BlockProps) => {
    return (
        <div className="block-item" style={{ borderLeftColor: BLOCK_ACCENTS[block.type] }}>
            <div className="block-header" style={{ backgroundColor: BLOCK_COLORS[block.type] }}>
                <div className="block-drag-handle">
                    <GripVertical size={14} color={BLOCK_ACCENTS[block.type]} />
                </div>
                <span className="block-type" style={{ color: BLOCK_ACCENTS[block.type] }}>{block.type}</span>
                <button
                    className="block-delete-btn"
                    onClick={() => onDelete(block.id)}
                    title="Remove block"
                    style={{ color: BLOCK_ACCENTS[block.type] }}
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
