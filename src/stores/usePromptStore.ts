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
    getFavorites: () => Prompt[];
    getRecents: (limit?: number) => Prompt[];
    incrementUsage: (id: string) => void;
    toggleFavorite: (id: string) => void;
    setPrompts: (prompts: Record<string, Prompt>) => void;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
    prompts: {},

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
            const { [id]: _, ...rest } = state.prompts;
            return { prompts: rest };
        });
    },

    getPrompt: (id) => get().prompts[id],

    getAllPrompts: () => Object.values(get().prompts),

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
}));
