import { ipcMain, BrowserWindow } from 'electron'
import { SchedulerService } from '../services/SchedulerService.js'
import { AutoLaunchService } from '../services/AutoLaunchService.js'
import { prisma } from '../services/DatabaseService.js'

let schedulerService: SchedulerService | null = null
const autoLaunchService = new AutoLaunchService()

/**
 * 定时任务相关的 IPC 处理器
 */
export function registerSchedulerHandlers(mainWindow: BrowserWindow): void {
  // 初始化调度服务
  schedulerService = new SchedulerService(mainWindow)

  // 启动调度器
  ipcMain.handle('scheduler:start', async () => {
    try {
      await schedulerService?.start()
      return { success: true }
    } catch (error) {
      console.error('[Scheduler IPC] ❌ scheduler:start 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 停止调度器
  ipcMain.handle('scheduler:stop', async () => {
    try {
      schedulerService?.stop()
      return { success: true }
    } catch (error) {
      console.error('[Scheduler IPC] ❌ scheduler:stop 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 启用开机自启动
  ipcMain.handle('scheduler:enableAutoLaunch', async () => {
    try {
      await autoLaunchService.enable()
      return { success: true }
    } catch (error) {
      console.error('[Scheduler IPC] ❌ scheduler:enableAutoLaunch 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 禁用开机自启动
  ipcMain.handle('scheduler:disableAutoLaunch', async () => {
    try {
      await autoLaunchService.disable()
      return { success: true }
    } catch (error) {
      console.error('[Scheduler IPC] ❌ scheduler:disableAutoLaunch 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 获取调度器状态
  ipcMain.handle('scheduler:getStatus', async () => {
    try {
      const status = schedulerService?.getStatus() || { enabled: false, nextRunTime: null }
      return { success: true, data: status }
    } catch (error) {
      console.error('[IPC] scheduler:getStatus 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 取消本次任务
  ipcMain.handle('scheduler:cancelTask', async () => {
    try {
      schedulerService?.cancelCurrentTask()
      return { success: true }
    } catch (error) {
      console.error('[Scheduler IPC] ❌ scheduler:cancelTask 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 获取定时任务日志列表
  ipcMain.handle(
    'scheduler:getLogs',
    async (_event, params?: { limit?: number; offset?: number }) => {
      try {
        const { limit = 50, offset = 0 } = params || {}

        const logs = await prisma.schedulerLog.findMany({
          orderBy: { startTime: 'desc' },
          take: limit,
          skip: offset
        })

        // 将 JSON 字符串转换为数组
        const logsWithParsedNames = logs.map((log) => ({
          ...log,
          accountNames: JSON.parse(log.accountNames)
        }))

        return { success: true, data: logsWithParsedNames }
      } catch (error) {
        console.error('[Scheduler IPC] ❌ scheduler:getLogs 失败:', error)
        const message = error instanceof Error ? error.message : String(error)
        return { success: false, error: message }
      }
    }
  )

  // 获取定时任务统计信息
  ipcMain.handle('scheduler:getStats', async () => {
    try {
      const totalTasks = await prisma.schedulerLog.count()
      const completedTasks = await prisma.schedulerLog.count({ where: { status: 'completed' } })
      const failedTasks = await prisma.schedulerLog.count({ where: { status: 'failed' } })
      const cancelledTasks = await prisma.schedulerLog.count({ where: { status: 'cancelled' } })

      const stats = {
        totalTasks,
        completedTasks,
        failedTasks,
        cancelledTasks,
        successRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : '0'
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('[Scheduler IPC] ❌ scheduler:getStats 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })
}

/**
 * 应用启动时自动启动调度器(如果已启用)
 */
export async function initScheduler(): Promise<void> {
  try {
    await schedulerService?.start()
  } catch (error) {
    console.error('[Scheduler] 初始化失败:', error)
  }
}
