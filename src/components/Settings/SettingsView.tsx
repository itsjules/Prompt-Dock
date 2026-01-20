import { seedMockData } from '../../utils/mockData';
import { useUIStore } from '../../stores/useUIStore';
import { saveStorage } from '../../utils/storage';
import { type StorageData } from '../../schemas/storage.schema';
import { Database, Trash2 } from 'lucide-react';
import { useBlockStore } from '../../stores/useBlockStore';
import { usePromptStore } from '../../stores/usePromptStore';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { useRoleStore } from '../../stores/useRoleStore';

export const SettingsView = () => {
    const { setActiveView } = useUIStore();

    const handleSeedData = async () => {
        if (confirm('This will add example prompts and blocks to your library. Continue?')) {
            seedMockData();

            // Force immediate save to ensure persistence
            try {
                const blockStore = useBlockStore.getState();
                const promptStore = usePromptStore.getState();
                const collectionStore = useCollectionStore.getState(); // Fix: Import useCollectionStore
                const roleStore = useRoleStore.getState();            // Fix: Import useRoleStore

                const storageData: StorageData = {
                    version: '1.0.0',
                    blocks: blockStore.blocks,
                    prompts: promptStore.prompts,
                    collections: collectionStore.collections,
                    roles: roleStore.roles,
                    activeRoleId: roleStore.activeRoleId,
                    settings: {
                        globalHotkey: 'CommandOrControl+Shift+P',
                        theme: 'system',
                    }
                };

                await saveStorage(storageData);
                console.log('✅ Storage saved successfully after seeding');
                alert('Mock data added successfully!');
                setActiveView('library');
            } catch (error) {
                console.error('❌ STORAGE SAVE FAILED:', error);

                // Log detailed error information
                if (error instanceof Error) {
                    console.error('Error name:', error.name);
                    console.error('Error message:', error.message);
                    console.error('Error stack:', error.stack);
                }

                // If it's a Zod error, log validation details
                if (error && typeof error === 'object' && 'issues' in error) {
                    console.error('Zod validation issues:', JSON.stringify((error as any).issues, null, 2));
                }

                alert('Data added but failed to save to disk. Check console for details.');
            }
        }
    };

    const handleClearData = async () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            try {
                // Force empty storage save
                const emptyData: StorageData = {
                    version: '1.0.0',
                    blocks: {},
                    prompts: {},
                    collections: {},
                    settings: {
                        globalHotkey: 'CommandOrControl+Shift+P',
                        theme: 'system' as const,
                    }
                };

                // Explicitly save to disk via IPC through the storage utility
                await saveStorage(emptyData);

                // Reload to reset all in-memory stores and re-hydrate from the now-empty file
                window.location.reload();
            } catch (error) {
                console.error('Failed to reset data:', error);
                alert('Failed to reset data. Please check logs.');
            }
        }
    }



    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Settings</h1>

            <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Developer Tools</h3>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleSeedData}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 500
                        }}
                    >
                        <Database size={18} />
                        Generate Mock Data (TACO)
                    </button>

                    <button
                        onClick={handleClearData}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 500
                        }}
                    >
                        <Trash2 size={18} />
                        Reset Data
                    </button>
                </div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Use these tools to populate your library with example content for testing blocks and prompts.
                </p>
            </div>
        </div>
    );
};
