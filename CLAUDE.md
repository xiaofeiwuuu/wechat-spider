# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个微信公众号文章爬虫的桌面应用，基于 Electron + Vue 3 + TypeScript 构建，使用 Playwright 进行微信公众平台登录，Prisma + SQLite 进行数据持久化。

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 类型检查
pnpm typecheck              # 检查所有
pnpm typecheck:node         # 只检查主进程
pnpm typecheck:web          # 只检查渲染进程

# 代码格式化和检查
pnpm format                 # Prettier 格式化
pnpm lint                   # ESLint 检查

# 构建
pnpm build                  # 构建应用
pnpm build:mac              # 构建 macOS 应用
pnpm build:win              # 构建 Windows 应用

# Prisma 数据库
pnpm prisma generate        # 生成 Prisma Client（修改 schema 后执行）
pnpm prisma db push         # 同步数据库结构
pnpm prisma studio          # 打开数据库可视化界面
```

## 架构说明

### 三进程架构 (Electron)

```
src/
├── main/           # 主进程 (Node.js 环境)
│   ├── index.ts    # 应用入口，窗口创建，数据库初始化
│   ├── ipc/        # IPC 处理器注册 (每个功能模块独立文件)
│   └── services/   # 业务逻辑服务层
├── preload/        # 预加载脚本 (contextBridge 暴露 API)
│   └── index.ts    # 定义 window.api 对象，所有渲染进程可用的 IPC 方法
└── renderer/       # 渲染进程 (Vue 3 应用)
    └── src/
        ├── views/      # 页面组件
        ├── stores/     # Pinia 状态管理
        ├── api/        # 封装对 window.api 的调用
        └── router/     # Vue Router 路由配置
```

### IPC 通信模式

1. **主进程注册 handler**: `src/main/ipc/*.ts` 使用 `ipcMain.handle('channel:action', handler)`
2. **preload 暴露方法**: `src/preload/index.ts` 在 `api` 对象中封装 `ipcRenderer.invoke`
3. **渲染进程调用**: 通过 `window.api.module.method()` 调用

主要 IPC 模块：
- `login` - 登录管理（Playwright 扫码登录）
- `scraper` - 爬虫控制（启动/停止/进度）
- `account` - 公众号管理
- `article` - 文章管理
- `config` - 配置存储
- `scheduler` - 定时任务调度
- `dashboard` - 仪表盘统计数据

### 数据库模型 (Prisma + SQLite)

核心表：
- `User` - 登录用户（token/cookie/过期时间）
- `Account` - 公众号列表
- `Article` - 文章内容（Markdown 格式）
- `Tag` / `AccountTag` - 标签系统（多对多）
- `Config` - 应用配置（JSON 存储）
- `SchedulerLog` - 定时任务执行记录

数据库文件位置：
- 开发环境: `./data/wechat.db`
- 生产环境: `{userData}/data/wechat.db`

### 关键服务

- `LoginService` - 使用 Playwright 打开 Chrome 浏览器进行微信公众平台扫码登录，提取 token 和 cookie
- `ScraperService` - 调用微信公众平台 API 获取文章列表和内容，支持日期/数量范围筛选，使用 Turndown 转换 HTML 为 Markdown
- `SchedulerService` - 定时任务调度，支持开机自启

### 路径别名

- `@renderer` -> `src/renderer/src`（仅限渲染进程）
