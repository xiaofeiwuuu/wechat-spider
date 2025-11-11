import { BrowserWindow, Notification } from 'electron'
import { prisma } from './DatabaseService.js'
import { ScraperService } from './ScraperService.js'

interface SchedulerConfig {
  enabled: boolean
  autoLaunch: boolean
  mode: 'interval' | 'fixed'
  intervalValue: number
  intervalUnit: 'minutes' | 'hours' | 'days'
  frequency: 'daily' | 'weekly'
  time: string | null
  weekDays: number[]
  skipIfRunning: boolean
  accountNames: string[]
}

/**
 * 定时任务调度服务
 */
export class SchedulerService {
  private mainWindow: BrowserWindow
  private scraperService: ScraperService
  private timer: NodeJS.Timeout | null = null
  private isRunning = false
  private config: SchedulerConfig | null = null
  private countdownTimer: NodeJS.Timeout | null = null
  private countdownInterval: NodeJS.Timeout | null = null
  private shouldCancelTask = false
  private currentLogId: string | null = null // 当前任务的日志记录 ID
  private countdownResolve: (() => void) | null = null // 用于提前结束倒计时的 resolve 函数

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.scraperService = new ScraperService()
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    try {
      // 从数据库加载配置
      await this.loadConfig()

      if (!this.config || !this.config.enabled) {
        console.log('[Scheduler] 定时任务未启用')
        return
      }

      // 停止现有的调度器
      this.stop()

      // 根据模式启动调度器
      if (this.config.mode === 'interval') {
        this.startIntervalMode()
      } else {
        this.startFixedMode()
      }

      console.log('[Scheduler] 定时任务已启动')
    } catch (error) {
      console.error(`[Scheduler] 启动失败: ${error}`)
      throw error
    }
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
      console.log('[Scheduler] 定时任务已停止')
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer)
      this.countdownTimer = null
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  }

  /**
   * 取消本次任务
   */
  cancelCurrentTask(): void {
    console.log('[Scheduler] 用户取消本次任务')
    this.shouldCancelTask = true
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer)
      this.countdownTimer = null
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
    // 立即结束倒计时等待
    if (this.countdownResolve) {
      this.countdownResolve()
      this.countdownResolve = null
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): { enabled: boolean; nextRunTime: string | null } {
    return {
      enabled: this.config?.enabled || false,
      nextRunTime: this.calculateNextRunTime()
    }
  }

  /**
   * 从数据库加载配置
   */
  private async loadConfig(): Promise<void> {
    const configData = await prisma.config.findUnique({
      where: { key: 'scheduler' }
    })

    if (configData) {
      this.config = JSON.parse(configData.value)
    }
  }

  /**
   * 启动间隔执行模式
   */
  private startIntervalMode(): void {
    if (!this.config) return

    const { intervalValue, intervalUnit } = this.config

    // 计算间隔毫秒数
    let intervalMs = intervalValue * 60 * 1000 // 默认分钟
    if (intervalUnit === 'hours') {
      intervalMs = intervalValue * 60 * 60 * 1000
    } else if (intervalUnit === 'days') {
      intervalMs = intervalValue * 24 * 60 * 60 * 1000
    }

    // 设置定时器
    const runTask = async (): Promise<void> => {
      try {
        await this.executeTaskWithCountdown()
      } finally {
        // 无论任务是否被取消,都要重新设置下一次定时器
        this.timer = setTimeout(runTask, intervalMs)
      }
    }

    // 首次执行延迟一个间隔
    this.timer = setTimeout(runTask, intervalMs)

    console.log(`[Scheduler] 间隔执行模式已启动: 每 ${intervalValue} ${intervalUnit} 执行一次`)
  }

  /**
   * 启动定时执行模式
   */
  private startFixedMode(): void {
    if (!this.config) return

    const scheduleNext = (): void => {
      const nextRunTime = this.calculateNextFixedRunTime()
      if (!nextRunTime) return

      const now = new Date()
      const delay = nextRunTime.getTime() - now.getTime()

      console.log(`[Scheduler] 下次执行时间: ${nextRunTime.toLocaleString('zh-CN')}`)

      this.timer = setTimeout(async () => {
        try {
          await this.executeTaskWithCountdown()
        } finally {
          // 无论任务是否被取消,都要计算并设置下次执行时间
          scheduleNext()
        }
      }, delay)
    }

    scheduleNext()
  }

  /**
   * 计算下次定时执行的时间
   */
  private calculateNextFixedRunTime(): Date | null {
    if (!this.config || !this.config.time) return null

    const now = new Date()
    const [hours, minutes] = this.config.time.split(':').map(Number)

    if (this.config.frequency === 'daily') {
      // 每天执行
      const nextRun = new Date(now)
      nextRun.setHours(hours, minutes, 0, 0)

      // 如果今天的时间已过,则设置为明天
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }

      return nextRun
    } else {
      // 每周执行
      const { weekDays } = this.config
      if (weekDays.length === 0) return null

      // 找到下一个符合条件的日期
      const nextRun = new Date(now)
      nextRun.setHours(hours, minutes, 0, 0)

      // 如果今天的时间已过,从明天开始查找
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }

      // 最多查找7天
      for (let i = 0; i < 7; i++) {
        const dayOfWeek = nextRun.getDay()
        if (weekDays.includes(dayOfWeek)) {
          return nextRun
        }
        nextRun.setDate(nextRun.getDate() + 1)
      }

      return null
    }
  }

  /**
   * 计算下次执行时间(用于显示)
   */
  private calculateNextRunTime(): string | null {
    if (!this.config || !this.config.enabled) return null

    if (this.config.mode === 'fixed') {
      const nextRun = this.calculateNextFixedRunTime()
      return nextRun ? nextRun.toISOString() : null
    }

    // 间隔模式返回 null,因为无法准确预测
    return null
  }

  /**
   * 带倒计时的执行任务
   */
  private async executeTaskWithCountdown(): Promise<void> {
    // 重置取消标志
    this.shouldCancelTask = false

    // 获取要爬取的公众号列表
    const accountNames = this.config?.accountNames || []
    if (accountNames.length === 0) {
      console.warn('[Scheduler] 未配置要爬取的公众号,跳过任务')
      return
    }

    // 创建任务日志记录
    const schedulerLog = await prisma.schedulerLog.create({
      data: {
        status: 'pending',
        accountCount: accountNames.length,
        accountNames: JSON.stringify(accountNames)
      }
    })
    this.currentLogId = schedulerLog.id
    console.log(`[Scheduler] 创建任务日志记录: ${this.currentLogId}`)

    console.log('[Scheduler] 任务将在30秒后执行,发送倒计时通知')

    // 发送倒计时开始事件到前端
    this.mainWindow.webContents.send('scheduler:countdown', {
      countdown: 30,
      accountNames: accountNames
    })

    // 30秒倒计时
    let countdown = 30
    this.countdownInterval = setInterval(() => {
      countdown--
      if (countdown > 0) {
        this.mainWindow.webContents.send('scheduler:countdown', {
          countdown: countdown,
          accountNames: accountNames
        })
      }
    }, 1000)

    // 等待30秒
    await new Promise<void>((resolve) => {
      // 保存 resolve 函数,以便取消时可以立即结束等待
      this.countdownResolve = resolve

      this.countdownTimer = setTimeout(() => {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval)
          this.countdownInterval = null
        }
        this.countdownResolve = null
        resolve()
      }, 30000)
    })

    // 检查是否被取消
    if (this.shouldCancelTask) {
      console.log('[Scheduler] 任务已被用户取消')
      this.shouldCancelTask = false
      this.mainWindow.webContents.send('scheduler:cancelled')

      // 更新日志记录为取消状态
      if (this.currentLogId) {
        await prisma.schedulerLog.update({
          where: { id: this.currentLogId },
          data: {
            status: 'cancelled',
            endTime: new Date(),
            duration: Math.floor((new Date().getTime() - schedulerLog.startTime.getTime()) / 1000)
          }
        })
        this.currentLogId = null
      }
      return
    }

    // 倒计时结束,关闭对话框
    this.mainWindow.webContents.send('scheduler:countdown-complete')

    // 执行任务
    await this.executeTask()
  }

  /**
   * 执行爬取任务
   */
  private async executeTask(): Promise<void> {
    const startTime = new Date()

    // 任务冲突检测
    if (this.config?.skipIfRunning && this.isRunning) {
      console.warn('[Scheduler] 上次任务仍在执行,跳过本次任务')

      // 发送任务跳过通知
      new Notification({
        title: '定时任务跳过',
        body: '上次任务仍在执行,已跳过本次任务'
      }).show()

      // 更新日志记录为跳过状态
      if (this.currentLogId) {
        await prisma.schedulerLog.update({
          where: { id: this.currentLogId },
          data: {
            status: 'cancelled',
            endTime: new Date(),
            duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
            errorMessage: '上次任务仍在执行,已跳过本次任务'
          }
        })
        this.currentLogId = null
      }

      return
    }

    try {
      this.isRunning = true
      console.log('[Scheduler] 开始执行定时任务')

      // 获取要爬取的公众号列表
      const accountNames = this.config?.accountNames || []

      // 如果配置中没有指定公众号,则使用默认设置
      if (accountNames.length === 0) {
        console.warn('[Scheduler] 未配置要爬取的公众号,跳过任务')

        // 发送未配置通知
        new Notification({
          title: '定时任务跳过',
          body: '未配置要爬取的公众号'
        }).show()

        // 更新日志记录
        if (this.currentLogId) {
          await prisma.schedulerLog.update({
            where: { id: this.currentLogId },
            data: {
              status: 'cancelled',
              endTime: new Date(),
              duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
              errorMessage: '未配置要爬取的公众号'
            }
          })
          this.currentLogId = null
        }

        return
      }

      // 发送任务开始通知
      new Notification({
        title: '定时任务开始',
        body: `开始爬取 ${accountNames.length} 个公众号: ${accountNames.join('、')}`
      }).show()

      // 发送任务开始的日志到前端
      this.mainWindow.webContents.send('scraper:log', {
        type: 'info',
        message: `[Scheduler Task] [info] 开始爬取 ${accountNames.length} 个公众号: ${accountNames.join('、')}`
      })

      // 获取爬取默认设置
      const defaultsConfig = await prisma.config.findUnique({
        where: { key: 'scraperDefaults' }
      })

      const defaults = defaultsConfig ? JSON.parse(defaultsConfig.value) : {}

      const rangeType = defaults.rangeType || 'days'
      const options: {
        maxPages: number
        includeContent: boolean
        days?: number
        limit?: number
      } = {
        maxPages: 20,
        includeContent: true
      }

      if (rangeType === 'days') {
        options.days = defaults.days || 30
      } else if (rangeType === 'count') {
        options.limit = defaults.count || 100
      }

      // 日志和进度回调
      const onLog = (type: 'info' | 'success' | 'warning' | 'error', message: string): void => {
        console.log(`[Scheduler Task] [${type}] ${message}`)
        this.mainWindow.webContents.send('scraper:log', {
          type,
          message: `[Scheduler Task] [${type}] ${message}`
        })
      }

      const onProgress = (current: number, total: number): void => {
        this.mainWindow.webContents.send('scraper:progress', { current, total })
      }

      // 执行爬取
      const result = await this.scraperService.scrapeMultipleAccounts(
        accountNames,
        options,
        onLog,
        onProgress
      )

      // 发送完成事件
      this.mainWindow.webContents.send('scraper:complete', result)

      console.log('[Scheduler] 定时任务执行完成')
      console.log(`[Scheduler] 执行结果: ${JSON.stringify(result)}`)

      // 计算统计信息
      const successCount = result.results?.filter((r) => r.success).length || 0
      const failCount = result.results?.filter((r) => !r.success).length || 0
      const totalCount = result.results?.length || accountNames.length
      const totalArticles =
        result.results?.reduce((sum: number, r) => sum + (r.articleCount || 0), 0) || 0

      // 更新日志记录为完成状态
      if (this.currentLogId) {
        await prisma.schedulerLog.update({
          where: { id: this.currentLogId },
          data: {
            status: 'completed',
            endTime: new Date(),
            successCount,
            failCount,
            totalArticles,
            duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
          }
        })
        this.currentLogId = null
      }

      // 发送任务完成通知
      new Notification({
        title: '定时任务完成',
        body: `成功: ${successCount}/${totalCount} 个公众号\n共爬取 ${totalArticles} 篇文章`
      }).show()
    } catch (error) {
      console.error(`[Scheduler] 定时任务执行失败: ${error}`)

      // 更新日志记录为失败状态
      if (this.currentLogId) {
        await prisma.schedulerLog.update({
          where: { id: this.currentLogId },
          data: {
            status: 'failed',
            endTime: new Date(),
            duration: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        })
        this.currentLogId = null
      }

      // 发送任务失败通知
      new Notification({
        title: '定时任务失败',
        body: `执行出错: ${error instanceof Error ? error.message : String(error)}`
      }).show()
    } finally {
      this.isRunning = false
    }
  }
}
