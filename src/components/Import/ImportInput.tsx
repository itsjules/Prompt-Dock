import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { readFile, formatFileSize, SUPPORTED_EXTENSIONS } from '../../utils/fileParser';
import './Import.css';

interface ImportInputProps {
    onNext: (content: string, source: { type: 'text' | 'file'; filename?: string }) => void;
    onSaveFullPrompt: (content: string, source: { type: 'text' | 'file'; filename?: string }) => void;
}

export const ImportInput: React.FC<ImportInputProps> = ({ onNext, onSaveFullPrompt }) => {
    const [textInput, setTextInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when component mounts
    useEffect(() => {
        setTextInput('');
        setSelectedFile(null);
        setError(null);
        setIsDragging(false);
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        setError(null);
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setTextInput('');
        setError(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleNext = async () => {
        setError(null);

        try {
            if (selectedFile) {
                const content = await readFile(selectedFile);
                onNext(content, {
                    type: 'file',
                    filename: selectedFile.name,
                });
            } else if (textInput.trim()) {
                onNext(textInput, {
                    type: 'text',
                });
            } else {
                setError('Please enter text or select a file to import.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to read file');
        }
    };

    const handleSaveFullPrompt = async () => {
        setError(null);

        try {
            if (selectedFile) {
                const content = await readFile(selectedFile);
                onSaveFullPrompt(content, {
                    type: 'file',
                    filename: selectedFile.name,
                });
            } else if (textInput.trim()) {
                onSaveFullPrompt(textInput, {
                    type: 'text',
                });
            } else {
                setError('Please enter text or select a file to import.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to read file');
        }
    };

    const hasInput = textInput.trim().length > 0 || selectedFile !== null;

    return (
        <div className="import-input">
            {/* Text Input Section */}
            <div className="import-input-section paste-section">
                <h2>Paste Your Prompt</h2>
                <p>Copy and paste a prompt you'd like to dissect into reusable blocks.</p>
                <textarea
                    className="import-textarea"
                    placeholder="Paste your prompt here...

Example:
# Role
You are an expert Python developer...

# Task
Create a function that..."
                    value={textInput}
                    onChange={handleTextChange}
                    disabled={selectedFile !== null}
                />
                {textInput && (
                    <div className="import-char-count">
                        {textInput.length} characters
                    </div>
                )}
            </div>

            {/* OR Divider */}
            <div className="import-or-divider">
                OR
            </div>

            {/* File Upload Section */}
            <div className="import-input-section file-section">
                <h2>Upload a File</h2>
                <p>Import a prompt from a text or markdown file.</p>

                {!selectedFile ? (
                    <div
                        className={`import-file-zone ${isDragging ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="import-file-zone-icon" />
                        <h3>Drag and drop a file here</h3>
                        <p>or click to browse</p>
                        <div className="import-file-zone-formats">
                            Supported: {SUPPORTED_EXTENSIONS.join(', ')}
                        </div>
                    </div>
                ) : (
                    <div className="import-file-preview">
                        <FileText className="import-file-preview-icon" />
                        <div className="import-file-preview-info">
                            <p className="import-file-preview-name">{selectedFile.name}</p>
                            <p className="import-file-preview-size">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            className="import-file-preview-remove"
                            onClick={handleRemoveFile}
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={SUPPORTED_EXTENSIONS.join(',')}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    gridColumn: '1 / -1',
                    padding: '1rem',
                    backgroundColor: 'rgba(238, 129, 100, 0.1)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--accent-primary)',
                }}>
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="import-actions">
                <button
                    className="import-button import-button-secondary"
                    onClick={handleSaveFullPrompt}
                    disabled={!hasInput}
                    title="Save the entire prompt as one block without dissecting"
                >
                    Save as Full Prompt
                </button>
                <button
                    className="import-button import-button-primary"
                    onClick={handleNext}
                    disabled={!hasInput}
                >
                    Next: Dissect Prompt
                </button>
            </div>
        </div>
    );
};
