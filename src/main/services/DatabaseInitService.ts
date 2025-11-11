import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

/**
 * 数据库自动初始化服务
 * 在应用启动时检查数据库是否存在,不存在则自动创建表结构
 */
export class DatabaseInitService {
  /**
   * 获取数据库路径
   */
  private getDbPath(): string {
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

  /**
   * 检查数据库是否已初始化
   * 通过检查 User 表是否存在来判断
   */
  private async isDatabaseInitialized(prisma: PrismaClient): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master WHERE type='table' AND name='User'
      `
      return result.length > 0
    } catch {
      return false
    }
  }

  /**
   * 创建数据库表结构
   */
  private async createTables(prisma: PrismaClient): Promise<void> {
    console.log('[DatabaseInit] 开始创建数据库表结构...')

    // 创建 User 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "uin" TEXT NOT NULL UNIQUE,
        "userName" TEXT NOT NULL,
        "nickName" TEXT NOT NULL,
        "avatar" TEXT,
        "token" TEXT NOT NULL,
        "cookie" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "expiresAt" DATETIME NOT NULL
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive")`

    // 创建 Account 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "platform" TEXT NOT NULL DEFAULT 'wechat',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Account_name_platform_key" ON "Account"("name", "platform")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Account_platform_idx" ON "Account"("platform")`

    // 创建 Tag 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Tag" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Tag_name_idx" ON "Tag"("name")`

    // 创建 AccountTag 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AccountTag" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "tagId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "AccountTag_accountId_tagId_key" ON "AccountTag"("accountId", "tagId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AccountTag_accountId_idx" ON "AccountTag"("accountId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AccountTag_tagId_idx" ON "AccountTag"("tagId")`

    // 创建 Article 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Article" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "url" TEXT NOT NULL UNIQUE,
        "publishTime" DATETIME,
        "content" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Article_accountId_publishTime_idx" ON "Article"("accountId", "publishTime")`

    // 创建 Config 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Config" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Config_key_idx" ON "Config"("key")`

    // 创建 SchedulerLog 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SchedulerLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endTime" DATETIME,
        "status" TEXT NOT NULL,
        "accountCount" INTEGER NOT NULL,
        "accountNames" TEXT NOT NULL,
        "successCount" INTEGER NOT NULL DEFAULT 0,
        "failCount" INTEGER NOT NULL DEFAULT 0,
        "totalArticles" INTEGER NOT NULL DEFAULT 0,
        "errorMessage" TEXT,
        "duration" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SchedulerLog_startTime_idx" ON "SchedulerLog"("startTime")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SchedulerLog_status_idx" ON "SchedulerLog"("status")`

    console.log('[DatabaseInit] ✓ 数据库表结构创建完成')
  }

  /**
   * 初始化数据库
   * 主入口函数,在应用启动时调用
   */
  async initialize(): Promise<void> {
    const dbPath = this.getDbPath()
    console.log('[DatabaseInit] 数据库路径:', dbPath)

    // 检查数据库文件是否存在
    const dbExists = fs.existsSync(dbPath)

    if (!dbExists) {
      console.log('[DatabaseInit] 数据库文件不存在,将创建新数据库')
    }

    // 创建 Prisma Client
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    })

    try {
      // 检查数据库是否已初始化
      const isInitialized = await this.isDatabaseInitialized(prisma)

      if (!isInitialized) {
        console.log('[DatabaseInit] 数据库未初始化,开始创建表结构')
        await this.createTables(prisma)
        console.log('[DatabaseInit] ✓ 数据库初始化完成')
      } else {
        console.log('[DatabaseInit] 数据库已存在,跳过初始化')
      }
    } catch (error) {
      console.error('[DatabaseInit] 数据库初始化失败:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }
}
