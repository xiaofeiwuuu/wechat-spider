# WeChat-spider-UI 集成指南

> 基于 Electron + Vue 3 + TypeScript + Ant Design Vue + Pinia

---

## ✅ 已完成的配置

### 1. 前端技术栈配置

#### 已安装依赖:
```json
{
  "dependencies": {
    "ant-design-vue": "4.2.6",      // UI 组件库
    "pinia": "3.0.4",                // 状态管理
    "vue-router": "4.6.3",           // 路由管理
    "dayjs": "1.11.19",              // 日期处理
    "@ant-design/icons-vue": "7.0.1" // 图标库
  }
}
```

#### 已配置模块:
- ✅ **Pinia 状态管理** - `src/renderer/src/stores/index.ts`
- ✅ **Vue Router 路由** - `src/renderer/src/router/index.ts`
- ✅ **Ant Design Vue UI** - `src/renderer/src/main.ts`

### 2. 后端技术栈配置

#### 已安装依赖:
```json
{
  "dependencies": {
    "@prisma/client": "6.19.0",  // ORM 数据库客户端
    "prisma": "6.19.0",          // Prisma CLI
    "axios": "1.13.2",           // HTTP 请求
    "cheerio": "1.1.2",          // HTML 解析
    "playwright": "1.56.1",      // 浏览器自动化
    "turndown": "7.2.2",         // HTML 转 Markdown
    "p-limit": "7.2.0",          // 并发控制
    "pino": "10.1.0",            // 日志库
    "fs-extra": "11.3.2",        // 文件系统增强
    "zod": "4.1.12"              // 类型验证
  }
}
```

#### 已完成集成:
- ✅ **复制后端代码** - `src/main/core/*` (来自 wechat-spider-node)
- ✅ **Prisma 配置** - `prisma/schema.prisma`
- ✅ **生成 Prisma Client** - `pnpm prisma generate`
- ✅ **环境变量** - `.env`

---

## 📁 项目结构

```
WeChat-spider-UI/
├── src/
│   ├── main/                     # Electron 主进程
│   │   ├── index.ts              # 主进程入口
│   │   ├── core/                 # 后端核心代码(来自 wechat-spider-node)
│   │   │   ├── wechat/           # 微信爬虫逻辑
│   │   │   ├── storage/          # 存储逻辑
│   │   │   ├── media/            # 媒体下载
│   │   │   ├── config/           # 配置管理
│   │   │   ├── logger/           # 日志
│   │   │   └── types/            # 类型定义
│   │   ├── services/             # Service 层(待实现)
│   │   └── ipc/                  # IPC 处理器(待实现)
│   │
│   ├── preload/                  # 预加载脚本
│   │   ├── index.ts              # IPC API 暴露
│   │   └── index.d.ts            # TypeScript 类型定义
│   │
│   └── renderer/                 # 渲染进程 (Vue 3 应用)
│       └── src/
│           ├── main.ts           # Vue 应用入口
│           ├── App.vue           # 根组件(带侧边栏布局)
│           ├── router/           # 路由配置
│           │   └── index.ts
│           ├── stores/           # Pinia 状态管理
│           │   └── index.ts
│           ├── views/            # 页面组件
│           │   ├── Dashboard.vue     # 仪表盘
│           │   ├── Login.vue         # 登录页
│           │   ├── Scraper.vue       # 爬取任务
│           │   ├── Articles.vue      # 文章管理
│           │   └── Settings.vue      # 设置页
│           ├── components/       # 通用组件
│           ├── api/              # IPC 调用封装(待实现)
│           └── types/            # 前端类型定义(待实现)
│
├── prisma/                       # Prisma 数据库
│   ├── schema.prisma             # 数据库模型
│   └── migrations/               # 迁移文件
│
├── .env                          # 环境变量
├── package.json                  # 项目配置
└── electron.vite.config.ts       # Electron Vite 配置
```

---

## 🎨 UI 界面设计

### 布局结构:
```
┌────────────────────────────────────────────┐
│  侧边栏导航  │  主内容区域                  │
│  - 仪表盘   │  ┌────────────────────────┐  │
│  - 登录     │  │                        │  │
│  - 爬取任务  │  │   Router View          │  │
│  - 文章管理  │  │   (页面内容)            │  │
│  - 设置     │  │                        │  │
│             │  └────────────────────────┘  │
└────────────────────────────────────────────┘
```

### 已实现页面:
1. **Dashboard.vue** - 仪表盘
   - 简单卡片展示
   - 待实现:统计数据、趋势图

2. **Login.vue** - 登录页
   - 登录状态显示
   - 扫码登录按钮
   - 待实现:与主进程 IPC 通信

3. **Scraper.vue** - 爬取任务
   - 表单输入(公众号名称、爬取范围)
   - 存储选项
   - 待实现:任务提交、进度显示

4. **Articles.vue** - 文章管理
   - 表格列表
   - 搜索功能
   - 待实现:数据加载、详情查看

5. **Settings.vue** - 设置页
   - Tab 分页(存储设置、爬取设置)
   - 表单配置
   - 待实现:保存配置到主进程

---

## 🚀 下一步待实现

### Phase 1: Service 层实现(优先级:高)

创建 `src/main/services/` 目录,封装业务逻辑:

