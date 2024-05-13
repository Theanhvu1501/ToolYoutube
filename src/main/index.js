import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
const Downloader = require('../../downloader')
const TiktokDownloader = require('../../downloader/tiktok')

const downloader = new Downloader()
const tiktokDownloader = new TiktokDownloader()
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 890,
    show: false,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('download', async (event, { urls, directory }) => {
  // Download file to tmp folder
  downloader.downloadVideos(urls, directory)

  // Catch and handle any errors that come back from the downloader
  downloader.on('error', (error) => {
    event.reply('download:error', error)
  })

  // Get download progress
  downloader.on('progress', (percentage) => {
    event.reply('download:progress', percentage)
  })

  downloader.on('finish', async () => {
    event.reply('download:success')
  })
})

ipcMain.on('downloadTiktok', async (event, { username, directory, listUrls }) => {
  // Download file to tmp folder
  tiktokDownloader.downloadWithUserName(username, directory, listUrls)

  // // Catch and handle any errors that come back from the downloader
  tiktokDownloader.on('error', (error) => {
    event.reply('downloadTiktok:error', error)
  })

  // // Get download progress
  tiktokDownloader.on('progress', (percentage) => {
    event.reply('downloadTiktok:progress', percentage)
  })

  tiktokDownloader.on('finish', async () => {
    event.reply('downloadTiktok:success')
  })
})
