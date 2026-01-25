import React, { useEffect, useState } from 'react';
import { useImportStore } from '../../stores/useImportStore';
import { ImportInput } from './ImportInput';
import { DissectionCanvas } from './DissectionCanvas';
import { ImportSummary } from './ImportSummary';
import type { ImportSource } from '../../schemas/import.schema';
import { usePromptStore } from '../../stores/usePromptStore';
import { useUIStore } from '../../stores/useUIStore';
import './Import.css';

export const ImportView: React.FC = () => {
    const { currentSession, startImport, dissectPrompt, setStage, clearSession } = useImportStore();
    const { addPrompt } = usePromptStore();
    const { setActiveView } = useUIStore();
    const [skipModalOpen, setSkipModalOpen] = useState(false);
    const [skipContent, setSkipContent] = useState('');
    const [skipSource, setSkipSource] = useState<{ type: 'text' | 'file'; filename?: string } | null>(null);
    const [skipTags, setSkipTags] = useState<string[]>([]);
    const [skipTagInput, setSkipTagInput] = useState('');

    useEffect(() => {
        return () => {
            // Cleanup on unmount if needed
        };
    }, []);

    const handleInputNext = (content: string, source: { type: 'text' | 'file'; filename?: string }) => {
        const importSource: ImportSource = {
            type: source.type,
            content,
            filename: source.filename,
        };

        startImport(importSource);
        dissectPrompt();
        setStage('dissection');
    };

    const handleDissectionNext = () => {
        setStage('review');
    };

    const handleDissectionBack = () => {
        setStage('input');
    };

    const handleReviewBack = () => {
        setStage('dissection');
    };

    const handleSkipDissection = (content: string, source: { type: 'text' | 'file'; filename?: string }) => {
        setSkipContent(content);
        setSkipSource(source);
        setSkipModalOpen(true);
    };

    const currentStage = currentSession?.stage || 'input';

    return (
        <div className="import-view">
            <div className="import-header">
                <h1>Import Prompt</h1>
                <div className="import-progress">
                    <div className={`import-step ${currentStage === 'input' ? 'active' : (currentStage === 'dissection' || currentStage === 'review' || currentStage === 'complete') ? 'completed' : ''}`}>
                        <div className="import-step-number">1</div>
                        <span>Input</span>
                    </div>
                    <div className={`import-step ${currentStage === 'dissection' ? 'active' : currentStage === 'review' || currentStage === 'complete' ? 'completed' : ''}`}>
                        <div className="import-step-number">2</div>
                        <span>Dissect</span>
                    </div>
                    <div className={`import-step ${currentStage === 'review' ? 'active' : currentStage === 'complete' ? 'completed' : ''}`}>
                        <div className="import-step-number">3</div>
                        <span>Review</span>
                    </div>
                </div>
            </div>

            {currentStage === 'input' && <ImportInput onNext={handleInputNext} onSkip={handleSkipDissection} />}

            {currentStage === 'dissection' && (
                <>
                    <DissectionCanvas />
                    <div className="import-actions" style={{ paddingTop: 0, marginTop: '-0.75rem' }}>
                        <button
                            className="import-button import-button-secondary"
                            onClick={handleDissectionBack}
                        >
                            Back
                        </button>
                        <button
                            className="import-button import-button-primary"
                            onClick={handleDissectionNext}
                            disabled={!currentSession || currentSession.blocks.length === 0}
                        >
                            Next: Review & Save
                        </button>
                    </div>
                </>
            )}

            {currentStage === 'review' && (
                <>
                    <ImportSummary onBack={handleReviewBack} />
                </>
            )}

            {/* Skip Dissection Modal */}
            {skipModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Save Full Prompt</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            Save this prompt as a single unit without dissection. You can add it to the canvas later.
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                            <input
                                type="text"
                                placeholder="Enter prompt title..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                }}
                                id="full-prompt-title"
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description (optional)</label>
                            <textarea
                                placeholder="Enter description..."
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    resize: 'vertical',
                                }}
                                id="full-prompt-description"
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tags</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {skipTags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: 'var(--accent-primary)',
                                            color: 'white',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSkipTags(skipTags.filter((_, i) => i !== idx))}
                                    >
                                        {tag} ×
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Type and press Enter..."
                                value={skipTagInput}
                                onChange={(e) => setSkipTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && skipTagInput.trim()) {
                                        e.preventDefault();
                                        const trimmed = skipTagInput.trim();
                                        if (!skipTags.includes(trimmed)) {
                                            setSkipTags([...skipTags, trimmed]);
                                        }
                                        setSkipTagInput('');
                                    } else if (e.key === 'Backspace' && !skipTagInput && skipTags.length > 0) {
                                        setSkipTags(skipTags.slice(0, -1));
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                className="import-button import-button-secondary"
                                onClick={() => {
                                    setSkipModalOpen(false);
                                    setSkipContent('');
                                    setSkipSource(null);
                                    setSkipTags([]);
                                    setSkipTagInput('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="import-button import-button-primary"
                                onClick={() => {
                                    const titleInput = document.getElementById('full-prompt-title') as HTMLInputElement;
                                    const descInput = document.getElementById('full-prompt-description') as HTMLTextAreaElement;
                                    const title = titleInput?.value.trim();
                                    const description = descInput?.value.trim();

                                    if (!title) {
                                        alert('Please enter a title');
                                        return;
                                    }

                                    addPrompt({
                                        title,
                                        description,
                                        blocks: [],
                                        isFullPrompt: true,
                                        fullPromptContent: skipContent,
                                        tags: { style: skipTags, topic: [], technique: [] },
                                        importedFrom: skipSource?.filename || 'pasted text',
                                        importedAt: new Date().toISOString(),
                                    });

                                    clearSession();
                                    setSkipModalOpen(false);
                                    setSkipTags([]);
                                    setSkipTagInput('');
                                    setActiveView('library');
                                }}
                            >
                                Save Full Prompt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
