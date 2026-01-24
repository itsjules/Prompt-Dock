import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus, Save, Star, ChevronRight } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { useEffect, useRef, useState } from 'react';
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
    onToggleFavorite?: (id: string) => void; // New prop for favoriting
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
    isCompact?: boolean; // New: Compact mode for picker
}

const BLOCK_COLORS: Record<BlockType, string> = {
    Role: '#264868ff',        // Rich Ocean (Teal)
    Task: '#49375fff',        // Rich Indigo (Was Aubergine)
    Context: '#85621eff',     // Rich Mustard (Bronze)
    Output: '#3b6646ff',      // Rich Sage (Forest)
    Style: '#7e2a58ff',       // Rich Raspberry (Was Lavender)
    Constraints: '#7D3535', // Rich Rosewood (Terra Cotta)
};

// Accent colors: Keep these vibrant for the "pop" (borders)
// Accent colors: Normalized high-brightness for consistent visibility against dark rich backgrounds
const BLOCK_ACCENTS: Record<BlockType, string> = {
    Role: '#80DEEA',        // Bright Cyan
    Task: '#9FA8DA',        // Bright Indigo/Periwinkle
    Context: '#FFE082',     // Bright Amber
    Output: '#C5E1A5',      // Bright Light Green
    Style: '#F48FB1',       // Bright Pink
    Constraints: '#EF9A9A', // Bright Red
};

// Helper: Darken slightly for rich background (0.6 multiplier)
const darkenColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const dark = (c: number) => Math.floor(c * 0.6);

    return `#${dark(r).toString(16).padStart(2, '0')}${dark(g).toString(16).padStart(2, '0')}${dark(b).toString(16).padStart(2, '0')}`;
};

// Helper: Boost brightness for accent colors (mix 60% white)
const lightenColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const mix = (c: number) => Math.min(255, Math.floor(c * 0.4 + 255 * 0.6));
    return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`;
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
    onToggleFavorite,
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
    isDirty,
    isCompact = false
}: BlockProps) => {

    const effectiveDraggableId = draggableId || block.id;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(isCompact);

    // Toggle collapse
    const toggleCollapse = () => {
        if (isCompact) {
            setIsCollapsed(!isCollapsed);
        }
    };

    // Sync collapsed state with compact prop
    useEffect(() => {
        setIsCollapsed(isCompact);
    }, [isCompact]);

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
    }, [block.content, draftContent, autoExpandTextarea, isCollapsed]);

    // Determine colors: Use rich darken logic
    const blockColor = categoryColor ? darkenColor(categoryColor) : BLOCK_COLORS[block.type as BlockType] || '#2c2e33';
    // Use the raw accent color for borders
    const accentColor = categoryColor || BLOCK_ACCENTS[block.type as BlockType] || '#9065B0';

    // For pastel backgrounds, force dark text
    const displayContent = draftContent !== undefined ? draftContent : block.content;
    const displayLabel = draftLabel !== undefined ? draftLabel : block.label;

    // Uniform off-white for text/icons to match Prompt Card title (Warm Bone)
    const headerContentColor = '#EAE0D5';

    const renderContent = (dragProps: any = {}, dragHandleProps: any = {}, isDragging: boolean = false, innerRef: any = null) => (
        <div
            className={`block-item ${isDragging ? 'is-dragging' : ''} ${!isEditable ? 'read-only-block' : ''}`}
            style={{
                borderLeftColor: accentColor,
                ...dragProps.style
            }}
            ref={innerRef}
            {...dragProps}
            onClick={isCompact ? toggleCollapse : onClick} // Bind click to toggle in compact mode
        >
            <div className="block-header" style={{ backgroundColor: blockColor, cursor: isCompact ? 'pointer' : 'default' }}>
                {!hideDragHandle && isDraggable && (
                    <div className="block-drag-handle" {...dragHandleProps}>
                        <GripVertical size={14} color={headerContentColor} />
                    </div>
                )}
                {/* Expand Indicator for Compact Mode */}
                {isCompact && (
                    <div style={{ marginRight: '6px', color: headerContentColor, display: 'flex', alignItems: 'center' }}>
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                    <span className="block-type" style={{ color: headerContentColor, fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8 }}>
                        {block.type.toUpperCase()}
                    </span>
                    {/* Favorite Button (Inline next to type or absolute top right?) - Inline is tight. Let's put it in actions or absolute. 
                        Actually, header actions is best. */}
                    {isEditable && onLabelUpdate ? (
                        <input
                            type="text"
                            value={displayLabel}
                            onChange={(e) => onLabelUpdate(block.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="block-label-input"
                            style={{ color: headerContentColor }}
                            spellCheck={false}
                        />
                    ) : (
                        <span className="block-label" style={{ color: headerContentColor, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {displayLabel || 'Untitled Block'}
                        </span>
                    )}
                </div>
                <div className="block-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {onToggleFavorite && (
                        <button
                            className={`block-favorite-btn ${block.isFavorite ? 'active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(block.id); }}
                            title={block.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            style={{ color: block.isFavorite ? '#ffb400' : headerContentColor, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                        >
                            <Star size={14} fill={block.isFavorite ? "currentColor" : "none"} />
                        </button>
                    )}
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
                            style={{ color: headerContentColor }}
                        >
                            <Plus size={16} />
                        </button>
                    )}
                    {!hideDelete && onDelete && (
                        <button
                            className="block-delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                            title="Remove block"
                            style={{ color: headerContentColor }}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            {!isCollapsed && (
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
                                style={{ color: headerContentColor }}
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button
                                className="corner-action-btn"
                                onClick={() => onMove(block.id, 'down')}
                                title="Move Down"
                                style={{ color: headerContentColor }}
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
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
