const { app, BrowserWindow, globalShortcut, ipcMain, clipboard } = require('electron');
const path = require('path');
const { registerIPCHandlers } = require('./ipc-handlers.cjs');

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        show: false, // Start hidden
        alwaysOnTop: true,
        frame: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Register global shortcut
    globalShortcut.register('CommandOrControl+Shift+P', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    // Handle ESC key to close window
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape' && mainWindow.isVisible()) {
            mainWindow.hide();
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    registerIPCHandlers();

    // Handle clipboard
    ipcMain.handle('copy-to-clipboard', (_, text) => {
        clipboard.writeText(text);
        return true;
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
