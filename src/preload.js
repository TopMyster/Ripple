const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, forward) => {
    ipcRenderer.invoke('set-ignore-mouse-events', ignore, forward);
  },
  getSystemMedia: () => ipcRenderer.invoke('get-system-media'),
  getBluetoothStatus: () => ipcRenderer.invoke('get-bluetooth-status'),
  controlSystemMedia: (command) => ipcRenderer.invoke('control-system-media', command)
});

