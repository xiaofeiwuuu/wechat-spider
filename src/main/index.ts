import { app, shell, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerAllIPC, initializeScheduler } from './ipc'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

/**
 * 初始化数据库
 * 确保数据库目录存在
 */
async function initDatabase(): Promise<void> {
  try {
    const userDataPath = app.getPath('userData')
    const dbDir = path.join(userDataPath, 'data')
    const dbPath = path.join(dbDir, 'wechat.db')

    // 确保目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    console.log('数据库路径:', dbPath)
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }
}

function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1a1a1a', // 默认深色背景
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载远程 URL,生产环境加载本地 HTML 文件
  const isDev = !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 注册所有 IPC 处理器
  registerAllIPC(mainWindow)

  // 窗口创建完成后初始化定时任务调度器
  mainWindow.webContents.on('did-finish-load', () => {
    initializeScheduler().catch((error) => {
      console.error('初始化定时任务调度器失败:', error)
    })
  })
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
// 某些 API 只能在此事件发生后使用
app.whenReady().then(async () => {
  // 初始化数据库
  await initDatabase()

  // 设置 Windows 应用程序用户模型 ID
  electronApp.setAppUserModelId('com.electron')

  // 开发环境下默认使用 F12 打开或关闭 DevTools
  // 生产环境下忽略 CommandOrControl + R
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // 监听主题变化,更新窗口背景色和系统主题
  ipcMain.on('theme:change', (_event, theme: 'dark' | 'light') => {
    if (!mainWindow) return

    // 根据主题设置窗口背景色
    const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff'
    mainWindow.setBackgroundColor(backgroundColor)

    // 设置系统原生主题(影响标题栏按钮)
    nativeTheme.themeSource = theme
  })

  app.on('activate', function () {
    // 在 macOS 上,当点击 dock 图标且没有其他窗口打开时,
    // 通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口关闭时退出应用(macOS 除外)
// 在 macOS 上,应用程序及其菜单栏通常保持活动状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在此文件中,你可以包含应用程序特定的主进程代码
// 也可以将它们放在单独的文件中并在此引入
