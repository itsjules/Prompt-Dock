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
    localBlockEdits: Record<string, { label?: string; content?: string }>;
    fullPromptContent: string | null; // Store full prompt content when loaded

    // Actions
    setForNew: () => void;
    loadPrompt: (prompt: Prompt) => void;
    loadFullPrompt: (prompt: Prompt) => void; // New method for full prompts
    setDraftMetadata: (metadata: Partial<{ title: string; description: string; tags: Record<string, string[]> }>) => void;

    addBlockId: (id: string, index?: number) => void;
    removeBlockId: (id: string) => void;
    reorderBlocks: (ids: string[]) => void;
    moveBlock: (id: string, direction: 'up' | 'down') => void;

    setLocalBlockEdit: (id: string, edit: { label?: string; content?: string }) => void;
    removeLocalBlockEdit: (id: string) => void;
    clearLocalBlockEdits: () => void;

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
    fullPromptContent: null,

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
            isDirty: false,
            fullPromptContent: null, // Clear full prompt content
        });
    },

    loadFullPrompt: (prompt: Prompt) => {
        // For full prompts, we'll create a special block to hold the content
        // This allows mixing full prompts with other blocks
        // Import dynamically to avoid circular dependency
        import('../stores/useBlockStore').then(({ useBlockStore }) => {
            const { addBlock } = useBlockStore.getState();

            // Create a special "FullPrompt" type block
            const blockId = addBlock({
                type: 'Full Prompt', // Use Full Prompt as the type
                label: prompt.title, // Just use the title without prefix
                content: prompt.fullPromptContent || '',
                isFavorite: false,
                isFullPrompt: true, // Special flag to identify full prompt blocks
            });

            set({
                activePromptId: prompt.id,
                currentBlockIds: [blockId], // Start with the full prompt block
                draftMetadata: {
                    title: prompt.title,
                    description: prompt.description || '',
                    tags: prompt.tags || { style: [], topic: [], technique: [] }
                },
                isDirty: false,
                fullPromptContent: null, // Not using this anymore
            });
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

    // --- Local Block Edits Persistence ---
    localBlockEdits: {},

    setLocalBlockEdit: (id, edit) => {
        set((state) => ({
            localBlockEdits: {
                ...state.localBlockEdits,
                [id]: { ...state.localBlockEdits[id], ...edit }
            },
            isDirty: true // Local edits make the builder dirty
        }));
    },

    removeLocalBlockEdit: (id) => {
        set((state) => {
            const newEdits = { ...state.localBlockEdits };
            delete newEdits[id];
            return { localBlockEdits: newEdits };
            // Note: We don't necessarily reset isDirty here because other changes might exist,
            // but removing an edit might return it to "clean" state. 
            // For simplicity, we assume if you are interacting, it's dirty or we rely on other signals.
        });
    },

    clearLocalBlockEdits: () => {
        set({ localBlockEdits: {} });
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
            localBlockEdits: {}, // Clear local edits too
            isDirty: false, // Reset dirty state as we are essentially starting fresh
            fullPromptContent: null, // Clear full prompt content
        });
    }
}));
