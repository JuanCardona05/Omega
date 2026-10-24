const { contextBridge, ipcRenderer } = require('electron')

const updateListeners = new Set()

ipcRenderer.on('update-state', (event, state) => {
  for (const listener of updateListeners) {
    listener(state)
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  dismissUpdate: () => ipcRenderer.invoke('dismiss-update'),
  setInstallOnClose: (enabled) => ipcRenderer.invoke('set-install-on-close', enabled),
  setCriticalOperation: (enabled) => ipcRenderer.invoke('set-critical-operation', enabled),
  onUpdateState: (listener) => {
    updateListeners.add(listener)
    return () => updateListeners.delete(listener)
  },
  removeUpdateListener: (listener) => {
    updateListeners.delete(listener)
  },
})
