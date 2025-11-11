import { BrowserWindow } from 'electron'
import { registerLoginIPC } from './login'
import { registerConfigHandlers } from './config'
import { registerAccountHandlers } from './account'
import { registerArticleHandlers } from './article'
import { registerScraperHandlers } from './scraper'
import { registerDashboardHandlers } from './dashboard'
import { registerSchedulerHandlers, initScheduler } from './scheduler'
import { registerTagHandlers } from './tag'
import './file' // 导入文件相关 IPC handlers

/**
 * 注册所有 IPC 处理器
 */
export function registerAllIPC(mainWindow: BrowserWindow): void {
  // 注册登录相关 IPC
  registerLoginIPC(mainWindow)

  // 注册配置相关 IPC
  registerConfigHandlers()

  // 注册公众号管理 IPC
  registerAccountHandlers()

  // 注册标签管理 IPC
  registerTagHandlers()

  // 注册文章管理 IPC
  registerArticleHandlers()

  // 注册爬虫相关 IPC
  registerScraperHandlers(mainWindow)

  // 注册仪表盘 IPC
  registerDashboardHandlers()

  // 注册定时任务 IPC
  registerSchedulerHandlers(mainWindow)
}

/**
 * 初始化定时任务调度器(应用启动时调用)
 */
export async function initializeScheduler(): Promise<void> {
  await initScheduler()
}
