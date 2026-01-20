import { Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import type { Block, BlockType } from '../../schemas/block.schema';
import './Block.css';

interface BlockProps {
    block: Block;
    index: number;
    // Actions
    onUpdate?: (id: string, content: string) => void;
    onDelete?: (id: string) => void;
    onMove?: (id: string, direction: 'up' | 'down') => void;
    onClick?: () => void; // New prop for click interaction
    // Display / Behavior Flags
    draggableId?: string;
    isDraggable?: boolean;
    isEditable?: boolean;
    hideDragHandle?: boolean;
    hideDelete?: boolean;
    hideControls?: boolean;
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

export const BlockComponent = ({
    block,
    index,
    onUpdate,
    onDelete,
    onMove,
    onClick,
    draggableId,
    isDraggable = true,
    isEditable = true,
    hideDragHandle = false,
    hideDelete = false,
    hideControls = false
}: BlockProps) => {

    const effectiveDraggableId = draggableId || block.id;

    const renderContent = (dragProps: any = {}, dragHandleProps: any = {}, isDragging: boolean = false, innerRef: any = null) => (
        <div
            className={`block-item ${isDragging ? 'is-dragging' : ''} ${!isEditable ? 'read-only-block' : ''}`}
            style={{
                borderLeftColor: BLOCK_ACCENTS[block.type],
                ...dragProps.style
            }}
            ref={innerRef}
            {...dragProps}
            onClick={onClick} // Bind onClick here
        >
            <div className="block-header" style={{ backgroundColor: BLOCK_COLORS[block.type] }}>
                {!hideDragHandle && isDraggable && (
                    <div className="block-drag-handle" {...dragHandleProps}>
                        <GripVertical size={14} color={BLOCK_ACCENTS[block.type]} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span className="block-type" style={{ color: BLOCK_ACCENTS[block.type], fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>
                        {block.type.toUpperCase()}
                    </span>
                    <span className="block-label" style={{ color: BLOCK_ACCENTS[block.type], fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {block.label || 'Untitled Block'}
                    </span>
                </div>
                <div className="block-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!hideDelete && onDelete && (
                        <button
                            className="block-delete-btn"
                            onClick={() => onDelete(block.id)}
                            title="Remove block"
                            style={{ color: BLOCK_ACCENTS[block.type] }}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="block-content-area">
                <textarea
                    className="block-textarea"
                    value={block.content}
                    onChange={(e) => onUpdate && onUpdate(block.id, e.target.value)}
                    onClick={(e) => isEditable && e.stopPropagation()}
                    placeholder={`Enter ${block.type} here...`}
                    rows={3}
                    readOnly={!isEditable}
                    style={{ cursor: isEditable ? 'text' : 'pointer' }}
                />

                {!hideControls && onMove && isEditable && (
                    <div className="block-reorder-corner">
                        <button
                            className="corner-action-btn"
                            onClick={() => onMove(block.id, 'up')}
                            title="Move Up"
                            style={{ color: BLOCK_ACCENTS[block.type] }}
                        >
                            <ChevronUp size={16} />
                        </button>
                        <button
                            className="corner-action-btn"
                            onClick={() => onMove(block.id, 'down')}
                            title="Move Down"
                            style={{ color: BLOCK_ACCENTS[block.type] }}
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (!isDraggable) {
        return renderContent();
    }

    return (
        <Draggable draggableId={effectiveDraggableId} index={index}>
            {(provided, snapshot) => renderContent(provided.draggableProps, provided.dragHandleProps, snapshot.isDragging, provided.innerRef)}
        </Draggable>
    );
};
