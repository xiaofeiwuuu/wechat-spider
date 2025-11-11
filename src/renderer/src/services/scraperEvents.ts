import { useScraperStore } from '../stores/scraper'
import { useNotificationStore } from '../stores/notification'
import { ElNotification, type NotificationHandle } from 'element-plus'
import { h } from 'vue'

/**
 * 全局爬虫事件管理器
 * 在应用启动时初始化,监听器永不清理,确保即使切换页面也能接收爬取进度
 */
class ScraperEventsManager {
  private initialized = false
  private currentNotificationId: string | null = null
  private countdownMessageBox: NotificationHandle | null = null

  /**
   * 初始化全局爬虫事件监听器
   * 这些监听器会在整个应用生命周期中保持活跃
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('[ScraperEvents] 已经初始化过,跳过重复初始化')
      return
    }

    // 监听日志事件
    window.api.scraper.onLog((data) => {
      const scraperStore = useScraperStore()
      scraperStore.addLog(data.type as 'info' | 'success' | 'warning' | 'error', data.message)

      // 检测定时任务开始(通过日志标记判断)
      if (data.message.includes('[Scheduler Task]') && data.message.includes('开始爬取')) {
        ElNotification({
          title: '定时任务开始',
          message: data.message.replace('[Scheduler Task] [info] ', ''),
          type: 'info',
          duration: 4000,
          position: 'top-right'
        })
      }
    })

    // 监听进度事件
    window.api.scraper.onProgress((data) => {
      const scraperStore = useScraperStore()
      const notificationStore = useNotificationStore()

      // 如果已停止,忽略进度更新
      if (scraperStore.isStopped) return

      scraperStore.setProgress(data.current, data.total)

      // 更新通知进度
      if (this.currentNotificationId) {
        const progress = data.total > 0 ? Math.round((data.current / data.total) * 100) : 0
        notificationStore.updateNotification(this.currentNotificationId, {
          message: `正在爬取 (${data.current}/${data.total})`,
          progress
        })
      }
    })

    // 监听完成事件
    window.api.scraper.onComplete((data) => {
      const scraperStore = useScraperStore()
      const notificationStore = useNotificationStore()

      // 如果已停止,忽略完成事件
      if (scraperStore.isStopped) return

      scraperStore.setScraping(false)
      scraperStore.addLog('success', '✓ 爬取任务完成')

      // 计算统计信息
      let successCount = 0
      let failCount = 0
      let totalArticles = 0

      if (data.results) {
        for (const result of data.results) {
          if (result.success) {
            successCount++
            totalArticles += result.articleCount || 0
          } else {
            failCount++
          }
        }
      }

      scraperStore.addLog(
        'info',
        `统计: 成功 ${successCount} 个,失败 ${failCount} 个,共爬取 ${totalArticles} 篇文章`
      )

      // 更新通知为完成状态
      if (this.currentNotificationId) {
        const hasErrors = failCount > 0
        notificationStore.updateNotification(this.currentNotificationId, {
          type: hasErrors ? 'warning' : 'success',
          title: '爬取完成',
          message: `成功 ${successCount} 个,失败 ${failCount} 个,共爬取 ${totalArticles} 篇文章`,
          progress: 100
        })
        this.currentNotificationId = null

        // 显示右上角通知弹窗
        if (hasErrors) {
          ElNotification({
            title: '爬取完成',
            message: `成功 ${successCount} 个,失败 ${failCount} 个,共爬取 ${totalArticles} 篇文章`,
            type: 'warning',
            duration: 6000,
            position: 'top-right'
          })
        } else {
          ElNotification({
            title: '爬取完成',
            message: `成功爬取 ${successCount} 个公众号,共 ${totalArticles} 篇文章`,
            type: 'success',
            duration: 6000,
            position: 'top-right'
          })
        }
      } else {
        // 没有 currentNotificationId 表示这是定时任务
        // 直接显示右上角通知弹窗
        const hasErrors = failCount > 0
        if (hasErrors) {
          ElNotification({
            title: '定时任务完成',
            message: `成功 ${successCount} 个,失败 ${failCount} 个,共爬取 ${totalArticles} 篇文章`,
            type: 'warning',
            duration: 6000,
            position: 'top-right'
          })
        } else {
          ElNotification({
            title: '定时任务完成',
            message: `成功爬取 ${successCount} 个公众号,共 ${totalArticles} 篇文章`,
            type: 'success',
            duration: 6000,
            position: 'top-right'
          })
        }
      }
    })

    // 监听定时任务倒计时
    window.api.scheduler.onCountdown((data) => {
      console.log('[ScraperEvents] 收到倒计时事件:', data)
      const { countdown, accountNames } = data

      if (countdown === 30) {
        // 首次倒计时,显示对话框
        console.log('[ScraperEvents] 显示倒计时对话框')
        this.showCountdownDialog(countdown, accountNames)
      } else {
        // 更新对话框内容
        console.log('[ScraperEvents] 更新倒计时:', countdown)
        this.updateCountdownDialog(countdown, accountNames)
      }
    })

    // 监听任务取消
    window.api.scheduler.onCancelled(() => {
      if (this.countdownMessageBox) {
        // 关闭通知
        this.countdownMessageBox.close()
        this.countdownMessageBox = null
      }
      ElNotification({
        title: '任务已取消',
        message: '本次定时任务已取消',
        type: 'info',
        duration: 3000,
        position: 'top-right'
      })
    })

    // 监听倒计时完成
    window.api.scheduler.onCountdownComplete(() => {
      if (this.countdownMessageBox) {
        // 关闭通知
        this.countdownMessageBox.close()
        this.countdownMessageBox = null
      }
    })

    this.initialized = true
    console.log('[ScraperEvents] 全局爬虫事件监听器初始化完成')
  }

  /**
   * 显示倒计时通知(右上角)
   */
  private showCountdownDialog(countdown: number, accountNames: string[]): void {
    console.log('[ScraperEvents] showCountdownDialog 被调用, countdown=', countdown)

    // 创建右上角通知,并保存实例
    this.countdownMessageBox = ElNotification({
      title: '定时任务即将开始',
      message: h('div', { style: 'font-size: 13px;' }, [
        h(
          'p',
          {
            id: 'countdown-text-notify',
            style: 'margin: 0 0 12px 0; font-weight: 500; font-size: 14px; color: #303133;'
          },
          `倒计时 ${countdown} 秒后爬取 ${accountNames.length} 个公众号`
        ),
        h('div', { style: 'display: flex; gap: 8px;' }, [
          h(
            'button',
            {
              style:
                'flex: 1; padding: 6px 15px; border: 1px solid #dcdfe6; border-radius: 4px; background: white; cursor: pointer; font-size: 12px;',
              onClick: async () => {
                console.log('[ScraperEvents] 用户点击"取消本次"')
                await window.api.scheduler.cancelTask()
                if (this.countdownMessageBox) {
                  this.countdownMessageBox.close()
                  this.countdownMessageBox = null
                }
              }
            },
            '取消本次任务'
          ),
          h(
            'button',
            {
              style:
                'flex: 1; padding: 6px 15px; border: 1px solid #dcdfe6; border-radius: 4px; background: white; cursor: pointer; font-size: 12px;',
              onClick: async () => {
                console.log('[ScraperEvents] 用户点击"关闭定时任务"')
                await window.api.scheduler.stop()
                await window.api.scheduler.cancelTask()
                if (this.countdownMessageBox) {
                  this.countdownMessageBox.close()
                  this.countdownMessageBox = null
                }
                ElNotification({
                  title: '定时任务已关闭',
                  message: '定时任务功能已停止',
                  type: 'warning',
                  duration: 3000,
                  position: 'top-right'
                })
              }
            },
            '关闭定时任务'
          )
        ])
      ]),
      type: 'warning',
      duration: 0, // 不自动关闭
      position: 'top-right',
      showClose: true
    })

    console.log('[ScraperEvents] ElNotification 已显示')
  }

