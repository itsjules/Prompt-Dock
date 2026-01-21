import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Block, BlockType } from '../schemas/block.schema';

interface BlockStore {
    blocks: Record<string, Block>;
    addBlock: (block: Omit<Block, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateBlock: (id: string, updates: Partial<Omit<Block, 'id'>>) => void;
    deleteBlock: (id: string) => void;
    toggleFavorite: (id: string) => void;
    getBlock: (id: string) => Block | undefined;
    getAllBlocks: () => Block[];
    getBlocksByType: (type: BlockType) => Block[];
    getFavoriteBlocks: () => Block[];
    setBlocks: (blocks: Record<string, Block>) => void;
    // Custom Categories
    customCategories: { name: string; description: string; color: string }[];
    addCategory: (category: { name: string; description: string; color: string }) => void;
    updateCategory: (oldName: string, updates: { name?: string; description?: string; color?: string }) => void;
    removeCategory: (name: string) => void;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
    blocks: {},
    customCategories: [],

    addBlock: (block) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newBlock: Block = {
            ...block,
            id,
            createdAt: now,
            updatedAt: now,
        };
        set((state) => ({
            blocks: { ...state.blocks, [id]: newBlock },
        }));
        return id;
    },

    updateBlock: (id, updates) => {
        set((state) => {
            const block = state.blocks[id];
            if (!block) return state;

            return {
                blocks: {
                    ...state.blocks,
                    [id]: {
                        ...block,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    },
                },
            };
        });
    },

    deleteBlock: (id) => {
        set((state) => {
            const { [id]: _, ...rest } = state.blocks;
            return { blocks: rest };
        });
    },

    toggleFavorite: (id) => {
        set((state) => {
            const block = state.blocks[id];
            if (!block) return state;
            return {
                blocks: {
                    ...state.blocks,
                    [id]: { ...block, isFavorite: !block.isFavorite, updatedAt: new Date().toISOString() }
                }
            };
        });
    },

    getBlock: (id) => get().blocks[id],

    getAllBlocks: () => Object.values(get().blocks),

    getFavoriteBlocks: () => Object.values(get().blocks).filter(b => b.isFavorite),

    getBlocksByType: (type) =>
        Object.values(get().blocks).filter((block) => block.type === type),

    setBlocks: (blocks) => set({ blocks }),

    addCategory: (category) =>
        set((state) => ({
            customCategories: [...state.customCategories, category],
        })),

    updateCategory: (oldName, updates) =>
        set((state) => ({
            customCategories: state.customCategories.map((c) =>
                c.name === oldName ? { ...c, ...updates } : c
            ),
        })),

    removeCategory: (name) =>
        set((state) => ({
            customCategories: state.customCategories.filter((c) => c.name !== name),
        })),
}));
