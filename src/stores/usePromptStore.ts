import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Prompt } from '../schemas/prompt.schema';

interface PromptStore {
    prompts: Record<string, Prompt>;
    addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isFavorite'>) => string;
    updatePrompt: (id: string, updates: Partial<Omit<Prompt, 'id'>>) => void;
    deletePrompt: (id: string) => void;
    getPrompt: (id: string) => Prompt | undefined;
    getAllPrompts: () => Prompt[];
    getFullPrompts: () => Prompt[]; // Get prompts where isFullPrompt is true
    getFavorites: () => Prompt[];
    getRecents: (limit?: number) => Prompt[];
    incrementUsage: (id: string) => void;
    toggleFavorite: (id: string) => void;
    setPrompts: (prompts: Record<string, Prompt>) => void;
    cleanupOrphanedBlocks: () => void; // Purges all unused unnamed blocks
}

// MOCK DATA for verification
const DEFAULT_PROMPTS: Record<string, Prompt> = {
    'mock-1': {
        id: 'mock-1', title: 'React Component Refactor', description: 'Refactor a class component to functional with hooks',
        blocks: [], isFullPrompt: false, tags: { topic: ['coding', 'react'], technique: ['refactor'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-2': {
        id: 'mock-2', title: 'Daily Journal Entry', description: 'Template for daily reflection',
        blocks: [], isFullPrompt: false, tags: { topic: ['personal', 'journal'], technique: [], style: ['creative'] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-3': {
        id: 'mock-3', title: 'Bug Fixer Helper', description: 'Analyze error stack trace',
        blocks: [], isFullPrompt: false, tags: { topic: ['coding', 'bug'], technique: ['analysis'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-4': {
        id: 'mock-4', title: 'Creative Story Outline', description: 'Hero journey structure',
        blocks: [], isFullPrompt: false, tags: { topic: ['creative', 'writing'], technique: ['outline'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-5': {
        id: 'mock-5', title: 'Research Paper Summary', description: 'Summarize academic text',
        blocks: [], isFullPrompt: false, tags: { topic: ['research', 'academic'], technique: ['summary'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    }
};

export const usePromptStore = create<PromptStore>((set, get) => ({
    prompts: DEFAULT_PROMPTS,

    addPrompt: (prompt) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newPrompt: Prompt = {
            ...prompt,
            id,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            isFavorite: false,
            tags: prompt.tags || { style: [], topic: [], technique: [] },
        };
        set((state) => ({
            prompts: { ...state.prompts, [id]: newPrompt },
        }));
        return id;
    },

    updatePrompt: (id, updates) => {
        set((state) => {
            const prompt = state.prompts[id];
            if (!prompt) return state;

            return {
                prompts: {
                    ...state.prompts,
                    [id]: {
                        ...prompt,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    },
                },
            };
        });
    },

    deletePrompt: (id) => {
        set((state) => {
            const promptToDelete = state.prompts[id];
            if (!promptToDelete) return state;

            // 1. Identify blocks used by this prompt that might need cleanup
            // We are looking for blocks that are effectively "owned" by this prompt (unnamed blocks)
            // Since we store IDs for unnamed blocks now (reusing them), we need to check if they are used elsewhere.

            // Get useBlockStore to check block details
            import('../stores/useBlockStore').then(({ useBlockStore }) => {
                const blockStore = useBlockStore.getState();
                const allPrompts = Object.values(state.prompts).filter(p => p.id !== id); // Exclude current

                // Collect IDs of blocks in this prompt that are candidates for deletion (Unnamed blocks)
                const candidateBlockIds = new Set<string>();

                // Helper to check if a block ID is unnamed
                const checkBlock = (blockId: string) => {
                    const block = blockStore.blocks[blockId];
                    if (block && (!block.label || block.label.trim() === '')) {
                        candidateBlockIds.add(blockId);
                    }
                };

                // Scan mixed blocks array
                promptToDelete.blocks.forEach(item => {
                    if (typeof item === 'string') {
                        checkBlock(item);
                    }
                    // Inline objects (objects in mixed array) don't have IDs in store usually? 
                    // Wait, mixed array has {type, content} objects OR string IDs.
                    // Objects are NOT in store. String IDs ARE in store.
                    // So we only care about string IDs that point to unnamed blocks.
                });

                // Also check legacy inlineBlocks if any (though they usually don't have store IDs unless loaded?)
                // Actually legacy inlineBlocks are just data, not IDs. So nothing to delete safely.

                // 2. Check if these candidate blocks are used by ANY other prompt
                const usedBlockIds = new Set<string>();
                allPrompts.forEach(p => {
                    p.blocks.forEach(item => {
                        if (typeof item === 'string') {
                            usedBlockIds.add(item);
                        }
                    });
                });

                // 3. Delete blocks that are NOT used elsewhere
                candidateBlockIds.forEach(blockId => {
                    if (!usedBlockIds.has(blockId)) {
                        blockStore.deleteBlock(blockId);
                    }
                });
            });

            const { [id]: _, ...rest } = state.prompts;
            return { prompts: rest };
        });
    },

    getPrompt: (id) => get().prompts[id],

    getAllPrompts: () => Object.values(get().prompts),

    getFullPrompts: () =>
        Object.values(get().prompts), // Return ALL prompts, not just isFullPrompt ones

    getFavorites: () =>
        Object.values(get().prompts).filter((prompt) => prompt.isFavorite),

    getRecents: (limit = 10) =>
        Object.values(get().prompts)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, limit),

    incrementUsage: (id) => {
        const prompt = get().prompts[id];
        if (prompt) {
            get().updatePrompt(id, { usageCount: prompt.usageCount + 1 });
        }
    },

    toggleFavorite: (id) => {
        const prompt = get().prompts[id];
        if (prompt) {
            get().updatePrompt(id, { isFavorite: !prompt.isFavorite });
        }
    },

    setPrompts: (prompts) => set({ prompts }),

    cleanupOrphanedBlocks: () => {
        import('../stores/useBlockStore').then(({ useBlockStore }) => {
            const blockStore = useBlockStore.getState();
            const allPrompts = Object.values(get().prompts);

            // 1. Collect ALL block IDs referenced by any prompt
            const usedBlockIds = new Set<string>();
            allPrompts.forEach(p => {
                p.blocks.forEach(item => {
                    if (typeof item === 'string') {
                        usedBlockIds.add(item);
                    }
                });
            });

            // 2. Identify and delete unused UNNAMED blocks
            Object.values(blockStore.blocks).forEach(block => {
                // If block is unnamed AND not in the used list
                if ((!block.label || block.label.trim() === '') && !usedBlockIds.has(block.id)) {
                    blockStore.deleteBlock(block.id);
                }
            });
        });
    },
}));
