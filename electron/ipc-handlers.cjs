const { ipcMain, app } = require('electron');
const fs = require('fs/promises');
const path = require('path');

const STORAGE_FILE = 'promptdock-data.json';

function getStoragePath() {
    return path.join(app.getPath('userData'), STORAGE_FILE);
}

function registerIPCHandlers() {
    ipcMain.handle('load-storage', async () => {
        try {
            const filePath = getStoragePath();
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            // Return null if file doesn't exist, let frontend handle default
            console.log('Storage file not found, will use defaults');
            return null;
        }
    });

    ipcMain.handle('save-storage', async (_, data) => {
        try {
            const filePath = getStoragePath();
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log('Storage saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving storage:', error);
            throw error;
        }
    });
}

module.exports = { registerIPCHandlers };
