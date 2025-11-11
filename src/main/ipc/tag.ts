import { ipcMain } from 'electron'
import { prisma } from '../services/DatabaseService.js'

/**
 * 标签管理相关的 IPC 处理器
 */
export function registerTagHandlers(): void {
  // 获取所有标签
  ipcMain.handle('tag:list', async () => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              accountTags: true
            }
          }
        }
      })

      // 将 Date 对象转换为字符串以支持 IPC 序列化
      const serializedTags = tags.map((tag) => ({
        ...tag,
        createdAt: tag.createdAt.toISOString()
      }))

      return { success: true, data: serializedTags }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 创建标签
  ipcMain.handle('tag:create', async (_event, name: string) => {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return { success: false, error: '标签名称不能为空' }
      }

      // 检查是否已存在
      const existing = await prisma.tag.findUnique({
        where: { name: trimmedName }
      })

      if (existing) {
        return { success: false, error: '标签已存在' }
      }

      const tag = await prisma.tag.create({
        data: {
          name: trimmedName
        }
      })

      return {
        success: true,
        data: {
          ...tag,
          createdAt: tag.createdAt.toISOString()
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 更新标签
  ipcMain.handle('tag:update', async (_event, id: string, name: string) => {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        return { success: false, error: '标签名称不能为空' }
      }

      // 检查新名称是否已被其他标签使用
      const existing = await prisma.tag.findFirst({
        where: {
          name: trimmedName,
          id: { not: id }
        }
      })

      if (existing) {
        return { success: false, error: '标签名称已被使用' }
      }

      const tag = await prisma.tag.update({
        where: { id },
        data: { name: trimmedName }
      })

      return {
        success: true,
        data: {
          ...tag,
          createdAt: tag.createdAt.toISOString()
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 删除标签
  ipcMain.handle('tag:delete', async (_event, id: string) => {
    try {
      // Prisma 会自动级联删除 AccountTag 关联记录(因为设置了 onDelete: Cascade)
      await prisma.tag.delete({
        where: { id }
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  })

  // 批量删除标签
  ipcMain.handle('tag:deleteMany', async (_event, ids: string[]) => {
    try {
      await prisma.tag.deleteMany({
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
}
