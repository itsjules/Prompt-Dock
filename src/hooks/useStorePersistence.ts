import { useEffect } from 'react';
import { useBlockStore } from '../stores/useBlockStore';
import { usePromptStore } from '../stores/usePromptStore';
import { useCollectionStore } from '../stores/useCollectionStore';
import { loadStorage, saveStorage } from '../utils/storage';

/**
 * Hook to persist all stores to local storage
 * Loads data on mount and saves on changes
 */
export function useStorePersistence() {
    const blocks = useBlockStore((state) => state.blocks);
    const prompts = usePromptStore((state) => state.prompts);
    const collections = useCollectionStore((state) => state.collections);

    const setBlocks = useBlockStore((state) => state.setBlocks);
    const setPrompts = usePromptStore((state) => state.setPrompts);
    const setCollections = useCollectionStore((state) => state.setCollections);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await loadStorage();
                setBlocks(data.blocks);
                setPrompts(data.prompts);
                setCollections(data.collections);
                console.log('Storage loaded successfully');
            } catch (error) {
                console.error('Failed to load storage:', error);
            }
        };

        loadData();
    }, [setBlocks, setPrompts, setCollections]);

    // Save data when stores change
    useEffect(() => {
        const saveData = async () => {
            try {
                await saveStorage({
                    version: '1.0.0',
                    blocks,
                    prompts,
                    collections,
                    settings: {
                        globalHotkey: 'CommandOrControl+Shift+P',
                        theme: 'system',
                    },
                });
                console.log('Storage saved successfully');
            } catch (error) {
                console.error('Failed to save storage:', error);
            }
        };

        // Debounce saves to avoid excessive writes
        const timeoutId = setTimeout(saveData, 500);
        return () => clearTimeout(timeoutId);
    }, [blocks, prompts, collections]);
}
