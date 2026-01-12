import { StorageSchema, type StorageData } from '../schemas/storage.schema';

// Electron IPC will be available via preload script
declare global {
    interface Window {
        electronAPI: {
            loadStorage: () => Promise<StorageData | null>;
            saveStorage: (data: StorageData) => Promise<boolean>;
            copyToClipboard: (text: string) => Promise<boolean>;
        };
    }
}

export async function loadStorage(): Promise<StorageData> {
    try {
        const data = await window.electronAPI.loadStorage();
        if (data === null) {
            // File doesn't exist, return defaults
            return getDefaultStorage();
        }
        return StorageSchema.parse(data);
    } catch (error) {
        console.error('Error loading storage:', error);
        // Initialize with default data if there's an error
        return getDefaultStorage();
    }
}

export async function saveStorage(data: StorageData): Promise<void> {
    try {
        const validated = StorageSchema.parse(data);
        await window.electronAPI.saveStorage(validated);
    } catch (error) {
        console.error('Error saving storage:', error);
        throw error;
    }
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await window.electronAPI.copyToClipboard(text);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        throw error;
    }
}

function getDefaultStorage(): StorageData {
    return {
        version: '1.0.0',
        blocks: {},
        prompts: {},
        collections: {},
        settings: {
            globalHotkey: 'CommandOrControl+Shift+P',
            theme: 'system',
        },
    };
}
