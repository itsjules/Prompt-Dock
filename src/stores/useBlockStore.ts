import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Block, BlockType } from '../schemas/block.schema';

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

interface BlockStore {
    blocks: Record<string, Block>;
    addBlock: (block: Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
    updateBlock: (id: string, updates: Partial<Omit<Block, 'id'>>) => void;
    deleteBlock: (id: string) => void;
    toggleFavorite: (id: string) => void;
    incrementUsage: (id: string) => void;
    getBlock: (id: string) => Block | undefined;
    getAllBlocks: () => Block[];
    getBlocksByType: (type: BlockType) => Block[];
    getFavoriteBlocks: () => Block[];
    // Library filtering
    getLibraryBlocks: () => Block[]; // Blocks with labels (in library)
    getUnnamedBlocks: () => Block[]; // Blocks without labels (not in library)
    setBlocks: (blocks: Record<string, Block>) => void;
    // Import functionality
    importBlocks: (blocks: Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[]) => string[];
    checkDuplicates: (content: string) => Block | null;
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
            usageCount: 0,
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

    incrementUsage: (id) => {
        set((state) => {
            const block = state.blocks[id];
            if (!block) return state;
            return {
                blocks: {
                    ...state.blocks,
                    [id]: { ...block, usageCount: (block.usageCount || 0) + 1, updatedAt: new Date().toISOString() }
                }
            };
        });
    },

    getBlock: (id) => get().blocks[id],

    getAllBlocks: () => Object.values(get().blocks),

    getFavoriteBlocks: () => Object.values(get().blocks).filter(b => b.isFavorite),

    getBlocksByType: (type) =>
        Object.values(get().blocks).filter((block) => block.type === type),

    getLibraryBlocks: () =>
        Object.values(get().blocks).filter((block) => block.label && block.label.trim().length > 0),

    getUnnamedBlocks: () =>
        Object.values(get().blocks).filter((block) => !block.label || block.label.trim().length === 0),

    setBlocks: (blocks) => set({ blocks }),

    importBlocks: (blocks) => {
        const ids: string[] = [];
        const now = new Date().toISOString();
        const newBlocks: Record<string, Block> = {};

        blocks.forEach((block) => {
            const id = uuidv4();
            ids.push(id);
            newBlocks[id] = {
                ...block,
                id,
                createdAt: now,
                updatedAt: now,
                usageCount: 0,
            };
        });

        set((state) => ({
            blocks: { ...state.blocks, ...newBlocks },
        }));

        return ids;
    },

    checkDuplicates: (content) => {
        const normalizedContent = content.trim().toLowerCase();
        const allBlocks = Object.values(get().blocks);

        // Find exact match first
        const exactMatch = allBlocks.find(
            (block) => block.content.trim().toLowerCase() === normalizedContent
        );

        if (exactMatch) return exactMatch;

        // Find similar match (90% similarity threshold)
        const similarMatch = allBlocks.find((block) => {
            const blockContent = block.content.trim().toLowerCase();
            const similarity = calculateSimilarity(normalizedContent, blockContent);
            return similarity > 0.9;
        });

        return similarMatch || null;
    },

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
