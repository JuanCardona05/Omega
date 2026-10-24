const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const { fileURLToPath } = require('node:url')
const path = require('node:path')

const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
const preloadPath = path.join(__dirname, 'preload.cjs')
const iconPath = app.isPackaged
  ? path.join(__dirname, '..', 'dist', 'omega-icon.ico')
  : path.join(__dirname, '..', 'public', 'omega-icon.ico')
const developmentOrigin = 'http://127.0.0.1:5173'
const isExternalUrl = (url) => /^(https?:\/\/|mailto:)/i.test(url)

let mainWindow = null
let installOnClose = false
let criticalOperationInProgress = false

const updateState = {
  status: 'idle',
  version: '',
  message: '',
  progress: 0,
  error: '',
  installOnClose: false,
  dismissed: false,
}

const emitUpdateState = (patch = {}) => {
  Object.assign(updateState, patch)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-state', { ...updateState })
  }
}

const isAppUrl = (url) => {
  try {
    const parsedUrl = new URL(url)
    if (app.isPackaged) {
      return parsedUrl.protocol === 'file:' && path.resolve(fileURLToPath(parsedUrl)) === indexPath
    }
    return parsedUrl.origin === developmentOrigin
  } catch {
    return false
  }
}

const initializeUpdates = () => {
  if (!app.isPackaged) {
    emitUpdateState({ status: 'idle', message: 'Las actualizaciones no se comprueban en modo desarrollo.' })
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.disableWebInstaller = false
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    emitUpdateState({ status: 'checking', progress: 0, error: '', message: 'Comprobando actualizaciones…' })
  })

  autoUpdater.on('update-available', (info) => {
    emitUpdateState({
      status: 'available',
      version: info?.version || info?.releaseName || autoUpdater.currentVersion?.version || 'Nueva versión',
      message: 'Hay una nueva actualización disponible.',
      progress: 0,
      error: '',
    })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Number(progressObj?.percent || 0)
    emitUpdateState({
      status: 'downloading',
      progress: Number.isFinite(percent) ? percent : 0,
      message: 'Descargando actualización…',
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    emitUpdateState({
      status: 'downloaded',
      version: info?.version || autoUpdater.currentVersion?.version || updateState.version || 'Nueva versión',
      message: 'La actualización está lista para instalarse.',
      progress: 100,
      error: '',
    })
  })

  autoUpdater.on('update-not-available', () => {
    emitUpdateState({ status: 'idle', version: app.getVersion(), message: 'Tu versión está actualizada.', progress: 0, error: '' })
  })

  autoUpdater.on('error', (error) => {
    emitUpdateState({ status: 'error', message: 'No se pudo comprobar o descargar la actualización.', error: error?.message || 'Error desconocido', progress: 0 })
  })

  const scheduleChecks = () => {
    if (typeof globalThis.__omegaAutoUpdateTimer !== 'undefined') {
      clearInterval(globalThis.__omegaAutoUpdateTimer)
    }
    globalThis.__omegaAutoUpdateTimer = setInterval(() => {
      if (!app.isPackaged) return
      autoUpdater.checkForUpdatesAndNotify().catch((error) => {
        console.error('No se pudo comprobar actualizaciones periódicamente.', error)
      })
    }, 60 * 60 * 1000)
  }

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error('No se pudo comprobar actualizaciones al iniciar.', error)
  })
  scheduleChecks()
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: iconPath,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath,
    },
  })
  mainWindow.removeMenu()

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return

    event.preventDefault()
    if (isExternalUrl(url)) void shell.openExternal(url)
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (app.isPackaged) {
    await mainWindow.loadFile(indexPath)
  } else {
    await mainWindow.loadURL(developmentOrigin)
  }
}

ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('get-update-state', () => ({ ...updateState }))

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { ok: false, message: 'Las comprobaciones de actualización están desactivadas en desarrollo.' }
  }

  try {
    const result = await autoUpdater.checkForUpdatesAndNotify()
    return { ok: !!result, message: 'Comprobación iniciada.' }
  } catch (error) {
    console.error('Error al comprobar actualizaciones.', error)
    return { ok: false, message: error?.message || 'No se pudo comprobar actualizaciones.' }
  }
})

ipcMain.handle('install-update', () => {
  if (criticalOperationInProgress) {
    return { ok: false, message: 'Finaliza la operación de facturación antes de actualizar.' }
  }

  if (updateState.status === 'downloaded') {
    autoUpdater.quitAndInstall(true, true)
    return { ok: true }
  }

  return { ok: false, message: 'La actualización aún no está lista.' }
})

ipcMain.handle('dismiss-update', () => {
  emitUpdateState({ dismissed: true, message: 'Se recordará la actualización más tarde.' })
  return { ok: true }
})

ipcMain.handle('set-install-on-close', (_event, enabled) => {
  installOnClose = Boolean(enabled)
  emitUpdateState({ installOnClose: installOnClose, dismissed: false })
  return { ok: true, installOnClose }
})

ipcMain.handle('set-critical-operation', (_event, enabled) => {
  criticalOperationInProgress = Boolean(enabled)
  return { ok: true, criticalOperationInProgress }
})

app.whenReady().then(() => {
  initializeUpdates()
  createWindow().catch((error) => {
    console.error('No se pudo iniciar Omega.', error)
    app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error('No se pudo abrir la ventana de Omega.', error)
        app.quit()
      })
    }
  })
})

app.on('before-quit', (event) => {
  if (updateState.status === 'downloaded' && installOnClose && !criticalOperationInProgress) {
    autoUpdater.quitAndInstall(true, true)
    return
  }

  if (updateState.status === 'downloaded' && installOnClose && criticalOperationInProgress) {
    event.preventDefault()
    emitUpdateState({
      status: 'downloaded',
      message: 'Hay una operación crítica en curso. La actualización se instalará al cerrar la aplicación cuando termine.',
    })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