```typescript
// src/main/services/ScraperService.ts
import { WeChatScraper } from '../core/wechat/scraper'
import { StorageRouter } from '../core/storage'

export class ScraperService {
  async scrapeAccount(accountName: string, options: any) {
    const scraper = new WeChatScraper()
    const articles = await scraper.scrapeAccount(accountName, options)

    const storage = new StorageRouter()
    await storage.saveArticles(articles)

    return articles
  }
}
```

**需要创建的 Service:**
- `ScraperService.ts` - 爬取业务
- `LoginService.ts` - 登录管理
- `ArticleService.ts` - 文章查询
- `ConfigService.ts` - 配置管理

### Phase 2: IPC 通信实现(优先级:高)

#### 1. 主进程注册 IPC Handler

```typescript
// src/main/ipc/scraper.ts
import { ipcMain } from 'electron'
import { ScraperService } from '../services/ScraperService'

export function registerScraperIPC() {
  const service = new ScraperService()

  ipcMain.handle('scraper:scrape-account', async (_, accountName, options) => {
    return await service.scrapeAccount(accountName, options)
  })

  ipcMain.handle('scraper:get-progress', async () => {
    return await service.getProgress()
  })
}
```

#### 2. 预加载脚本暴露 API

```typescript
// src/preload/index.ts
const api = {
  scraper: {
    scrapeAccount: (name: string, options: any) =>
      ipcRenderer.invoke('scraper:scrape-account', name, options),
    getProgress: () =>
      ipcRenderer.invoke('scraper:get-progress'),
    onProgress: (callback: (progress: any) => void) =>
      ipcRenderer.on('scraper:progress', (_, progress) => callback(progress))
  }
}

contextBridge.exposeInMainWorld('api', api)
```

#### 3. 渲染进程调用

```typescript
// src/renderer/src/api/scraper.ts
export const scraperApi = {
  async scrapeAccount(accountName: string, options: any) {
    return await window.api.scraper.scrapeAccount(accountName, options)
  },

  onProgress(callback: (progress: any) => void) {
    window.api.scraper.onProgress(callback)
  }
}
```

#### 4. Vue 组件使用

```vue
<script setup lang="ts">
import { scraperApi } from '@/api/scraper'

const handleScrape = async () => {
  // 监听进度
  scraperApi.onProgress((progress) => {
    console.log('Progress:', progress)
  })

  // 开始爬取
  const result = await scraperApi.scrapeAccount(accountName, options)
  console.log('Result:', result)
}
</script>
```

### Phase 3: Pinia Store 实现(优先级:中)

```typescript
// src/renderer/src/stores/scraper.ts
import { defineStore } from 'pinia'
import { scraperApi } from '@/api/scraper'

export const useScraperStore = defineStore('scraper', {
  state: () => ({
    tasks: [],
    progress: null
  }),

  actions: {
    async scrapeAccount(name: string, options: any) {
      const result = await scraperApi.scrapeAccount(name, options)
      this.tasks.push(result)
      return result
    }
  }
})
```

### Phase 4: 类型定义完善(优先级:中)

```typescript
// src/renderer/src/types/index.ts
export interface ScrapeOptions {
  rangeType: 'days' | 'count' | 'all'
  days?: number
  count?: number
  storage: ('local' | 'database')[]
}

export interface Article {
  id: string
  title: string
  url: string
  accountName: string
  publishTime: string
  content?: string
}

export interface ScrapeProgress {
  status: 'searching' | 'fetching' | 'saving' | 'completed'
  current: number
  total: number
  currentArticle?: string
}
```

---

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm prisma generate

# 初始化数据库
pnpm prisma db push

# 开发模式
pnpm dev

# 构建应用
pnpm build

# TypeScript 类型检查
pnpm type-check
```

---

## 📝 重要注意事项

### 1. 路径问题

Electron 应用中,主进程和渲染进程的路径不同:

- **开发环境:**
  - 渲染进程: `http://localhost:5173`
  - 主进程: `src/main/`

- **生产环境:**
  - 渲染进程: `file://dist/renderer/index.html`
  - 主进程: `dist/main/`

### 2. 数据库路径

建议使用 Electron 的用户数据目录:

```typescript
import { app } from 'electron'
import path from 'path'

const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'wechat-spider.db')

// 更新 .env
process.env.DATABASE_URL = `file:${dbPath}`
```

### 3. 安全性

- ✅ 已使用 `contextBridge` 安全暴露 API
- ⚠️ 当前 `sandbox: false`,建议后续改为 `true`
- ⚠️ 敏感数据(token、cookie)应使用 `safeStorage` 加密

### 4. 性能优化

- 长时间任务使用 Worker 线程
- 大列表使用虚拟滚动(`a-table-v2`)
- 路由懒加载(已实现)

---

## 🐛 已知问题

1. **IPC 类型定义不完整**
   - 需要完善 `src/preload/index.d.ts`
   - 添加 `window.api` 的全局类型声明

2. **错误处理不统一**
   - Service 层需要统一错误类型
   - IPC 调用需要错误边界

3. **日志系统未集成**
   - `pino` 已安装但未配置
   - 需要区分主进程和渲染进程日志

---

## 📚 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Ant Design Vue](https://antdv.com/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Prisma 文档](https://www.prisma.io/docs)

---

**文档版本:** v1.0
**最后更新:** 2024-01-15
**状态:** 基础架构已完成,待实现业务逻辑
