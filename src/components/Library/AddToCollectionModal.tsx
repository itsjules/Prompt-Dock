import { useState } from 'react';
import { X, Check, Plus, FolderPlus } from 'lucide-react';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { CreateCollectionModal } from './CreateCollectionModal';
import './AddToCollectionModal.css';

interface AddToCollectionModalProps {
    itemId: string;
    itemType: 'prompt' | 'block';
    itemTitle: string;
    onClose: () => void;
}

export const AddToCollectionModal = ({ itemId, itemType, itemTitle, onClose }: AddToCollectionModalProps) => {
    const { collections, addPromptToCollection, removePromptFromCollection, addBlockToCollection, removeBlockFromCollection } = useCollectionStore();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const allCollections = Object.values(collections);

    const isItemInCollection = (collectionId: string) => {
        const collection = collections[collectionId];
        if (!collection) return false;
        if (itemType === 'prompt') {
            return collection.promptIds.includes(itemId);
        } else {
            return collection.blockIds ? collection.blockIds.includes(itemId) : false;
        }
    };

    const handleToggleCollection = (collectionId: string) => {
        const inCollection = isItemInCollection(collectionId);

        if (inCollection) {
            if (itemType === 'prompt') {
                removePromptFromCollection(collectionId, itemId);
            } else {
                removeBlockFromCollection(collectionId, itemId);
            }
        } else {
            if (itemType === 'prompt') {
                addPromptToCollection(collectionId, itemId);
            } else {
                addBlockToCollection(collectionId, itemId);
            }
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Add to Collection</h3>
                        <button className="close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="modal-subheader">
                        Manage collections for <strong>"{itemTitle}"</strong>
                    </div>

                    <div className="collections-list">
                        {allCollections.length === 0 ? (
                            <p className="no-collections">No collections found.</p>
                        ) : (
                            allCollections.map(collection => {
                                const selected = isItemInCollection(collection.id);
                                return (
                                    <div
                                        key={collection.id}
                                        className={`collection-option ${selected ? 'selected' : ''}`}
                                        onClick={() => handleToggleCollection(collection.id)}
                                    >
                                        <div className="collection-info">
                                            <span className="collection-name">{collection.name}</span>
                                            <span className="collection-count">
                                                {collection.promptIds.length} prompts, {collection.blockIds?.length || 0} blocks
                                            </span>
                                        </div>
                                        <div className="selection-indicator">
                                            {selected ? <Check size={18} /> : <Plus size={18} />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <button className="create-new-inline" onClick={() => setShowCreateModal(true)}>
                            <FolderPlus size={16} />
                            Create New Collection
                        </button>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateCollectionModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(newId) => {
                        // Automatically add the current item to the newly created collection
                        if (itemType === 'prompt') {
                            addPromptToCollection(newId, itemId);
                        } else {
                            addBlockToCollection(newId, itemId);
                        }
                    }}
                />
            )}
        </>
    );
};
