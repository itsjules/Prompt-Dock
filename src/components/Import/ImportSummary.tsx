import React, { useState } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useImportStore } from '../../stores/useImportStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { usePromptStore } from '../../stores/usePromptStore';
import './Import.css';
import { Library, Layers, ArrowLeft, X } from 'lucide-react';

interface ImportSummaryProps {
    onBack: () => void;
}

export const ImportSummary: React.FC<ImportSummaryProps> = ({ onBack }) => {
    const { setActiveView } = useUIStore();
    const { currentSession, clearSession } = useImportStore();
    const { importBlocks } = useBlockStore();
    const { addPrompt } = usePromptStore();

    const [promptTitle, setPromptTitle] = useState(
        currentSession?.metadata?.promptTitle || 'Imported Prompt'
    );
    const [promptDescription, setPromptDescription] = useState(
        currentSession?.metadata?.promptDescription || ''
    );
    // Tag State
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const [isSaving, setIsSaving] = useState(false);

    if (!currentSession) return null;

    const { blocks, source } = currentSession;

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Separate named and unnamed blocks
            const namedBlocks = blocks.filter(b => b.label && b.label.trim());
            const unnamedBlocks = blocks.filter(b => !b.label || !b.label.trim());

            // Only import named blocks to library
            let blockIds: string[] = [];
            if (namedBlocks.length > 0) {
                blockIds = importBlocks(
                    namedBlocks.map((block) => ({
                        type: block.suggestedType,
                        label: block.label!,
                        content: block.content,
                        isFavorite: false,
                    }))
                );
            }

            // Save prompt with named block IDs and unnamed blocks inline
            addPrompt({
                title: promptTitle,
                description: promptDescription,
                blocks: blockIds, // Only named blocks
                inlineBlocks: unnamedBlocks.map(block => ({
                    type: block.suggestedType,
                    content: block.content,
                })), // Unnamed blocks stored inline
                isFullPrompt: false, // This is a dissected prompt, not a full prompt
                tags: {
                    style: [],
                    topic: tags, // Store all tags in topic for now as per SaveMetadataModal simplicity
                    technique: [],
                },
                importedFrom: source.filename || 'pasted text',
                importedAt: new Date().toISOString(),
            });

            clearSession();
            setActiveView('library');
        } catch (error) {
            console.error('Failed to save import:', error);
            alert('Failed to save imported prompt. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = tagInput.trim();
            if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed]);
                setTagInput('');
            }
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleGoToBuilder = async () => {
        await handleSave();
        setActiveView('builder');
    };

    return (
        <div className="import-summary">
            <div className="import-summary-content-grid">
                {/* Left Column: Block Preview + Stats */}
                <div className="import-summary-preview">
                    <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>Block Preview</h3>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        margin: '0 0 1rem 0'
                    }}>
                        Enter names for the blocks. Named blocks can be found in the library later.
                    </p>
                    <div className="import-summary-block-list">
                        {blocks.map((block, index) => {
                            const hasName = block.label && block.label.trim();
                            return (
                                <div key={block.id} className="import-summary-block-item">
                                    <div className="import-summary-block-type">
                                        {index + 1}. {block.suggestedType}
                                    </div>
                                    <input
                                        type="text"
                                        className="import-summary-block-label-input"
                                        value={block.label || ''}
                                        onChange={(e) => {
                                            // Update the block label in the store
                                            const { updateBlock } = useImportStore.getState();
                                            updateBlock(block.id, { label: e.target.value });
                                        }}
                                        placeholder="Enter block name..."
                                    />
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: hasName ? 'var(--accent-success)' : 'var(--text-tertiary)',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {hasName ? '✓ Library' : '○ Prompt only'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                    }}>
                        Summary: {blocks.filter(b => b.label && b.label.trim()).length} blocks → Library | {blocks.filter(b => !b.label || !b.label.trim()).length} blocks → Prompt only
                    </div>
                </div>

                {/* Right Column: Prompt Details */}
                <div className="import-input-section">
                    <h2>Prompt Details</h2>
                    <p style={{ marginBottom: '1rem' }}>Give your imported prompt a title and description.</p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Title *
                        </label>
                        <input
                            type="text"
                            value={promptTitle}
                            onChange={(e) => setPromptTitle(e.target.value)}
                            placeholder="Enter prompt title..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '2px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: '0.9375rem',
                            }}
                            spellCheck={false}
                        />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Description (optional)
                        </label>
                        <textarea
                            value={promptDescription}
                            onChange={(e) => setPromptDescription(e.target.value)}
                            placeholder="Add a description..."
                            style={{
                                width: '100%',
                                flex: 1, // Fill remaining space in details column
                                minHeight: '100px',
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '2px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: '0.9375rem',
                                resize: 'none',
                            }}
                            spellCheck={false}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Tags
                        </label>
                        <div className="import-tags-input-container" onClick={() => document.getElementById('import-tag-input')?.focus()}>
                            {tags.map((tag, index) => (
                                <span key={index} className="import-tag-pill">
                                    {tag}
                                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="import-tag-input"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                                className="import-tag-input-field"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="import-actions" style={{ justifyContent: 'space-between' }}>
                <button
                    className="import-button import-button-secondary"
                    onClick={onBack}
                    disabled={isSaving}
                >
                    <ArrowLeft size={16} />
                    Back to Editing
                </button>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="import-button import-button-secondary"
                        onClick={handleGoToBuilder}
                        disabled={isSaving || !promptTitle.trim()}
                    >
                        <Layers size={16} />
                        {isSaving ? 'Saving...' : 'Save & Open in Builder'}
                    </button>
                    <button
                        className="import-button import-button-primary"
                        onClick={handleSave}
                        disabled={isSaving || !promptTitle.trim()}
                    >
                        <Library size={16} />
                        {isSaving ? 'Saving...' : 'Save to Library'}
                    </button>
                </div>
            </div>
        </div>
    );
};
