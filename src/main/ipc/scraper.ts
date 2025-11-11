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
  console.log('[IPC] ScraperService 实例已创建')

  // 停止爬取
  ipcMain.handle('scraper:stop', async () => {
    console.log('[IPC] 收到 scraper:stop 请求')
    try {
      scraperService.stop()
      console.log('[IPC] 已调用 scraperService.stop()')
      return { success: true }
    } catch (error) {
      console.error('[IPC] scraper:stop 失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 开始爬取
  ipcMain.handle('scraper:start', async (_event, params: ScraperParams) => {
    console.log('[IPC] 收到 scraper:start 请求, 参数:', params)
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

      console.log('[IPC] 爬取选项:', options)

      // 日志回调
      const onLog = (type: 'info' | 'success' | 'warning' | 'error', message: string): void => {
        console.log(`[IPC] 发送日志: [${type}] ${message}`)
        mainWindow.webContents.send('scraper:log', { type, message })
      }

      // 进度回调
      const onProgress = (current: number, total: number): void => {
        console.log(`[IPC] 发送进度: ${current}/${total}`)
        mainWindow.webContents.send('scraper:progress', { current, total })
      }

      console.log('[IPC] 开始调用 scraperService.scrapeMultipleAccounts')
      // 执行爬取
      const result = await scraperService.scrapeMultipleAccounts(
        accountNames,
        options,
        onLog,
        onProgress
      )

      console.log('[IPC] scraperService.scrapeMultipleAccounts 完成, 结果:', result)
      // 发送完成事件
      mainWindow.webContents.send('scraper:complete', result)
      console.log('[IPC] 已发送 scraper:complete 事件')

      return { success: true, data: result }
    } catch (error) {
      console.error('[IPC] scraper:start 失败:', error)
      console.error('[IPC] 错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息')
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })
}
