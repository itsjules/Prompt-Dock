import { create } from 'zustand';
import { Prompt } from '../schemas/prompt.schema';

interface BuilderStore {
    // State
    activePromptId: string | null;
    currentBlockIds: string[];
    isDirty: boolean;

    // Actions
    setForNew: () => void;
    loadPrompt: (prompt: Prompt) => void;

    addBlockId: (id: string, index?: number) => void;
    removeBlockId: (id: string) => void;
    reorderBlocks: (ids: string[]) => void;
    moveBlock: (id: string, direction: 'up' | 'down') => void;
    clear: () => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
    activePromptId: null,
    currentBlockIds: [],
    isDirty: false,

    setForNew: () => {
        set({
            activePromptId: null,
            currentBlockIds: [],
            isDirty: false
        });
    },

    loadPrompt: (prompt: Prompt) => {
        // When we load a prompt, we need to ensure all its blocks are available.
        // In a real app with backend, we might fetch them here.
        // Since we're local-first and store everything in memory/localstorage, 
        // the blocks should already be in the BlockStore if the prompt exists.

        // HOWEVER, for the Builder to work, we need to clone the blocks? 
        // OR do we edit them in place? 
        // DESIGN DECISION: For now, we edit in place. If the user wants a copy, 
        // they should "Duplicate" the prompt (future feature).

        set({
            activePromptId: prompt.id,
            currentBlockIds: [...prompt.blocks], // Copy array
            isDirty: false
        });
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
            isDirty: true
        });
    }
}));
