import { ipcMain } from 'electron'
import { prisma } from '../services/DatabaseService.js'

/**
 * 公众号管理相关的 IPC 处理器
 */
export function registerAccountHandlers(): void {
  // 添加公众号(支持批量)
  ipcMain.handle('account:add', async (_event, names: string[]) => {
    try {
      const results: Array<{ name: string; success: boolean; message: string }> = []
      for (const name of names) {
        const trimmedName = name.trim()
        if (!trimmedName) continue

        // 检查是否已存在
        const existing = await prisma.account.findUnique({
          where: {
            name_platform: {
              name: trimmedName,
              platform: 'wechat'
            }
          }
        })

        if (existing) {
          results.push({ name: trimmedName, success: false, message: '公众号已存在' })
          continue
        }

        // 创建新公众号
        await prisma.account.create({
          data: {
            name: trimmedName,
            platform: 'wechat'
          }
        })

        results.push({ name: trimmedName, success: true, message: '添加成功' })
      }

      return { success: true, data: results }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 获取所有公众号
  ipcMain.handle('account:list', async () => {
    try {
      const accounts = await prisma.account.findMany({
        where: {
          platform: 'wechat'
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              articles: true
            }
          },
          accountTags: {
            include: {
              tag: true
            }
          }
        }
      })

      // 将 Date 对象转换为字符串以支持 IPC 序列化
      const serializedAccounts = accounts.map((account) => ({
        ...account,
        createdAt: account.createdAt.toISOString(),
        accountTags: account.accountTags.map((at) => ({
          ...at,
          createdAt: at.createdAt.toISOString(),
          tag: {
            ...at.tag,
            createdAt: at.tag.createdAt.toISOString()
          }
        }))
      }))

      return { success: true, data: serializedAccounts }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 删除公众号
  ipcMain.handle('account:delete', async (_event, id: string) => {
    try {
      await prisma.account.delete({
        where: { id }
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 批量删除公众号
  ipcMain.handle('account:deleteMany', async (_event, ids: string[]) => {
    try {
      await prisma.account.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 给公众号添加标签
  ipcMain.handle('account:addTag', async (_event, accountId: string, tagId: string) => {
    try {
      // 检查是否已存在关联
      const existing = await prisma.accountTag.findFirst({
        where: {
          accountId,
          tagId
        }
      })

      if (existing) {
        return { success: false, error: '该标签已添加' }
      }

      await prisma.accountTag.create({
        data: {
          accountId,
          tagId
        }
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 从公众号移除标签
  ipcMain.handle('account:removeTag', async (_event, accountId: string, tagId: string) => {
    try {
      await prisma.accountTag.deleteMany({
        where: {
          accountId,
          tagId
        }
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 批量给公众号添加标签
  ipcMain.handle(
    'account:addTagsToAccounts',
    async (_event, accountIds: string[], tagIds: string[]) => {
      try {
        // 为每个公众号添加每个标签,使用循环方式避免批量操作
        for (const accountId of accountIds) {
          for (const tagId of tagIds) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (prisma as any).accountTag.upsert({
              where: {
                accountId_tagId: {
                  accountId,
                  tagId
                }
              },
              update: {},
              create: {
                accountId,
                tagId
              }
            })
          }
        }

        return { success: true, data: null }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { success: false, error: message }
      }
    }
  )

  // 批量从公众号移除标签
  ipcMain.handle(
    'account:removeTagsFromAccounts',
    async (_event, accountIds: string[], tagIds: string[]) => {
      try {
        await prisma.accountTag.deleteMany({
          where: {
            accountId: {
              in: accountIds
            },
            tagId: {
              in: tagIds
            }
          }
        })

        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return { success: false, error: message }
      }
    }
  )
}
