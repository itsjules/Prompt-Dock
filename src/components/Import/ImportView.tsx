import React, { useEffect } from 'react';
import { useImportStore } from '../../stores/useImportStore';
import { ImportInput } from './ImportInput';
import { DissectionCanvas } from './DissectionCanvas';
import { ImportSummary } from './ImportSummary';
import type { ImportSource } from '../../schemas/import.schema';
import './Import.css';

export const ImportView: React.FC = () => {
    const { currentSession, startImport, dissectPrompt, setStage } = useImportStore();

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

            {currentStage === 'input' && <ImportInput onNext={handleInputNext} />}

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
                <ImportSummary onBack={handleReviewBack} />
            )}
        </div>
    );
};
