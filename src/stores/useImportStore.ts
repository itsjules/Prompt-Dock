import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
    ImportSource,
    ImportSession,
    DissectedBlock,
} from '../schemas/import.schema';
import { createDissectedBlock } from '../schemas/import.schema';
import { dissectPrompt as runDissection } from '../utils/promptDissector';

interface ImportStore {
    currentSession: ImportSession | null;
    history: DissectedBlock[][];
    historyIndex: number;

    // Session management
    startImport: (source: ImportSource, metadata?: { title?: string; description?: string; tags?: string[] }) => void;
    clearSession: () => void;

    // Dissection
    dissectPrompt: () => void;
    setBlocks: (blocks: DissectedBlock[]) => void;

    // Block manipulation
    updateBlock: (id: string, changes: Partial<DissectedBlock>) => void;
    splitBlock: (id: string, position: number) => void;
    mergeBlocks: (ids: string[]) => void;
    deleteBlock: (id: string) => void;
    addBlock: (content: string, suggestedType: string) => string; // Return new block ID
    changeBlockType: (id: string, newType: string) => void;

    // Undo/Redo
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Metadata
    updateMetadata: (metadata: {
        promptTitle?: string;
        promptDescription?: string;
        tags?: string[];
    }) => void;

    // Stage management
    setStage: (stage: 'input' | 'dissection' | 'review' | 'complete') => void;
}

