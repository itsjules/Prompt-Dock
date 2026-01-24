import React, { useState } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useImportStore } from '../../stores/useImportStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { usePromptStore } from '../../stores/usePromptStore';
import './Import.css';

export const ImportSummary: React.FC = () => {
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
    const [isSaving, setIsSaving] = useState(false);

    if (!currentSession) return null;

    const { blocks, source } = currentSession;

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const blockIds = importBlocks(
                blocks.map((block) => ({
                    type: block.suggestedType,
                    label: block.label || `${block.suggestedType} Block`,
                    content: block.content,
                    isFavorite: false,
                }))
            );

            addPrompt({
                title: promptTitle,
                description: promptDescription,
                blocks: blockIds,
                tags: {
                    style: [],
                    topic: [],
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

    const handleGoToBuilder = async () => {
        await handleSave();
        setActiveView('builder');
    };

    return (
        <div className="import-summary">
            <div className="import-summary-stats">
                <div className="import-summary-stat">
                    <div className="import-summary-stat-value">{blocks.length}</div>
                    <div className="import-summary-stat-label">Blocks Created</div>
                </div>
                <div className="import-summary-stat">
                    <div className="import-summary-stat-value">
                        {blocks.filter((b) => b.isManual).length}
                    </div>
                    <div className="import-summary-stat-label">Manual Adjustments</div>
                </div>
                <div className="import-summary-stat">
                    <div className="import-summary-stat-value">
                        {blocks.filter((b) => b.confidence >= 80).length}
                    </div>
                    <div className="import-summary-stat-label">High Confidence</div>
                </div>
            </div>

            <div className="import-input-section">
                <h2>Prompt Details</h2>
                <p>Give your imported prompt a title and description.</p>

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
                    />
                </div>

                <div>
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
                            minHeight: '100px',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '2px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9375rem',
                            resize: 'vertical',
                        }}
                    />
                </div>
            </div>

            <div className="import-summary-preview">
                <h3>Block Preview</h3>
                <div className="import-summary-block-list">
                    {blocks.map((block, index) => (
                        <div key={block.id} className="import-summary-block-item">
                            <div className="import-summary-block-type">
                                {index + 1}. {block.suggestedType}
                            </div>
                            <div className="import-summary-block-preview">
                                {block.content.substring(0, 100)}
                                {block.content.length > 100 ? '...' : ''}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="import-actions">
                <button
                    className="import-button import-button-secondary"
                    onClick={handleSave}
                    disabled={isSaving || !promptTitle.trim()}
                >
                    {isSaving ? 'Saving...' : 'Save to Library'}
                </button>
                <button
                    className="import-button import-button-primary"
                    onClick={handleGoToBuilder}
                    disabled={isSaving || !promptTitle.trim()}
                >
                    {isSaving ? 'Saving...' : 'Save & Open in Builder'}
                </button>
            </div>
        </div>
    );
};
