import { ipcMain, BrowserWindow } from 'electron'
import { LoginService } from '../services/LoginService'

let loginService: LoginService

export function registerLoginIPC(mainWindow: BrowserWindow): void {
  loginService = new LoginService()

  /**
   * 检查登录状态
   */
  ipcMain.handle('login:check-status', async () => {
    try {
      const status = await loginService.getCacheStatus()
      return { success: true, data: status }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  /**
   * 开始登录
   */
  ipcMain.handle('login:start', async () => {
    try {
      const loginData = await loginService.getLoginInfo(mainWindow, (status) => {
        // 推送登录状态到渲染进程
        mainWindow.webContents.send('login:status-change', status)
      })

      return { success: true, data: loginData }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  /**
   * 清除登录缓存
   */
  ipcMain.handle('login:logout', async () => {
    try {
      await loginService.clearCache()
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  /**
   * 刷新登录(重新登录)
   */
  ipcMain.handle('login:refresh', async () => {
    try {
      await loginService.clearCache()
      const loginData = await loginService.getLoginInfo(mainWindow, (status) => {
        mainWindow.webContents.send('login:status-change', status)
      })

      return { success: true, data: loginData }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })
}
