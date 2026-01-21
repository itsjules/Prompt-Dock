
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBuilderStore } from '../../stores/useBuilderStore';
import './SaveMetadataModal.css';

interface SaveMetadataModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isSaving: boolean;
    initialData?: {
        title: string;
        description: string;
        tags: Record<string, string[]>;
    };
    mode: 'create' | 'edit';
    onDelete?: () => void;
}

export const SaveMetadataModal: React.FC<SaveMetadataModalProps> = ({
    isOpen,
    onClose,
    onSave,
    isSaving,
    initialData,
    mode,
    onDelete
}) => {
    const { setDraftMetadata } = useBuilderStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Simplified tags for this iteration - comma separated string for easier input
    // Tag State
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            // Flatten tags for display
            const allTags = [
                ...(initialData.tags.topic || []),
                ...(initialData.tags.technique || []),
                ...(initialData.tags.style || [])
            ];
            setTags(allTags);
            setTagInput('');
        } else if (isOpen) {
            // Reset for new
            setTitle('New Prompt');
            setDescription('');
            setTags([]);
            setTagInput('');
        }
    }, [isOpen, initialData]);

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

    const handleSave = () => {
        if (!title.trim()) {
            alert('Title is required');
            return;
        }

        const newTags = {
            topic: tags, // Use the proper array
            technique: [],
            style: []
        };

        setDraftMetadata({
            title,
            description,
            tags: newTags
        });

        onSave();
    };

    if (!isOpen) return null;

    return (
        <div className="metadata-modal-overlay">
            <div className="metadata-modal">
                <div className="modal-header">
                    <h3>{mode === 'create' ? 'Save Prompt' : 'Edit Prompt Details'}</h3>
                    <button onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Name <span className="required">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. React Code Refactor"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this prompt do?"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tags</label>
                        <div className="tags-input-container" onClick={() => document.getElementById('tag-input')?.focus()}>
                            {tags.map((tag, index) => (
                                <span key={index} className="tag-pill">
                                    {tag}
                                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="tag-input"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                                className="tag-input-field"
                            />
                        </div>
                        <span className="help-text">Press Enter to add a tag</span>
                    </div>
                </div>

                <div className="modal-footer">
                    {mode === 'edit' ? (
                        <button className="btn-danger" onClick={onDelete}>Delete Prompt</button>
                    ) : (
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    )}
                    <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : (mode === 'create' ? 'Save Prompt' : 'Update Details')}
                    </button>
                </div>
            </div>
        </div>
    );
};
