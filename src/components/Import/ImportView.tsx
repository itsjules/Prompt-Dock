import React, { useEffect, useState } from 'react';
import { useImportStore } from '../../stores/useImportStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBlockStore } from '../../stores/useBlockStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { ImportInput } from './ImportInput';
import { DissectionCanvas } from './DissectionCanvas';
import { ImportSummary } from './ImportSummary';
import { SaveMetadataModal } from '../Builder/SaveMetadataModal';
import type { ImportSource } from '../../schemas/import.schema';
import './Import.css';

export const ImportView: React.FC = () => {
    const { currentSession, startImport, dissectPrompt, setStage, clearSession } = useImportStore();
    const { setActiveView } = useUIStore();
    const { importBlocks } = useBlockStore();
    const { addPrompt } = usePromptStore();
    const { draftMetadata } = useBuilderStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingFullPrompt, setPendingFullPrompt] = useState<{
        content: string;
        source: { type: 'text' | 'file'; filename?: string };
    } | null>(null);

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

    const handleSaveFullPrompt = (content: string, source: { type: 'text' | 'file'; filename?: string }) => {
        // Store the content and open the modal
        setPendingFullPrompt({ content, source });
        setIsModalOpen(true);
    };

    const handleModalSave = () => {
        if (!pendingFullPrompt) return;

        setIsSaving(true);

        try {
            // Create a single Task block with the full content
            const blockIds = importBlocks([{
                type: 'Task',
                label: 'Full Prompt',
                content: pendingFullPrompt.content,
                isFavorite: false,
            }]);

            // Save as a prompt using metadata from the modal
            addPrompt({
                title: draftMetadata?.title || (pendingFullPrompt.source.filename ? pendingFullPrompt.source.filename.replace(/\.(txt|md|pdf)$/i, '') : 'Imported Prompt'),
                description: draftMetadata?.description || '',
                blocks: blockIds,
                tags: {
                    style: draftMetadata?.tags?.style || [],
                    topic: draftMetadata?.tags?.topic || [],
                    technique: draftMetadata?.tags?.technique || [],
                },
                importedFrom: pendingFullPrompt.source.filename || 'pasted text',
                importedAt: new Date().toISOString(),
            });

            // Clear session and go to library
            clearSession();
            setIsModalOpen(false);
            setPendingFullPrompt(null);
            setIsSaving(false);
            setActiveView('library');
        } catch (error) {
            console.error('Failed to save prompt:', error);
            setIsSaving(false);
            alert('Failed to save prompt. Please try again.');
        }
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

            {currentStage === 'input' && <ImportInput onNext={handleInputNext} onSaveFullPrompt={handleSaveFullPrompt} />}

            {currentStage === 'dissection' && (
                <>
                    <DissectionCanvas />
                    <div className="import-actions" style={{ paddingTop: '0.5rem' }}>
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
                    <ImportSummary />
                    <div className="import-actions" style={{ paddingTop: 0 }}>
                        <button
                            className="import-button import-button-secondary"
                            onClick={handleReviewBack}
                        >
                            Back to Editing
                        </button>
                    </div>
                </>
            )}

            {/* Save Metadata Modal for Full Prompt */}
            <SaveMetadataModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setPendingFullPrompt(null);
                }}
                onSave={handleModalSave}
                isSaving={isSaving}
                initialData={pendingFullPrompt ? {
                    title: pendingFullPrompt.source.filename
                        ? pendingFullPrompt.source.filename.replace(/\.(txt|md|pdf)$/i, '')
                        : 'New Prompt',
                    description: '',
                    tags: { topic: [], technique: [], style: [] },
                } : undefined}
                mode="create"
            />
        </div>
    );
};
