import { app, BrowserWindow, ipcMain, Notification, shell, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import { readCollection, writeCollection, exportAll, backupAll, dataDir } from './store'
import { buscar as buscarArticulos, indice as indiceCodigos } from './codigos'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEV_SERVER = process.env.VITE_DEV_SERVER_URL

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    title: 'Jarvis',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 22 },
    backgroundColor: '#faf9f6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // External links open in the real browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (DEV_SERVER) {
    win.loadURL(DEV_SERVER)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('datos:leer', (_e, name: string) => readCollection(name))
  ipcMain.handle('datos:guardar', (_e, name: string, data: unknown) => writeCollection(name, data))
  ipcMain.handle('datos:respaldar', () => backupAll())
  ipcMain.handle('datos:carpeta', () => shell.openPath(dataDir()))

  ipcMain.handle('datos:exportar', async () => {
    if (!win) return null
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar todo',
      defaultPath: `jarvis-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (canceled || !filePath) return null
    await fs.writeFile(filePath, JSON.stringify(await exportAll(), null, 2), 'utf8')
    return filePath
  })

  ipcMain.handle('codigos:indice', () => indiceCodigos())
  ipcMain.handle('codigos:buscar', (_e, slug: string, consulta: string) =>
    buscarArticulos(slug, consulta),
  )

  ipcMain.handle('avisar', (_e, titulo: string, cuerpo: string) => {
    if (!Notification.isSupported()) return
    new Notification({ title: titulo, body: cuerpo }).show()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