  /**
   * 更新倒计时通知
   */
  private updateCountdownDialog(countdown: number, accountNames: string[]): void {
    if (this.countdownMessageBox) {
      // 更新 DOM 中的倒计时文本
      const countdownEl = document.querySelector('#countdown-text-notify')
      if (countdownEl) {
        countdownEl.textContent = `倒计时 ${countdown} 秒后爬取 ${accountNames.length} 个公众号`
      }
    }
  }

  /**
   * 开始新的爬取任务,创建通知
   */
  startScraping(accountCount: number): string {
    const notificationStore = useNotificationStore()
    const id = notificationStore.addNotification(
      'progress',
      '开始爬取',
      `正在爬取 ${accountCount} 个公众号...`,
      0
    )
    this.currentNotificationId = id
    return id
  }

  /**
   * 更新当前爬取任务的通知为错误状态
   */
  setScrapingError(message: string): void {
    if (this.currentNotificationId) {
      const notificationStore = useNotificationStore()
      notificationStore.updateNotification(this.currentNotificationId, {
        type: 'error',
        title: '爬取失败',
        message
      })
      this.currentNotificationId = null
    }
  }

  /**
   * 更新当前爬取任务的通知为停止状态
   */
  setScrapingStopped(): void {
    if (this.currentNotificationId) {
      const notificationStore = useNotificationStore()
      notificationStore.updateNotification(this.currentNotificationId, {
        type: 'warning',
        title: '爬取已停止',
        message: '用户手动停止了爬取任务'
      })
      this.currentNotificationId = null

      // 显示右上角通知弹窗
      ElNotification({
        title: '爬取已停止',
        message: '用户手动停止了爬取任务',
        type: 'warning',
        duration: 4000,
        position: 'top-right'
      })
    }
  }
}

// 导出单例
export const scraperEventsManager = new ScraperEventsManager()
