const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { registerIPCHandlers } = require('./ipc-handlers.cjs');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Start hidden
        alwaysOnTop: false,
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
        //----Auto-open Dev-Tools on start
        // mainWindow.webContents.openDevTools();
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

    // Intercept close event to hide instead of quit
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    // Handle ESC key to hide window
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape' && mainWindow.isVisible()) {
            mainWindow.hide();
        }
    });
}

function createTray() {
    const iconPath = path.join(__dirname, '../resources/tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    // Resize for tray if needed, though 32x32 is usually good for Windows
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show PromptDock',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('PromptDock');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

function setupAutoLaunch() {
    // Only enable auto-launch in production/packaged app to avoid dev clutter
    if (app.isPackaged) {
        app.setLoginItemSettings({
            openAtLogin: true,
            path: app.getPath('exe')
        });
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    setupAutoLaunch();
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
