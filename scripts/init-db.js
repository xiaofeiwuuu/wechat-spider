#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 读取 prisma/init.sql 并执行,创建所有表
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '..')
const sqlFile = path.join(projectRoot, 'prisma', 'init.sql')

// 从 .env 文件读取数据库路径
require('dotenv').config({ path: path.join(projectRoot, '.env') })

const databaseUrl = process.env.DATABASE_URL || 'file:./data/wechat.db'

// 提取数据库文件路径
const dbPath = databaseUrl.replace('file:', '')
const absoluteDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(projectRoot, dbPath)

console.log('📦 开始初始化数据库...')
console.log('📍 数据库路径:', absoluteDbPath)

// 确保数据库目录存在
const dbDir = path.dirname(absoluteDbPath)
if (!fs.existsSync(dbDir)) {
  console.log('📁 创建数据库目录:', dbDir)
  fs.mkdirSync(dbDir, { recursive: true })
}

// 检查 init.sql 文件是否存在
if (!fs.existsSync(sqlFile)) {
  console.error('❌ 错误: prisma/init.sql 文件不存在')
  process.exit(1)
}

// 读取 SQL 文件
const sql = fs.readFileSync(sqlFile, 'utf8')

console.log('📄 读取 SQL 文件:', sqlFile)

// 使用 sqlite3 执行 SQL
try {
  // 检查是否安装了 sqlite3
  try {
    execSync('sqlite3 --version', { stdio: 'ignore' })
  } catch (error) {
    console.error('❌ 错误: 未安装 sqlite3 命令行工具')
    console.error('请安装 sqlite3:')
    console.error('  macOS: brew install sqlite3')
    console.error('  Linux: apt-get install sqlite3 或 yum install sqlite')
    console.error('  Windows: 从 https://www.sqlite.org/download.html 下载')
    process.exit(1)
  }

  // 执行 SQL
  execSync(`sqlite3 "${absoluteDbPath}" < "${sqlFile}"`, {
    stdio: 'inherit',
    cwd: projectRoot
  })

  console.log('✅ 数据库初始化成功!')
  console.log('📊 所有表已创建')

} catch (error) {
  console.error('❌ 数据库初始化失败:', error.message)
  process.exit(1)
}
