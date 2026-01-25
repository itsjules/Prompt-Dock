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
        // If the prompt has inline blocks (unnamed blocks stored with the prompt),
        // we need to rehydrate them into the block store temporarily so they can be rendered.
        // We'll give them temporary IDs.
        import('../stores/useBlockStore').then(({ useBlockStore }) => {
            const { addBlock } = useBlockStore.getState();

            // 1. Process regular library blocks (already IDs)
            // We just verify they exist, or filter them out if deleted? 
            // For now, keep them. detailed logic might be needed if blocks are deleted.

            // 2. Process inline blocks (unnamed)
            // We need to insert them at the correct positions relative to other blocks?
            // The prompt.blocks array in schema currently only holds IDs of named blocks (string[]).
            // But wait, if we have a mixed list, how do we know the order?
            // The schema says `blocks: string[]` and `inlineBlocks: InlineBlockSchema[]`.
            // This structure essentially explicitly separates them, LOSING ORDER if they were interleaved.
            // However, the ImportSummary saves `blocks: blockIds` (only named) and `inlineBlocks: unnamedBlocks`.
            // This implies the current save logic DESTROYS the order of mixed prompts if they are interleaved.
            // 
            // BUT: If the user just imported a prompt, typically it's either fully dissected (all blocks) 
            // or monolithic. 
            // If the user *builds* a prompt with unnamed blocks in the Builder, we haven't supported that well yet.
            // 
            // PROPOSED FIX for the specific issue: "unnamed category in builder view... dont get copied... when saving"
            // The user says "in builder canvas it only displays the blocks that are saved with names... but not the rest".
            // This confirms `prompt.blocks` only has the named ones.
            // And `prompt.inlineBlocks` likely has the rest, but `loadPrompt` ignores them.

            // We need to:
            // 1. Add these inline blocks to the block store as temporary blocks
            // 2. Combine the IDs. 
            // PROBLEM: We don't know the original order because they are stored in two separate arrays in the schema.
            // Schema limitation: `blocks` is string[], `inlineBlocks` is array of objects.
            // WE CANNOT RECOVER ORDER with the current schema if they were mixed.
            // 
            // However, usually import results in a sequence. 
            // If the user saves from ImportSummary, we might need a way to preserve order.
            // For now, let's just append the inline blocks so they at least appear.

            // (Previous rehydration logic removed as it's now handled in the main loop above)

            // Process the mixed blocks array to preserve order
            // prompt.blocks can now contain both strings (IDs) and InlineBlock objects
            const allIds: string[] = [];

            prompt.blocks.forEach(item => {
                if (typeof item === 'string') {
                    // It's a library block ID
                    allIds.push(item);
                } else {
                    // It's an inline block object, rehydrate it
                    // Check if an identical unnamed block already exists to avoid duplication
                    const existingBlock = useBlockStore.getState().checkDuplicates(item.content);

                    if (existingBlock && (!existingBlock.label || existingBlock.label.trim() === '')) {
                        // Use existing unnamed block
                        allIds.push(existingBlock.id);
                    } else {
                        // Create new one only if no match found
                        const id = addBlock({
                            type: item.type,
                            label: '', // Unnamed
                            content: item.content,
                            isFavorite: false
                        });
                        allIds.push(id);
                    }
                }
            });

            // Process legacy inlineBlocks (for backward compatibility)
            // Append them to the end if they exist
            if (prompt.inlineBlocks && prompt.inlineBlocks.length > 0) {
                prompt.inlineBlocks.forEach(ib => {
                    const existingBlock = useBlockStore.getState().checkDuplicates(ib.content);

                    if (existingBlock && (!existingBlock.label || existingBlock.label.trim() === '')) {
                        allIds.push(existingBlock.id);
                    } else {
                        const id = addBlock({
                            type: ib.type,
                            label: '',
                            content: ib.content,
                            isFavorite: false
                        });
                        allIds.push(id);
                    }
                });
            }

            set({
                activePromptId: prompt.id,
                currentBlockIds: allIds,
                draftMetadata: {
                    title: prompt.title,
                    description: prompt.description || '',
                    tags: prompt.tags || { style: [], topic: [], technique: [] }
                },
                isDirty: false,
                fullPromptContent: null,
            });
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
            activePromptId: null, // FULL RESET: No active prompt context anymore
            currentBlockIds: [],
            // Reset metadata for new prompt on clear
            draftMetadata: DEFAULT_METADATA,
            localBlockEdits: {}, // Clear local edits too
            isDirty: false, // Reset dirty state as we are essentially starting fresh
            fullPromptContent: null, // Clear full prompt content
        });
    }
}));
