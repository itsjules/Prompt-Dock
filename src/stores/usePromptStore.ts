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

// MOCK DATA for verification
const DEFAULT_PROMPTS: Record<string, Prompt> = {
    'mock-1': {
        id: 'mock-1', title: 'React Component Refactor', description: 'Refactor a class component to functional with hooks',
        blocks: [], tags: { topic: ['coding', 'react'], technique: ['refactor'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-2': {
        id: 'mock-2', title: 'Daily Journal Entry', description: 'Template for daily reflection',
        blocks: [], tags: { topic: ['personal', 'journal'], technique: [], style: ['creative'] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-3': {
        id: 'mock-3', title: 'Bug Fixer Helper', description: 'Analyze error stack trace',
        blocks: [], tags: { topic: ['coding', 'bug'], technique: ['analysis'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-4': {
        id: 'mock-4', title: 'Creative Story Outline', description: 'Hero journey structure',
        blocks: [], tags: { topic: ['creative', 'writing'], technique: ['outline'], style: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0, isFavorite: false
    },
    'mock-5': {
        id: 'mock-5', title: 'Research Paper Summary', description: 'Summarize academic text',
        blocks: [], tags: { topic: ['research', 'academic'], technique: ['summary'], style: [] },
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
