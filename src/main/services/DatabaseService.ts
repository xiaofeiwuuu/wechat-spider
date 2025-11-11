import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

// 获取数据库路径(延迟初始化)
function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')
  const dbPath = path.join(dbDir, 'wechat.db')

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
    console.log('初始化 Prisma Client,数据库路径:', dbPath)

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

// 使用 Proxy 延迟初始化
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrisma()
    const value = instance[prop as keyof PrismaClient]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  }
})

process.on('beforeExit', async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
  }
})