export const useImportStore = create<ImportStore>((set, get) => ({
    currentSession: null,
    history: [],
    historyIndex: -1,

    // Helper to save state to history
    saveToHistory: () => {
        const session = get().currentSession;
        if (!session) return;

        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([...session.blocks]);

        set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    startImport: (source, metadata) => {
        const session: ImportSession = {
            id: uuidv4(),
            source,
            blocks: [],
            originalText: source.content,
            metadata: {
                promptTitle: metadata?.title || (source.filename
                    ? source.filename.replace(/\.(txt|md|pdf)$/i, '')
                    : undefined),
                promptDescription: metadata?.description,
                tags: metadata?.tags || [],
            },
            stage: 'input',
            createdAt: new Date().toISOString(),
        };
        set({ currentSession: session });
    },

    clearSession: () => {
        set({ currentSession: null });
    },

    dissectPrompt: () => {
        const session = get().currentSession;
        if (!session) return;

        // Run the dissection algorithm
        const blocks = runDissection(session.originalText);

        set({
            currentSession: {
                ...session,
                blocks,
                stage: 'dissection',
            },
            history: [blocks],
            historyIndex: 0,
        });
    },

    setBlocks: (blocks) => {
        const session = get().currentSession;
        if (!session) return;

        set({
            currentSession: {
                ...session,
                blocks,
            },
        });
    },

    undo: () => {
        const { history, historyIndex, currentSession } = get();
        if (historyIndex <= 0 || !currentSession) return;

        const newIndex = historyIndex - 1;
        const blocks = history[newIndex];

        set({
            currentSession: {
                ...currentSession,
                blocks: [...blocks],
            },
            historyIndex: newIndex,
        });
    },

    redo: () => {
        const { history, historyIndex, currentSession } = get();
        if (historyIndex >= history.length - 1 || !currentSession) return;

        const newIndex = historyIndex + 1;
        const blocks = history[newIndex];

        set({
            currentSession: {
                ...currentSession,
                blocks: [...blocks],
            },
            historyIndex: newIndex,
        });
    },

    canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
    },

    canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
    },

    updateBlock: (id, changes) => {
        const session = get().currentSession;
        if (!session) return;

        const updatedBlocks = session.blocks.map((block) => {
            if (block.id !== id) return block;

            // If type is being changed, mark as manual
            const isManual = changes.suggestedType
                ? true
                : block.isManual;

            return {
                ...block,
                ...changes,
                isManual,
            };
        });

        set({
            currentSession: {
                ...session,
                blocks: updatedBlocks,
            },
        });

        // Save to history
        (get() as any).saveToHistory();
    },

    splitBlock: (id, position) => {
        const session = get().currentSession;
        if (!session) return;

        const blockIndex = session.blocks.findIndex((b) => b.id === id);
        if (blockIndex === -1) return;

        const originalBlock = session.blocks[blockIndex];
        const content = originalBlock.content;

        // Validate position
        if (position <= 0 || position >= content.length) return;

        // Create two new blocks
        const firstBlock = createDissectedBlock(
            content.substring(0, position).trim(),
            originalBlock.suggestedType,
            originalBlock.confidence,
            {
                label: originalBlock.label,
                isManual: true, // User manually split this
            }
        );

        const secondBlock = createDissectedBlock(
            content.substring(position).trim(),
            originalBlock.suggestedType,
            originalBlock.confidence,
            {
                isManual: true, // User manually split this
            }
        );

        // Replace original block with two new blocks
        const updatedBlocks = [
            ...session.blocks.slice(0, blockIndex),
            firstBlock,
            secondBlock,
            ...session.blocks.slice(blockIndex + 1),
        ];

        set({
            currentSession: {
                ...session,
                blocks: updatedBlocks,
            },
        });

        // Save to history
        (get() as any).saveToHistory();
    },

    mergeBlocks: (ids) => {
        const session = get().currentSession;
        if (!session || ids.length < 2) return;

        // Find all blocks to merge
        const blocksToMerge = session.blocks.filter((b) => ids.includes(b.id));
        if (blocksToMerge.length !== ids.length) return;

        // Sort blocks by their position in the array
        const sortedBlocks = blocksToMerge.sort((a, b) => {
            const indexA = session.blocks.findIndex((block) => block.id === a.id);
            const indexB = session.blocks.findIndex((block) => block.id === b.id);
            return indexA - indexB;
        });

        // Merge content
        const mergedContent = sortedBlocks.map((b) => b.content).join('\n\n');

        // Use the type of the first block
        const mergedBlock = createDissectedBlock(
            mergedContent,
            sortedBlocks[0].suggestedType,
            sortedBlocks[0].confidence,
            {
                label: sortedBlocks[0].label,
                isManual: true, // User manually merged this
            }
        );

        // Remove merged blocks and add new merged block at the position of the first block
        const firstBlockIndex = session.blocks.findIndex(
            (b) => b.id === sortedBlocks[0].id
        );

        const updatedBlocks = session.blocks.filter((b) => !ids.includes(b.id));
        updatedBlocks.splice(firstBlockIndex, 0, mergedBlock);

        set({
            currentSession: {
                ...session,
                blocks: updatedBlocks,
            },
        });

        // Save to history
        (get() as any).saveToHistory();
    },

    deleteBlock: (id) => {
        const session = get().currentSession;
        if (!session) return;

        set({
            currentSession: {
                ...session,
                blocks: session.blocks.filter((b) => b.id !== id),
            },
        });

        // Save to history
        (get() as any).saveToHistory();
    },

    addBlock: (content, suggestedType) => {
        const session = get().currentSession;
        if (!session) return '';

        const newBlock = createDissectedBlock(content, suggestedType, 100, {
            isManual: true,
        });

        set({
            currentSession: {
                ...session,
                blocks: [...session.blocks, newBlock],
            },
        });

        // Save to history
        (get() as any).saveToHistory();

        return newBlock.id;
    },

    changeBlockType: (id, newType) => {
        get().updateBlock(id, {
            suggestedType: newType,
            isManual: true,
            confidence: 100, // Manual changes are 100% confident
        });
    },

    updateMetadata: (metadata) => {
        const session = get().currentSession;
        if (!session) return;

        set({
            currentSession: {
                ...session,
                metadata: {
                    tags: session.metadata?.tags ?? [],
                    ...session.metadata,
                    ...metadata,
                },
            },
        });
    },

    setStage: (stage) => {
        const session = get().currentSession;
        if (!session) return;

        set({
            currentSession: {
                ...session,
                stage,
            },
        });
    },
}));
