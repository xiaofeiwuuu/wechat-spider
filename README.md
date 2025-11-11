# WeChat Spider UI

一个基于 Electron + Vue 3 + TypeScript 的微信公众号文章爬虫工具,现在 main 分支是 GUI 图形化界面操作, cli 分支是命令行和终端交互式，cli 分支代码初期没写好，后期不想维护，所以重新改了一版 GUI 版本的，后续维护 main 分支代码，不再维护 cli 分支代码。

## 功能特性

- 🚀 微信公众号文章批量爬取
- 📊 数据统计和可视化
- 🏷️ 公众号标签管理
- ⏰ 定时任务调度
- 🎨 深色/浅色主题切换
- 💾 本地 SQLite 数据库存储

## 技术栈

- **前端**: Vue 3 + TypeScript + Element Plus
- **桌面端**: Electron
- **数据库**: SQLite + Prisma ORM
- **爬虫**: Playwright
- **构建工具**: Electron-Vite

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/xiaofeiwuuu/wechat-spider.git
cd wechat-spider
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install
```

### 3. 初始化数据库

数据库会在首次运行时自动创建:

**注意**: 需要系统安装 `sqlite3` 命令行工具:
- macOS: `brew install sqlite3` (通常已预装)
- Linux: `apt-get install sqlite3` 或 `yum install sqlite`
- Windows: 从 [SQLite 官网](https://www.sqlite.org/download.html) 下载

### 4. 配置环境变量

复制 `.env.example` 为 `.env` (如果有),或确保 `.env` 文件包含必要配置:

```env
# 数据库配置
DATABASE_URL="file:./data/wechat.db"

# 应用配置
VITE_APP_TITLE="TINYWUYOU"
```

### 5. 启动开发环境

```bash
pnpm dev
```

## 数据库说明

项目使用 Prisma + SQLite:

- **Schema 文件**: `prisma/schema.prisma` - 数据库表结构定义
- **初始化脚本**: `prisma/init.sql` - 数据库创建脚本
- **数据库位置**: 应用用户数据目录下的 `data/wechat.db`

### 数据库表结构

- `User` - 登录用户信息
- `Account` - 公众号账号列表
- `Tag` - 标签管理
- `AccountTag` - 公众号-标签关联
- `Article` - 爬取的文章
- `Config` - 系统配置
- `SchedulerLog` - 定时任务执行记录


## 开发指南

### 推荐 IDE 设置

- [VSCode](https://code.visualstudio.com/)
- 插件:
  - ESLint
  - Prettier
  - Volar
  - Prisma

### 项目结构

```
WeChat-spider-UI/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts    # 主进程入口
│   │   └── ipc/        # IPC 通信
│   ├── preload/        # 预加载脚本
│   └── renderer/       # 渲染进程 (Vue)
│       ├── src/
│       │   ├── views/  # 页面组件
│       │   ├── stores/ # Pinia 状态管理
│       │   └── api/    # API 接口
│       └── index.html
├── prisma/
│   ├── schema.prisma   # 数据库 Schema
│   └── init.sql        # 数据库初始化脚本
├── scripts/
│   └── init-db.js      # 数据库初始化脚本
├── .env                # 环境变量
└── package.json
```

## 许可证

MIT
