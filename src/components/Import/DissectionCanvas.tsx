import React, { useRef, useState } from 'react';
import { Trash2, Split, Undo2, Redo2 } from 'lucide-react';
import { useImportStore } from '../../stores/useImportStore';
import { BlockTypeSelector } from './BlockTypeSelector';
import { ConfidenceBadge } from './ConfidenceBadge';
import './Import.css';

export const DissectionCanvas: React.FC = () => {
    const { currentSession, updateBlock, deleteBlock, changeBlockType, splitBlock, addBlock, undo, redo, canUndo, canRedo } = useImportStore();
    const [isAddingBlock, setIsAddingBlock] = useState(false);
    const blocksContainerRef = useRef<HTMLDivElement>(null);
    const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    if (!currentSession) return null;

    const { blocks, originalText } = currentSession;

    const handleContentChange = (id: string, content: string) => {
        updateBlock(id, { content });
    };

    const handleLabelChange = (id: string, label: string) => {
        updateBlock(id, { label });
    };

    const handleTypeChange = (id: string, newType: string) => {
        changeBlockType(id, newType);
    };

    const handleSplit = (id: string) => {
        const block = blocks.find((b) => b.id === id);
        if (!block) return;

        const midpoint = Math.floor(block.content.length / 2);
        splitBlock(id, midpoint);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this block?')) {
            deleteBlock(id);
        }
    };

    const handleAddBlock = () => {
        // Trigger animation
        setIsAddingBlock(true);
        setTimeout(() => setIsAddingBlock(false), 300);

        const newBlockId = addBlock('New block content...', 'Task');

        // Scroll to new block after a short delay
        setTimeout(() => {
            const newBlockElement = blockRefs.current[newBlockId];
            if (newBlockElement) {
                newBlockElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    };

    return (
        <div className="dissection-canvas">
            <div className="dissection-original">
                <h3>Original Text</h3>
                <div className="dissection-original-text">{originalText}</div>
            </div>

            <div className="dissection-blocks" ref={blocksContainerRef}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                        Dissected Blocks ({blocks.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="dissection-block-action-btn"
                            onClick={undo}
                            disabled={!canUndo()}
                            title="Undo (Ctrl+Z)"
                            style={{ padding: '0.5rem' }}
                        >
                            <Undo2 size={16} />
                        </button>
                        <button
                            className="dissection-block-action-btn"
                            onClick={redo}
                            disabled={!canRedo()}
                            title="Redo (Ctrl+Y)"
                            style={{ padding: '0.5rem' }}
                        >
                            <Redo2 size={16} />
                        </button>
                        <button
                            className={`import-button import-button-secondary ${isAddingBlock ? 'adding-block-animation' : ''}`}
                            onClick={handleAddBlock}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                            + Add Block
                        </button>
                    </div>
                </div>

                {blocks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 2rem',
                        color: 'var(--text-secondary)',
                    }}>
                        <p>No blocks detected. Try adding a block manually or adjust your input text.</p>
                    </div>
                ) : (
                    blocks.map((block, index) => (
                        <div
                            key={block.id}
                            ref={(el) => (blockRefs.current[block.id] = el)}
                            className="dissection-block-card"
                        >
                            <div className="dissection-block-header">
                                <div className="dissection-block-label-wrapper">
                                    <span className="block-number">Block {index + 1}:</span>
                                    <input
                                        type="text"
                                        className="dissection-block-label-input"
                                        value={block.label || ''}
                                        onChange={(e) => handleLabelChange(block.id, e.target.value)}
                                        placeholder="Enter block name..."
                                    />
                                </div>
                                <ConfidenceBadge
                                    level={block.confidenceLevel}
                                    score={block.confidence}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    Block Type
                                </label>
                                <BlockTypeSelector
                                    value={block.suggestedType}
                                    onChange={(newType) => handleTypeChange(block.id, newType)}
                                    suggestedType={!block.isManual ? block.suggestedType : undefined}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    Content
                                </label>
                                <textarea
                                    className="dissection-block-content"
                                    value={block.content}
                                    onChange={(e) => {
                                        handleContentChange(block.id, e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    ref={(el) => {
                                        if (el) {
                                            el.style.height = 'auto'; // Reset to recalculate
                                            el.style.height = `${el.scrollHeight}px`;
                                        }
                                    }}
                                    spellCheck={false}
                                />
                            </div>

                            <div className="dissection-block-actions">
                                <button
                                    className="dissection-block-action-btn"
                                    onClick={() => handleSplit(block.id)}
                                    title="Split this block into two"
                                >
                                    <Split size={14} />
                                    Split
                                </button>
                                <button
                                    className="dissection-block-action-btn danger"
                                    onClick={() => handleDelete(block.id)}
                                    title="Delete this block"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
