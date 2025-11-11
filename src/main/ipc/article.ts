import { ipcMain } from 'electron'
import { prisma } from '../services/DatabaseService.js'
import type { Prisma } from '@prisma/client'

/**
 * 文章管理 IPC 处理器
 */
export function registerArticleHandlers(): void {
  // 获取文章列表(分页)
  ipcMain.handle(
    'article:list',
    async (
      _,
      params: {
        page?: number
        pageSize?: number
        search?: string
        accountId?: string
      }
    ) => {
      try {
        const { page = 1, pageSize = 20, search, accountId } = params

        // 构建查询条件
        const where: Prisma.ArticleWhereInput = {}

        if (search) {
          where.title = {
            contains: search
          }
        }

        if (accountId) {
          where.accountId = accountId
        }

        // 查询总数
        const total = await prisma.article.count({ where })

        // 分页查询
        const items = await prisma.article.findMany({
          where,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                platform: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * pageSize,
          take: pageSize
        })

        return {
          success: true,
          data: {
            items,
            total,
            page,
            pageSize
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          success: false,
          error: message
        }
      }
    }
  )

  // 获取单个文章详情
  ipcMain.handle('article:get', async (_, id: string) => {
    try {
      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              platform: true
            }
          }
        }
      })

      if (!article) {
        return {
          success: false,
          error: '文章不存在'
        }
      }

      return {
        success: true,
        data: article
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 删除文章
  ipcMain.handle('article:delete', async (_, id: string) => {
    try {
      await prisma.article.delete({
        where: { id }
      })

      return {
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 批量删除文章
  ipcMain.handle('article:deleteMany', async (_, ids: string[]) => {
    try {
      await prisma.article.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })

      return {
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 根据公众号 ID 删除所有文章
  ipcMain.handle('article:deleteByAccount', async (_, accountId: string) => {
    try {
      await prisma.article.deleteMany({
        where: { accountId }
      })

      return {
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message
      }
    }
  })

  // 获取文章统计信息
  ipcMain.handle('article:stats', async () => {
    try {
      const total = await prisma.article.count()

      // 按公众号统计
      const byAccount = await prisma.article.groupBy({
        by: ['accountId'],
        _count: {
          id: true
        }
      })

      // 获取最近爬取的文章
      const recentArticles = await prisma.article.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
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
        data: {
          total,
          byAccount,
          recentArticles
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
}
