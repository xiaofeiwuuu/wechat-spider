import { BrowserWindow, app } from 'electron'
import { chromium } from 'playwright'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

interface LoginData {
  token: string
  cookie: string
  timestamp: number
  userInfo?: {
    nickName: string
    avatar: string
    uin: string
    userName: string
  }
}

// 获取数据库路径(延迟初始化)
function getDbPath(): string {
  let dbDir: string
  let dbPath: string

  if (is.dev) {
    // 开发环境: 使用项目根目录下的 data 文件夹
    const projectRoot = path.resolve(__dirname, '../..')
    dbDir = path.join(projectRoot, 'data')
    dbPath = path.join(dbDir, 'wechat.db')
  } else {
    // 生产环境(打包后): 使用系统应用数据目录
    const userDataPath = app.getPath('userData')
    dbDir = path.join(userDataPath, 'data')
    dbPath = path.join(dbDir, 'wechat.db')
  }

  // 确保数据库目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  return dbPath
}

// 延迟初始化 Prisma Client
let prismaInstance: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const dbPath = getDbPath()
    prismaInstance = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    })
  }
  return prismaInstance
}

export class LoginService {
  private cacheExpireMs = 72 * 60 * 60 * 1000 // 72小时

  /**
   * 检查登录缓存
   */
  async checkCache(): Promise<LoginData | null> {
    try {
      const prisma = getPrisma()
      // 从数据库获取当前激活的用户
      const activeUser = await prisma.user.findFirst({
        where: { isActive: true }
      })

      if (!activeUser) {
        return null
      }

      // 检查是否过期
      const now = new Date()
      if (now > activeUser.expiresAt) {
        return null
      }

      // 返回登录数据
      return {
        token: activeUser.token,
        cookie: activeUser.cookie,
        timestamp: activeUser.createdAt.getTime(),
        userInfo: {
          nickName: activeUser.nickName,
          avatar: activeUser.avatar || '',
          uin: activeUser.uin,
          userName: activeUser.userName
        }
      }
    } catch (error) {
      console.error('Check cache failed:', error)
      return null
    }
  }

  /**
   * 获取登录信息(检查缓存或启动浏览器登录)
   */
  async getLoginInfo(
    mainWindow: BrowserWindow,
    onStatusChange?: (status: string) => void
  ): Promise<LoginData> {
    // 1. 检查缓存
    onStatusChange?.('checking-cache')
    const cache = await this.checkCache()
    if (cache) {
      onStatusChange?.('cache-valid')
      return cache
    }

    // 2. 启动浏览器登录
    onStatusChange?.('launching-browser')
    return await this.loginWithBrowser(mainWindow, onStatusChange)
  }

