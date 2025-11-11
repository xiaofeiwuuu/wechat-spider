import { ipcMain } from 'electron'
import { prisma } from '../services/DatabaseService.js'

/**
 * 仪表盘数据 IPC 处理器
 */
export function registerDashboardHandlers(): void {
  // 获取统计数据
  ipcMain.handle('dashboard:statistics', async () => {
    try {
      // 总文章数
      const totalArticles = await prisma.article.count()

      // 总公众号数
      const totalAccounts = await prisma.account.count()

      // 今日爬取(创建时间在今天)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayArticles = await prisma.article.count({
        where: {
          createdAt: {
            gte: todayStart.toISOString()
          }
        }
      })

      // 本周爬取(最近7天)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekArticles = await prisma.article.count({
        where: {
          createdAt: {
            gte: weekStart.toISOString()
          }
        }
      })

      // 本月爬取(最近30天)
      const monthStart = new Date()
      monthStart.setDate(monthStart.getDate() - 30)
      monthStart.setHours(0, 0, 0, 0)
      const monthArticles = await prisma.article.count({
        where: {
          createdAt: {
            gte: monthStart.toISOString()
          }
        }
      })

      return {
        success: true,
        data: {
          totalArticles,
          totalAccounts,
          todayArticles,
          weekArticles,
          monthArticles
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 获取趋势数据
  ipcMain.handle('dashboard:trend', async (_, days: number = 7) => {
    try {
      const result: Array<{ date: string; count: number }> = []
      const today = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const count = await prisma.article.count({
          where: {
            createdAt: {
              gte: date.toISOString(),
              lt: nextDate.toISOString()
            }
          }
        })

        result.push({
          date: date.toISOString().split('T')[0],
          count
        })
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 获取最近文章
  ipcMain.handle('dashboard:recent-articles', async (_, limit: number = 10) => {
    try {
      const articles = await prisma.article.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          account: {
            select: {
              name: true
            }
          }
        }
      })

      return {
        success: true,
        data: articles.map((article) => ({
          id: article.id,
          accountId: article.accountId,
          accountName: article.account?.name || '',
          title: article.title,
          url: article.url,
          publishTime: article.publishTime,
          createdAt: article.createdAt
        }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 获取热门公众号
  ipcMain.handle('dashboard:top-accounts', async (_, limit: number = 10) => {
    try {
      const accounts = await prisma.account.findMany({
        include: {
          _count: {
            select: {
              articles: true
            }
          }
        },
        orderBy: {
          articles: {
            _count: 'desc'
          }
        },
        take: limit
      })

      return {
        success: true,
        data: accounts.map((account) => ({
          name: account.name,
          count: account._count.articles
        }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })
}
