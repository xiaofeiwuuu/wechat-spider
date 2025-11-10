# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

微信公众号爬虫 Node.js 版本 - 基于 TypeScript 的自动化爬虫工具,支持交互式菜单和双存储模式。

**核心定位**: 零门槛使用,优先推荐 `pnpm dev` 交互式菜单,而非命令行参数。

## Essential Commands

### Daily Development
```bash
# 启动交互式菜单 (最常用)
pnpm dev

# 开发模式运行特定命令
pnpm dev scrape "公众号名" -d 30
pnpm dev batch

# 数据库可视化管理
pnpm db:studio

# 类型检查
pnpm type-check

# 构建项目
pnpm build
```

### Database Operations
```bash
# 生成 Prisma Client (修改 schema 后必须运行)
pnpm db:generate

# 应用数据库迁移
pnpm db:push

# 打开数据库 Web UI
pnpm db:studio
```

### Testing & Development
```bash
# 直接运行 TypeScript 文件 (开发调试)
tsx src/cli/index.ts [command]

# 快捷登录命令
pnpm spider:login
```

## Architecture

### Core Design Pattern

项目采用**分层架构**,各层职责清晰:

```
CLI Layer (交互式菜单/命令行)
    ↓
Scraper Layer (爬取编排和业务逻辑)
    ↓
API Layer (微信 API 封装)
    ↓
Storage Layer (本地文件/数据库存储路由)
    ↓
Media Layer (图片/视频下载)
```

### Key Modules

#### 1. CLI System (`src/cli/`)
- **`index.ts`** - Commander CLI 框架,定义所有命令
- **`interactive.ts`** - Inquirer 交互式菜单 (主推荐模式)
- **`init.ts`** - 配置向导,引导式生成 config.json

**重要**: 新增 CLI 命令需同步更新交互式菜单选项。

#### 2. WeChat Core (`src/wechat/`)
- **`login.ts`** - Playwright 浏览器自动化登录,缓存 token/cookie (96小时)
- **`scraper.ts`** - 爬取流程编排,处理分页、过滤、限制逻辑
- **`api.ts`** - 封装 3 个微信 API: searchAccount / getArticlesList / getArticleContent
- **`parser.ts`** - Cheerio 解析 HTML + Turndown 转换 Markdown

**关键点**:
- 登录使用轮询检测 URL 变化(200ms 间隔)
- 文章列表 API 每页固定返回 5 篇
- 日期过滤优先级高于数量限制

#### 3. Storage Layer (`src/storage/`)
- **`index.ts`** - 路由器,根据 config.storage.mode 调度存储方式
- **`local.ts`** - 本地文件系统存储,支持 Markdown/HTML 格式
- **`database.ts`** - Prisma ORM 数据库存储 (SQLite/MySQL)
- **`export.ts`** - CSV 导出功能

**存储模式**:
- `local`: 仅本地文件 (output/)
- `database`: 仅数据库 (data/wechat.db)
- `both`: 双写模式

#### 4. Configuration (`src/config/`)
- **`schema.ts`** - Zod 验证模式,定义所有配置项和默认值
- **`index.ts`** - 加载 config.json (支持 JSON5 注释),带缓存机制

**配置优先级**: CLI 参数 > config.json > schema 默认值

### Data Flow

典型的爬取流程:

```
用户 → CLI/Interactive Menu
  ↓
WeChatScraper.scrapeAccount()
  ├─ 检查登录缓存 (wechat_cache.json)
  ├─ 搜索公众号 → 获取 fakeid
  ├─ 分页获取文章列表 (每页5篇)
  │   └─ 应用日期/数量过滤
  ├─ 逐篇获取完整内容
  └─ 解析 HTML (Cheerio → Turndown)
      ↓
Storage Router
  ├─ Local: 创建文件夹 → 保存 MD/HTML → 下载媒体
  └─ Database: Upsert Account → Upsert Article → 可选下载媒体
```

### Database Schema

Prisma ORM + SQLite (可扩展 MySQL/PostgreSQL)

```prisma
model Account {
  id        String    @id @default(cuid())
  name      String
  platform  String    @default("wechat")
  articles  Article[]
  @@unique([name, platform])
}

model Article {
  id               String    @id @default(cuid())
  accountId        String
  title            String
  url              String    @unique  # 唯一键,防重复
  publishTime      DateTime?
  content          String?   # HTML 或 Markdown
  media            String?   # JSON: {images: [], videos: []}
  @@index([accountId, publishTime])
}
```

**重要**: Article.url 作为唯一键,用于去重和更新。

## Configuration System

### config.json (JSON5 格式,支持注释)

核心配置项:

```json5
{
  "storage": {
    "mode": "local" | "database" | "both",
    "local": {
      "baseDir": "./output",
      "folderNameTemplate": "{title}_{date}",  // 支持变量
      "saveAs": "markdown" | "html",
      "downloadMedia": true
    },
    "database": {
      "type": "sqlite" | "mysql",
      "downloadMedia": false  // 可选:下载媒体到 data/media/
    }
  },
  "scraper": {
    "requestInterval": 10,  // 请求间隔(秒)
    "maxPages": 10,         // 最大页数
    "days": 30              // 默认爬取天数
  },
  "batch": {
    "accounts": ["公众号1", "公众号2"],
    "accountInterval": 10
  }
}
```

### .env

仅用于**环境变量和敏感信息**,配置请使用 config.json:

```bash
DATABASE_URL="file:./data/wechat.db"
WECHAT_CACHE_FILE="wechat_cache.json"
WECHAT_CACHE_EXPIRE_HOURS=96
LOG_LEVEL="info"  # debug | info | warn | error
```

