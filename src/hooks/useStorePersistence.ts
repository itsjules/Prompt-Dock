import { useEffect } from 'react';
import { useBlockStore } from '../stores/useBlockStore';
import { usePromptStore } from '../stores/usePromptStore';
import { useCollectionStore } from '../stores/useCollectionStore';
import { useRoleStore, DEFAULT_ROLES } from '../stores/useRoleStore';
import { loadStorage, saveStorage } from '../utils/storage';

/**
 * Hook to persist all stores to local storage
 * Loads data on mount and saves on changes
 */
export function useStorePersistence() {
    const blocks = useBlockStore((state) => state.blocks);
    const prompts = usePromptStore((state) => state.prompts);
    const collections = useCollectionStore((state) => state.collections);
    const roles = useRoleStore((state) => state.roles);
    const activeRoleId = useRoleStore((state) => state.activeRoleId);

    const setBlocks = useBlockStore((state) => state.setBlocks);
    const setPrompts = usePromptStore((state) => state.setPrompts);
    const setCollections = useCollectionStore((state) => state.setCollections);
    const setRoles = useRoleStore((state) => state.setRoles);
    const setActiveRoleId = useRoleStore((state) => state.setActiveRoleId);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await loadStorage();
                if (data.blocks) setBlocks(data.blocks);
                if (data.prompts) setPrompts(data.prompts);
                if (data.collections) setCollections(data.collections);

                if (data.roles) {
                    // Sync system roles with latest defaults to ensure new keywords are applied
                    const syncedRoles = { ...data.roles };
                    DEFAULT_ROLES.forEach(defaultRole => {
                        if (syncedRoles[defaultRole.id]) {
                            syncedRoles[defaultRole.id] = {
                                ...syncedRoles[defaultRole.id],
                                keywords: defaultRole.keywords, // Force update keywords
                                description: defaultRole.description // Force update description
                            };
                        }
                    });
                    setRoles(syncedRoles);
                }

                if (data.activeRoleId !== undefined) setActiveRoleId(data.activeRoleId);

                console.log('Storage loaded successfully');
            } catch (error) {
                console.error('Failed to load storage:', error);
            }
        };

        loadData();
    }, [setBlocks, setPrompts, setCollections, setRoles, setActiveRoleId]);

    // Save data when stores change
    useEffect(() => {
        const saveData = async () => {
            try {
                await saveStorage({
                    version: '1.0.0',
                    blocks,
                    prompts,
                    collections,
                    roles,
                    activeRoleId,
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
    }, [blocks, prompts, collections, roles, activeRoleId]);
}