  /**
   * 使用浏览器登录
   */
  private async loginWithBrowser(
    _mainWindow: BrowserWindow,
    onStatusChange?: (status: string) => void
  ): Promise<LoginData> {
    const browser = await chromium.launch({
      headless: false,
      channel: 'chrome' // 使用系统 Chrome
    })

    try {
      const context = await browser.newContext()
      const page = await context.newPage()

      // 导航到登录页
      onStatusChange?.('navigating')
      await page.goto('https://mp.weixin.qq.com/')

      // 等待扫码登录
      onStatusChange?.('waiting-scan')

      // 轮询检测登录成功
      const startTime = Date.now()
      const timeout = 120000 // 2分钟超时

      while (Date.now() - startTime < timeout) {
        const url = page.url()

        if (url.includes('token=')) {
          onStatusChange?.('login-success')

          // 提取token和cookie
          const urlObj = new URL(url)
          const token = urlObj.searchParams.get('token')

          if (!token) {
            throw new Error('Failed to extract token')
          }

          const cookies = await context.cookies()
          const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

          // 通知正在获取用户信息
          onStatusChange?.('fetching-userinfo')

          // 尝试获取用户信息
          try {
            // 等待页面完全加载
            await page.waitForTimeout(2000)

            // 从 wx.cgiData 获取用户信息
            const userInfo = await page.evaluate(() => {
              interface WxWindow extends Window {
                wx?: {
                  cgiData?: {
                    nick_name?: string
                    real_nick_name?: string
                    head_img?: string
                    uin?: string
                    user_name?: string
                  }
                  uin?: string
                  user_name?: string
                }
              }
              const windowAny = window as WxWindow
              const cgiData = windowAny.wx?.cgiData || {}

              return {
                // 公众号昵称
                nickName: cgiData.nick_name || cgiData.real_nick_name || '未知用户',
                // 头像 URL
                avatar: cgiData.head_img || '',
                // 用户 ID
                uin: cgiData.uin || windowAny.wx?.uin || '',
                // 公众号用户名
                userName: cgiData.user_name || windowAny.wx?.user_name || ''
              }
            })

            // 保存到数据库
            const prisma = getPrisma()
            const expiresAt = new Date(Date.now() + this.cacheExpireMs)

            // 先将所有用户设置为非激活状态
            await prisma.user.updateMany({
              where: { isActive: true },
              data: { isActive: false }
            })

            // 使用 upsert 创建或更新用户
            await prisma.user.upsert({
              where: { uin: userInfo.uin },
              update: {
                token,
                cookie: cookieString,
                nickName: userInfo.nickName,
                avatar: userInfo.avatar,
                userName: userInfo.userName,
                expiresAt,
                isActive: true,
                updatedAt: new Date()
              },
              create: {
                uin: userInfo.uin,
                userName: userInfo.userName,
                nickName: userInfo.nickName,
                avatar: userInfo.avatar,
                token,
                cookie: cookieString,
                expiresAt,
                isActive: true
              }
            })

            const loginData: LoginData = {
              token,
              cookie: cookieString,
              timestamp: Date.now(),
              userInfo: {
                nickName: userInfo.nickName,
                avatar: userInfo.avatar,
                uin: userInfo.uin,
                userName: userInfo.userName
              }
            }

            await browser.close()
            return loginData
          } catch (error) {
            console.error('获取用户信息失败:', error)

            // 即使获取用户信息失败，也返回基本登录信息
            const loginData: LoginData = {
              token,
              cookie: cookieString,
              timestamp: Date.now()
            }

            await browser.close()
            return loginData
          }
        }

        await page.waitForTimeout(200)
      }

      throw new Error('Login timeout')
    } catch (error) {
      try {
        await browser.close()
      } catch {
        // 浏览器已经关闭,忽略错误
      }

      // 检查是否是用户手动关闭浏览器
      const errorMessage = String(error)

      // 情况1: 在页面加载时关闭 (page.goto 阶段)
      if (
        errorMessage.includes('page.goto:') &&
        errorMessage.includes('Target page, context or browser has been closed')
      ) {
        throw new Error('您关闭了浏览器')
      }

      // 情况2: 在等待登录时关闭 (page.waitForTimeout 阶段)
      if (
        errorMessage.includes('page.waitForTimeout:') &&
        errorMessage.includes('Target page, context or browser has been closed')
      ) {
        throw new Error('您关闭了浏览器')
      }

      // 情况3: 其他浏览器关闭相关错误
      if (
        errorMessage.includes('Target page, context or browser has been closed') ||
        errorMessage.includes('Protocol error') ||
        errorMessage.includes('Session closed') ||
        errorMessage.includes('Browser has been closed')
      ) {
        throw new Error('您关闭了浏览器')
      }

      throw error
    }
  }

  /**
   * 清除登录缓存(将当前激活用户设为非激活)
   */
  async clearCache(): Promise<void> {
    try {
      const prisma = getPrisma()
      await prisma.user.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    } catch (error) {
      console.error('Clear cache failed:', error)
    }
  }

  /**
   * 获取缓存状态
   */
  async getCacheStatus(): Promise<{
    isValid: boolean
    expiresIn?: number
    expiresAt?: string
    userInfo?: {
      nickName: string
      avatar: string
      uin: string
      userName: string
    }
  }> {
    const cache = await this.checkCache()

    if (!cache) {
      return { isValid: false }
    }

    const expiresIn = this.cacheExpireMs - (Date.now() - cache.timestamp)
    const expiresAt = new Date(cache.timestamp + this.cacheExpireMs).toISOString()

    return {
      isValid: true,
      expiresIn,
      expiresAt,
      userInfo: cache.userInfo
    }
  }
}
