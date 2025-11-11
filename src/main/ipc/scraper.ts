import { ipcMain, BrowserWindow } from 'electron'
import { ScraperService } from '../services/ScraperService.js'
import { prisma } from '../services/DatabaseService.js'

interface ScraperParams {
  accountNames: string[]
  rangeType: 'days' | 'count' | 'all'
  days?: number
  count?: number
}

interface ScraperOptions {
  maxPages: number
  includeContent: boolean
  days?: number
  limit?: number
}

/**
 * 爬虫相关的 IPC 处理器
 */
export function registerScraperHandlers(mainWindow: BrowserWindow): void {
  const scraperService = new ScraperService()

  // 停止爬取
  ipcMain.handle('scraper:stop', async () => {
    try {
      scraperService.stop()
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 开始爬取
  ipcMain.handle('scraper:start', async (_event, params: ScraperParams) => {
    try {
      const { accountNames, rangeType, days, count } = params

      // 从数据库读取爬取配置
      let maxPages = 20 // 默认值
      try {
        const scraperConfig = await prisma.config.findUnique({
          where: { key: 'scraper' }
        })
        if (scraperConfig) {
          const config = JSON.parse(scraperConfig.value)
          maxPages = config.maxPages || 20
        }
      } catch (error) {
        console.error('[IPC] 读取爬取配置失败,使用默认值:', error)
      }

      // 构建爬取选项
      const options: ScraperOptions = {
        maxPages,
        includeContent: true
      }

      if (rangeType === 'days' && days) {
        options.days = days
      } else if (rangeType === 'count' && count) {
        options.limit = count
      }
      // rangeType === 'all' 则不设置任何限制


      // 日志回调
      const onLog = (type: 'info' | 'success' | 'warning' | 'error', message: string): void => {
        mainWindow.webContents.send('scraper:log', { type, message })
      }

      // 进度回调
      const onProgress = (current: number, total: number): void => {
        mainWindow.webContents.send('scraper:progress', { current, total })
      }

      // 执行爬取
      const result = await scraperService.scrapeMultipleAccounts(
        accountNames,
        options,
        onLog,
        onProgress
      )

      // 发送完成事件
      mainWindow.webContents.send('scraper:complete', result)

      return { success: true, data: result }
    } catch (error) {
      console.error('[IPC] scraper:start 失败:', error)
      console.error('[IPC] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })
}
