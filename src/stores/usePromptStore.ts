import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { useBlockStore } from './useBlockStore';
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
        // 1. Identify blocks used by this prompt that might need cleanup
        const state = get();
        const promptToDelete = state.prompts[id];

        if (promptToDelete) {
            // Get block store synchronously
            const blockStore = useBlockStore.getState();
            const allPrompts = Object.values(state.prompts).filter(p => p.id !== id); // Exclude current

            // 1. Calculate usage from OTHER prompts to protect shared blocks
            const usedBlockIds = new Set<string>();
            allPrompts.forEach(p => {
                p.blocks.forEach(item => {
                    if (typeof item === 'string') {
                        usedBlockIds.add(item);
                    }
                });
            });

            // 2. Collect content tokens from the deleted prompt (for inline blocks)
            const contentToClean = new Set<string>();
            promptToDelete.blocks.forEach(item => {
                if (typeof item === 'string') {
                    // Check if this ID is unnamed and unused elsewhere
                    const block = blockStore.blocks[item];
                    if (block && (!block.label || block.label.trim() === '') && !usedBlockIds.has(item)) {
                        blockStore.deleteBlock(item);
                    }
                } else {
                    // It's an inline object, capture its content
                    // We will search for ANY unnamed blocks with this content
                    contentToClean.add(item.content.trim());
                }
            });

            // Handle legacy inline blocks
            if (promptToDelete.inlineBlocks) {
                promptToDelete.inlineBlocks.forEach(item => {
                    contentToClean.add(item.content.trim());
                });
            }

            // 3. Scan the ENTIRE block store for unnamed aliases/duplicates of the deleted inline content
            if (contentToClean.size > 0) {
                Object.values(blockStore.blocks).forEach(block => {
                    // Criteria for deletion:
                    // 1. It is unnamed
                    // 2. It is NOT explicitly used by another prompt (ID reference)
                    // 3. Its content matches one of the inline blocks we are deleting

                    const isUnnamed = !block.label || block.label.trim() === '';

                    if (isUnnamed && !usedBlockIds.has(block.id)) {
                        const blockContent = block.content.trim();
                        // Check exact content match via Set lookup (fast)
                        // Or check similarity? For now, exact match of trimmed content is safest to avoid accidental deletions.
                        // The reproduction showed exact match duplicates.
                        if (contentToClean.has(blockContent)) {
                            blockStore.deleteBlock(block.id);
                        }
                    }
                });
            }
        }

        // Finally delete the prompt itself
        set((state) => {
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
    },
}));
