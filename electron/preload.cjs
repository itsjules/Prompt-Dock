const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadStorage: () => ipcRenderer.invoke('load-storage'),
    saveStorage: (data) => ipcRenderer.invoke('save-storage', data),
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
});
