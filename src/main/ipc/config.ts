import { ipcMain, dialog } from 'electron'
import { prisma } from '../services/DatabaseService.js'

/**
 * 系统配置相关的 IPC 处理器
 */
export function registerConfigHandlers(): void {
  // 选择文件夹路径
  ipcMain.handle('dialog:selectFolder', async (_event, defaultPath?: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: defaultPath || undefined,
      title: '选择文件夹'
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  // 获取配置
  ipcMain.handle('config:get', async (_event, key: string) => {
    try {
      const config = await prisma.config.findUnique({
        where: { key }
      })

      if (!config) {
        return null
      }

      return JSON.parse(config.value)
    } catch (error) {
      console.error('获取配置失败:', error)
      throw error
    }
  })

  // 保存配置
  ipcMain.handle(
    'config:set',
    async (_event, key: string, value: unknown, description?: string) => {
      try {
        // 检查 value 是否包含不可序列化的对象
        const checkForNonSerializable = (obj: unknown, path = 'root'): void => {
          if (obj === null || obj === undefined) return

          if (obj instanceof Date) {
            console.error(`[Config IPC] ❌ 发现 Date 对象在: ${path}`)
          }

          if (typeof obj === 'object') {
            for (const key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                checkForNonSerializable((obj as Record<string, unknown>)[key], `${path}.${key}`)
              }
            }
          }
        }

        checkForNonSerializable(value)

        const jsonString = JSON.stringify(value)
        const config = await prisma.config.upsert({
          where: { key },
          update: {
            value: jsonString,
            description: description || undefined
          },
          create: {
            key,
            value: jsonString,
            description: description || undefined
          }
        })
        const result = JSON.parse(config.value)
        return result
      } catch (error) {
        console.error('[Config IPC] ❌ 保存配置失败:', error)
        console.error('[Config IPC] 错误堆栈:', error instanceof Error ? error.stack : '无')
        throw error
      }
    }
  )

  // 删除配置
  ipcMain.handle('config:delete', async (_event, key: string) => {
    try {
      await prisma.config.delete({
        where: { key }
      })
      return true
    } catch (error) {
      console.error('删除配置失败:', error)
      throw error
    }
  })

  // 获取所有配置
  ipcMain.handle('config:getAll', async () => {
    try {
      const configs = await prisma.config.findMany()
      const result: Record<string, unknown> = {}

      for (const config of configs) {
        result[config.key] = JSON.parse(config.value)
      }

      return result
    } catch (error) {
      console.error('获取所有配置失败:', error)
      throw error
    }
  })
}
