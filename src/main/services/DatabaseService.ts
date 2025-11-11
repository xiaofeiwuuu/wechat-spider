import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

// 获取数据库路径(延迟初始化)
function getDbPath(): string {
  let dbDir: string
  let dbPath: string

  if (is.dev) {
    // 开发环境: 使用项目根目录下的 data 文件夹
    // __dirname 在开发环境指向 out/main,需要回到项目根目录
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
