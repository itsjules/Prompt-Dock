import { seedMockData } from '../../utils/mockData';
import { useUIStore } from '../../stores/useUIStore';
import { saveStorage } from '../../utils/storage';
import { type StorageData } from '../../schemas/storage.schema';
import { Database, Trash2, ShieldCheck } from 'lucide-react';
import { useBlockStore } from '../../stores/useBlockStore';
import { usePromptStore } from '../../stores/usePromptStore';

export const SettingsView = () => {
    const { setActiveView } = useUIStore();

    const handleSeedData = () => {
        if (confirm('This will add example prompts and blocks to your library. Continue?')) {
            seedMockData();
            alert('Mock data added successfully!');
            setActiveView('library');
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

    const handleRemoveDuplicates = () => {
        if (!confirm('This will find duplicate blocks (same label and type) and remove the duplicates. Prompts using these blocks will be updated to use the consolidated block. Continue?')) {
            return;
        }

        const blockStore = useBlockStore.getState();
        const promptStore = usePromptStore.getState();
        const allBlocks = Object.values(blockStore.blocks);

        // Group by Type + Label
        const groups: Record<string, typeof allBlocks> = {};

        allBlocks.forEach(b => {
            const key = `${b.type}:${b.label.trim()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(b);
        });

        let removedCount = 0;
        let updatedPromptsCount = 0;

        Object.values(groups).forEach(group => {
            if (group.length > 1) {
                // Sort by creation date (oldest first is the "original") - or just pick first
                // If we assume the ones added by seedMockData later are the dupes, we might want to keep the oldest.
                // But mockData adds new IDs.
                // Let's keep the FIRST one in the list.
                const [winner, ...losers] = group;

                const loserIds = losers.map(l => l.id);

                // 1. Update all prompts that use any of the loser IDs to use the winner ID
                const allPrompts = promptStore.getAllPrompts();
                allPrompts.forEach(p => {
                    let hasChanges = false;
                    const newBlockIds = p.blocks.map(bId => {
                        if (loserIds.includes(bId)) {
                            hasChanges = true;
                            return winner.id;
                        }
                        return bId;
                    });

                    if (hasChanges) {
                        promptStore.updatePrompt(p.id, { blocks: newBlockIds });
                        updatedPromptsCount++;
                    }
                });

                // 2. Delete the losers
                loserIds.forEach(id => {
                    blockStore.deleteBlock(id);
                    removedCount++;
                });
            }
        });

        alert(`Cleanup Complete.\nRemoved ${removedCount} duplicate blocks.\nUpdated ${updatedPromptsCount} prompts.`);
    };

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

                    <button
                        onClick={handleRemoveDuplicates}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 500
                        }}
                    >
                        <ShieldCheck size={18} />
                        Remove Duplicates
                    </button>
                </div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Use these tools to populate your library with example content for testing blocks and prompts.
                </p>
            </div>
        </div>
    );
};