## Important Technical Details

### 1. 登录缓存机制

- 文件: `wechat_cache.json`
- 有效期: 96 小时 (可配置)
- 包含: token, cookie, timestamp
- **避免频繁登录导致账号异常**

### 2. 请求间隔控制

- 默认 10 秒间隔 (config.scraper.requestInterval)
- 批量爬取时账号间隔独立配置
- **防止触发微信反爬限制**

### 3. 文章去重逻辑

- 数据库模式: 基于 Article.url 唯一键自动去重
- 本地文件模式: 检查文件夹是否存在
- 可通过 `--skip-existing` 跳过已存在文章

### 4. 媒体下载并发控制

使用 `p-limit` 控制并发数 (config.media.download.concurrent):
```typescript
const limit = pLimit(config.media.download.concurrent); // 默认 5
await Promise.all(mediaList.map(url => limit(() => downloadFile(url))));
```

### 5. Prisma Client 生成

**重要**: 修改 `prisma/schema.prisma` 后必须运行:
```bash
pnpm db:generate  # 生成 TypeScript 类型
pnpm db:push      # 应用到数据库
```

### 6. TypeScript 路径解析

项目使用 `moduleResolution: "bundler"`:
- 支持 `.ts` 扩展名导入
- ESM 模式
- 构建工具: tsup (单文件输出)

## Common Development Tasks

### 添加新的 CLI 命令

1. 在 `src/cli/index.ts` 添加 Commander 命令定义
2. 在 `src/cli/interactive.ts` 添加菜单选项
3. 更新 README.md 文档

### 添加新的存储模式

1. 在 `src/storage/` 创建新模块
2. 在 `src/storage/index.ts` 添加路由逻辑
3. 更新 `src/config/schema.ts` 添加配置选项

### 修改数据库模型

1. 编辑 `prisma/schema.prisma`
2. 运行 `pnpm db:generate`
3. 运行 `pnpm db:push`
4. 更新相关 TypeScript 类型

### 调试爬取问题

1. 设置 `LOG_LEVEL=debug` in `.env`
2. 查看 `logs/spider.log` 完整日志
3. 使用 `pnpm db:studio` 检查数据库数据
4. 检查 `wechat_cache.json` 登录状态

## Code Style & Conventions

### 命名规范
- 文件名: kebab-case (例: `local-storage.ts`)
- 类名: PascalCase (例: `WeChatScraper`)
- 函数/变量: camelCase (例: `scrapeAccount`)
- 常量: UPPER_SNAKE_CASE (例: `MAX_RETRIES`)

### 日志规范
```typescript
logger.info('用户友好的信息');       // 正常流程
logger.warn('潜在问题警告');         // 警告
logger.error('错误信息', error);     // 错误
logger.debug('详细调试信息');        // 调试
```

### 错误处理
```typescript
try {
  // 操作
} catch (error) {
  logger.error('操作失败', error);
  throw new Error('用户友好的错误信息');
}
```

## Project-Specific Notes

### 1. 用户体验优先原则

项目设计理念是**零门槛**,优先推荐交互式菜单:
- 新手用户: `pnpm dev` → 交互式菜单
- 熟练用户: CLI 命令参数
- 自动化场景: 批量模式 + cron

### 2. 双存储模式设计思想

- **本地文件**: 离线归档、方便分享、易于阅读
- **数据库**: 高效查询、去重、统计分析
- **双模式**: 适合重要内容的完整备份

### 3. 微信 API 限制

- 搜索 API 最多返回 10 个结果
- 文章列表 API 每页固定 5 篇
- 内容 API 有频率限制 (通过 requestInterval 控制)
- **登录 token 有效期约 4 天**

### 4. 文件夹命名模板

支持的变量:
- `{title}`: 文章标题
- `{date}`: 发布日期 (YYYY-MM-DD)
- `{account}`: 公众号名称

默认: `({title})` (会自动清理特殊字符)

### 5. 特殊配置说明

**sanitizeFolderName**: 清理文件夹名中的特殊字符
- 替换: `/ \ : * ? " < > |` → `_`
- 去除 emoji 和非法字符
- 截断过长文件名 (最多 100 字符)

**skipExisting**: 跳过已存在的文章
- 本地模式: 检查文件夹
- 数据库模式: 查询 Article 表
- **注意**: 会增加查询开销

## Troubleshooting

### 登录失败
1. 删除 `wechat_cache.json`
2. 运行 `pnpm spider:login`
3. 检查网络连接和微信账号状态

### 数据库错误
```bash
# 重新生成数据库
rm -rf data/wechat.db
pnpm db:push
```

### Prisma Client 未找到
```bash
pnpm db:generate
```

### 编译错误
```bash
pnpm type-check  # 查看详细错误
```

### 媒体下载失败
- 检查网络连接
- 增加 `config.media.download.timeout`
- 增加 `config.media.download.retryTimes`
- 减少 `config.media.download.concurrent`

## Technology Stack

- **Runtime**: Node.js 22+ (ESM)
- **Language**: TypeScript 5.3+
- **Package Manager**: pnpm
- **CLI Framework**: Commander.js
- **Interactive Menu**: Inquirer
- **Browser Automation**: Playwright
- **ORM**: Prisma (SQLite/MySQL)
- **HTTP Client**: Axios
- **HTML Parser**: Cheerio
- **Markdown Converter**: Turndown
- **Logger**: Pino
- **Validation**: Zod
- **Concurrency**: p-limit
- **Build Tool**: tsup
