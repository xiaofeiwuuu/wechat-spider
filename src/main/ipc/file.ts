import { ipcMain } from 'electron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { prisma } from '../services/DatabaseService.js'

/**
 * 下载图片到本地
 */
ipcMain.handle('file:downloadImages', async (_event, imageUrls: string[], articleTitle: string) => {
  try {
    // 获取存储配置
    const config = await prisma.config.findUnique({ where: { key: 'storage' } })
    const storageConfig = config ? (JSON.parse(config.value) as { mode: string; path: string }) : null
    const downloadPath = storageConfig?.path || ''

    if (!downloadPath) {
      return {
        success: false,
        error: '未配置下载路径,请先在设置中配置'
      }
    }

    // 创建文章文件夹(使用文章标题,去除非法字符)
    const safeFolderName = articleTitle.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 50)
    const articleFolder = path.join(downloadPath, safeFolderName)

    if (!fs.existsSync(articleFolder)) {
      fs.mkdirSync(articleFolder, { recursive: true })
    }

    const results: Array<{ url: string; success: boolean; path?: string; error?: string }> = []

    // 下载所有图片
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]
      try {
        // 从 URL 提取文件扩展名
        const urlObj = new URL(url)
        const ext = path.extname(urlObj.pathname) || '.jpg'
        const fileName = `image-${i + 1}${ext}`
        const filePath = path.join(articleFolder, fileName)

        // 下载图片
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })

        // 保存到本地
        fs.writeFileSync(filePath, Buffer.from(response.data))

        results.push({
          url,
          success: true,
          path: filePath
        })
      } catch (error: unknown) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const successCount = results.filter((r) => r.success).length

    return {
      success: true,
      data: {
        total: imageUrls.length,
        success: successCount,
        failed: imageUrls.length - successCount,
        folder: articleFolder,
        results
      }
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
})

/**
 * 在文件管理器中显示文件
 */
ipcMain.handle('file:showInFolder', async (_event, folderPath: string) => {
  try {
    const { shell } = require('electron')
    await shell.openPath(folderPath)
    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
})
