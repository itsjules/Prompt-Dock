import { useState } from 'react';
import { X } from 'lucide-react';
import { useCollectionStore } from '../../stores/useCollectionStore';
import './CreateCollectionModal.css';

interface CreateCollectionModalProps {
    onClose: () => void;
    onCreated?: (id: string) => void;
}

export const CreateCollectionModal = ({ onClose, onCreated }: CreateCollectionModalProps) => {
    const { addCollection } = useCollectionStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const id = addCollection({
            name: name.trim(),
            description: description.trim(),
            blockIds: []
        });

        if (onCreated) {
            onCreated(id);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content create-collection-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Create New Collection</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="create-collection-form">
                    <div className="form-group">
                        <label htmlFor="collection-name">Name</label>
                        <input
                            id="collection-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Creative Writing, Technical Prompts..."
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="collection-desc">Description (Optional)</label>
                        <textarea
                            id="collection-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What is this collection for?"
                            rows={3}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn" disabled={!name.trim()}>
                            Create Collection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
