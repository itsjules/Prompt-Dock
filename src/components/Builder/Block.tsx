import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus, Save } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { useEffect, useRef } from 'react';
import type { Block, BlockType } from '../../schemas/block.schema';
import './Block.css';

interface BlockProps {
    block: Block;
    index: number;
    // Actions
    onUpdate?: (id: string, content: string) => void;
    onLabelUpdate?: (id: string, label: string) => void; // New prop for label editing
    onSave?: (id: string) => void; // New prop for saving changes
    onDelete?: (id: string) => void;
    onMove?: (id: string, direction: 'up' | 'down') => void;
    onAdd?: (id: string) => void; // New prop for adding block to canvas
    onClick?: () => void; // New prop for click interaction
    // Display / Behavior Flags
    draggableId?: string;
    isDraggable?: boolean;
    isEditable?: boolean;
    hideDragHandle?: boolean;
    hideDelete?: boolean;
    hideAdd?: boolean;
    hideControls?: boolean;
    autoExpandTextarea?: boolean; // New prop for canvas blocks
    categoryColor?: string; // Custom category color
    // Draft / Edit Mode Props
    draftContent?: string;
    draftLabel?: string;
    isDirty?: boolean;
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

// Helper functions to create dark background and light accent from a base color
const darkenColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const darkR = Math.floor(r * 0.25);
    const darkG = Math.floor(g * 0.25);
    const darkB = Math.floor(b * 0.25);

    return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
};

const lightenColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const lightR = Math.floor(r + (255 - r) * 0.5);
    const lightG = Math.floor(g + (255 - g) * 0.5);
    const lightB = Math.floor(b + (255 - b) * 0.5);

    return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
};

export const BlockComponent = ({
    block,
    index,
    onUpdate,
    onLabelUpdate,
    onSave,
    onDelete,
    onMove,
    onAdd,
    onClick,
    draggableId,
    isDraggable = true,
    isEditable = true,
    hideDragHandle = false,
    hideDelete = false,
    hideAdd = true,
    hideControls = false,
    autoExpandTextarea = false,
    categoryColor,
    draftContent,
    draftLabel,
    isDirty
}: BlockProps) => {

    const effectiveDraggableId = draggableId || block.id;
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea to fit content (for canvas blocks)
    useEffect(() => {
        if (autoExpandTextarea && textareaRef.current) {
            const textarea = textareaRef.current;
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto';
            // Set height to scrollHeight to fit all content (use draftContent if available)
            // Actually, value is controlled, so just triggering on value change is enough.
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [block.content, draftContent, autoExpandTextarea]);

    // Determine colors: use custom category color if provided, otherwise use default
    const blockColor = categoryColor ? darkenColor(categoryColor) : BLOCK_COLORS[block.type as BlockType] || '#2c2e33';
    const accentColor = categoryColor ? lightenColor(categoryColor) : BLOCK_ACCENTS[block.type as BlockType] || '#9065B0';

    const displayContent = draftContent !== undefined ? draftContent : block.content;
    const displayLabel = draftLabel !== undefined ? draftLabel : block.label;

    const renderContent = (dragProps: any = {}, dragHandleProps: any = {}, isDragging: boolean = false, innerRef: any = null) => (
        <div
            className={`block-item ${isDragging ? 'is-dragging' : ''} ${!isEditable ? 'read-only-block' : ''}`}
            style={{
                borderLeftColor: accentColor,
                ...dragProps.style
            }}
            ref={innerRef}
            {...dragProps}
            onClick={onClick} // Bind onClick here
        >
            <div className="block-header" style={{ backgroundColor: blockColor }}>
                {!hideDragHandle && isDraggable && (
                    <div className="block-drag-handle" {...dragHandleProps}>
                        <GripVertical size={14} color={accentColor} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span className="block-type" style={{ color: accentColor, fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>
                        {block.type.toUpperCase()}
                    </span>
                    {isEditable && onLabelUpdate ? (
                        <input
                            type="text"
                            value={displayLabel}
                            onChange={(e) => onLabelUpdate(block.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="block-label-input"
                            style={{ color: accentColor }}
                            spellCheck={false}
                        />
                    ) : (
                        <span className="block-label" style={{ color: accentColor, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {displayLabel || 'Untitled Block'}
                        </span>
                    )}
                </div>
                <div className="block-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isDirty && onSave && (
                        <button
                            className="block-save-btn"
                            onClick={(e) => { e.stopPropagation(); onSave(block.id); }}
                            title="Unsaved changes - Click to Save"
                            style={{ color: '#FCD34D', animation: 'pulse 2s infinite' }} // Yellow/Orange warning color
                        >
                            <Save size={16} />
                        </button>
                    )}
                    {!hideAdd && onAdd && (
                        <button
                            className="block-add-btn"
                            onClick={(e) => { e.stopPropagation(); onAdd(block.id); }}
                            title="Add to canvas"
                            style={{ color: accentColor }}
                        >
                            <Plus size={16} />
                        </button>
                    )}
                    {!hideDelete && onDelete && (
                        <button
                            className="block-delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                            title="Remove block"
                            style={{ color: accentColor }}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="block-content-area">
                <textarea
                    ref={textareaRef}
                    className="block-textarea"
                    value={displayContent}
                    spellCheck={false}
                    onChange={(e) => onUpdate && onUpdate(block.id, e.target.value)}
                    onClick={(e) => isEditable && e.stopPropagation()}
                    placeholder={`Enter ${block.type} here...`}
                    rows={autoExpandTextarea ? undefined : 3}
                    readOnly={!isEditable}
                    style={{
                        cursor: isEditable ? 'text' : 'pointer',
                        resize: autoExpandTextarea ? 'none' : 'vertical',
                        overflow: autoExpandTextarea ? 'hidden' : 'auto'
                    }}
                />

                {!hideControls && onMove && isEditable && (
                    <div className="block-reorder-corner">
                        <button
                            className="corner-action-btn"
                            onClick={() => onMove(block.id, 'up')}
                            title="Move Up"
                            style={{ color: accentColor }}
                        >
                            <ChevronUp size={16} />
                        </button>
                        <button
                            className="corner-action-btn"
                            onClick={() => onMove(block.id, 'down')}
                            title="Move Down"
                            style={{ color: accentColor }}
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
