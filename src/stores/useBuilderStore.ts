import { create } from 'zustand';
import { Prompt } from '../schemas/prompt.schema';

interface BuilderStore {
    // State
    activePromptId: string | null;
    currentBlockIds: string[];
    draftMetadata: {
        title: string;
        description: string;
        tags: Record<string, string[]>;
    };
    isDirty: boolean;

    // Actions
    setForNew: () => void;
    loadPrompt: (prompt: Prompt) => void;
    setDraftMetadata: (metadata: Partial<{ title: string; description: string; tags: Record<string, string[]> }>) => void;

    addBlockId: (id: string, index?: number) => void;
    removeBlockId: (id: string) => void;
    reorderBlocks: (ids: string[]) => void;
    moveBlock: (id: string, direction: 'up' | 'down') => void;
    clear: () => void;
}

const DEFAULT_METADATA = {
    title: 'New Prompt',
    description: '',
    tags: { style: [], topic: [], technique: [] }
};

export const useBuilderStore = create<BuilderStore>((set, get) => ({
    activePromptId: null,
    currentBlockIds: [],
    draftMetadata: DEFAULT_METADATA,
    isDirty: false,

    setForNew: () => {
        set({
            activePromptId: null,
            currentBlockIds: [],
            draftMetadata: DEFAULT_METADATA,
            isDirty: false
        });
    },

    loadPrompt: (prompt: Prompt) => {
        set({
            activePromptId: prompt.id,
            currentBlockIds: [...prompt.blocks], // Copy array
            draftMetadata: {
                title: prompt.title,
                description: prompt.description || '',
                tags: prompt.tags || { style: [], topic: [], technique: [] }
            },
            isDirty: false
        });
    },

    setDraftMetadata: (metadata) => {
        set((state) => ({
            draftMetadata: { ...state.draftMetadata, ...metadata },
            isDirty: true
        }));
    },

    addBlockId: (id, index) => {
        const { currentBlockIds } = get();
        const newIds = [...currentBlockIds];

        if (index !== undefined && index >= 0 && index <= newIds.length) {
            newIds.splice(index, 0, id);
        } else {
            newIds.push(id);
        }

        set({
            currentBlockIds: newIds,
            isDirty: true
        });
    },

    removeBlockId: (id) => {
        set((state) => ({
            currentBlockIds: state.currentBlockIds.filter(bId => bId !== id),
            isDirty: true
        }));
    },

    reorderBlocks: (ids) => {
        set({
            currentBlockIds: ids,
            isDirty: true
        });
    },

    moveBlock: (id, direction) => {
        const { currentBlockIds } = get();
        const index = currentBlockIds.indexOf(id);
        if (index === -1) return;

        const newIds = [...currentBlockIds];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex >= 0 && newIndex < newIds.length) {
            [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
            set({
                currentBlockIds: newIds,
                isDirty: true
            });
        }
    },

    clear: () => {
        // Note: This just clears the IDs from the builder view. 
        // It does NOT delete the blocks from the BlockStore 
        // (unless we decide "clearing" implies deletion for unsaved blocks).
        // For safety, we just detach them.
        set({
            currentBlockIds: [],
            // Reset metadata for new prompt on clear
            draftMetadata: DEFAULT_METADATA,
            isDirty: false // Reset dirty state as we are essentially starting fresh
        });
    }
}));
