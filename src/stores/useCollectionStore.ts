import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Collection } from '../schemas/collection.schema';

interface CollectionStore {
    collections: Record<string, Collection>;
    addCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt' | 'promptIds'>) => string;
    updateCollection: (id: string, updates: Partial<Omit<Collection, 'id'>>) => void;
    deleteCollection: (id: string) => void;
    getCollection: (id: string) => Collection | undefined;
    getAllCollections: () => Collection[];
    addPromptToCollection: (collectionId: string, promptId: string) => void;
    removePromptFromCollection: (collectionId: string, promptId: string) => void;
    addBlockToCollection: (collectionId: string, blockId: string) => void;
    removeBlockFromCollection: (collectionId: string, blockId: string) => void;
    setCollections: (collections: Record<string, Collection>) => void;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
    collections: {},

    addCollection: (collection) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newCollection: Collection = {
            ...collection,
            id,
            createdAt: now,
            updatedAt: now,
            promptIds: [],
        };
        set((state) => ({
            collections: { ...state.collections, [id]: newCollection },
        }));
        return id;
    },

    updateCollection: (id, updates) => {
        set((state) => {
            const collection = state.collections[id];
            if (!collection) return state;

            return {
                collections: {
                    ...state.collections,
                    [id]: {
                        ...collection,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    },
                },
            };
        });
    },

    deleteCollection: (id) => {
        set((state) => {
            const { [id]: _, ...rest } = state.collections;
            return { collections: rest };
        });
    },

    getCollection: (id) => get().collections[id],

    getAllCollections: () => Object.values(get().collections),

    addPromptToCollection: (collectionId, promptId) => {
        const collection = get().collections[collectionId];
        if (collection && !collection.promptIds.includes(promptId)) {
            get().updateCollection(collectionId, {
                promptIds: [...collection.promptIds, promptId],
            });
        }
    },

    removePromptFromCollection: (collectionId, promptId) => {
        const collection = get().collections[collectionId];
        if (collection) {
            get().updateCollection(collectionId, {
                promptIds: collection.promptIds.filter((id) => id !== promptId),
            });
        }
    },

    addBlockToCollection: (collectionId, blockId) => {
        const collection = get().collections[collectionId];
        // Ensure blockIds exists (migration safety)
        const currentBlockIds = collection?.blockIds || [];
        if (collection && !currentBlockIds.includes(blockId)) {
            get().updateCollection(collectionId, {
                blockIds: [...currentBlockIds, blockId],
            });
        }
    },

    removeBlockFromCollection: (collectionId, blockId) => {
        const collection = get().collections[collectionId];
        const currentBlockIds = collection?.blockIds || [];
        if (collection) {
            get().updateCollection(collectionId, {
                blockIds: currentBlockIds.filter((id) => id !== blockId),
            });
        }
    },

    setCollections: (collections) => set({ collections }),
}));
