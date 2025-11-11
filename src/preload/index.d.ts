import { ElectronAPI } from '@electron-toolkit/preload'

export interface LoginStatus {
  isValid: boolean
  expiresIn?: number
  expiresAt?: string
}

export interface UserInfo {
  nickName: string
  avatar: string
  uin: string
  userName: string
  cookie?: string
  createdAt?: string
}

export interface LoginData {
  token: string
  cookie: string
  timestamp: number
  expiresAt?: string
  userInfo?: UserInfo
}

export type ApiResponse<T = unknown> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }

// 数据类型定义
export interface Account {
  id: string
  name: string
  platform: string
  accountId?: string
  createdAt: string
  updatedAt?: string
  articleCount?: number
  accountTags?: Array<{
    id: string
    accountId: string
    tagId: string
    createdAt: string
    tag: {
      id: string
      name: string
      createdAt: string
    }
  }>
  _count?: {
    articles: number
  }
}

export interface Tag {
  id: string
  name: string
  createdAt: string
  _count?: {
    accountTags: number
  }
}

export interface Article {
  id: string
  accountId: string
  accountName?: string
  title: string
  url: string
  publishTime: string | Date | null
  publishTimestamp?: number
  content?: string | null
  summary?: string
  digest?: string
  media?: string
  createdAt: string | Date
  updatedAt?: string | Date
}

export interface Statistics {
  totalArticles: number
  totalAccounts: number
  todayArticles: number
  weekArticles: number
  monthArticles: number
}

export interface TrendData {
  date: string
  count: number
}

export interface ArticleListResult {
  items: Article[]
  total: number
  page: number
  pageSize: number
}

export interface ScrapeResult {
  success: boolean
  results: Array<{
    name: string
    success: boolean
    error?: string
    articleCount?: number
  }>
}

export interface SchedulerLog {
  id: string
  startTime: string
  endTime: string | null
  status: string
  accountCount: number
  accountNames: string[]
  successCount: number
  failCount: number
  totalArticles: number
  errorMessage: string | null
  duration: number | null
}

interface API {
  login: {
    checkStatus: () => Promise<ApiResponse<LoginStatus>>
    start: () => Promise<ApiResponse<LoginData>>
    logout: () => Promise<ApiResponse<void>>
    refresh: () => Promise<ApiResponse<LoginData>>
    onStatusChange: (callback: (status: string) => void) => () => void
  }
  config: {
    get: <T = unknown>(key: string) => Promise<T>
    set: <T = unknown>(key: string, value: T, description?: string) => Promise<T>
    delete: (key: string) => Promise<boolean>
    getAll: () => Promise<Record<string, unknown>>
  }
  dialog: {
    selectFolder: (defaultPath?: string) => Promise<string | null>
  }
  account: {
    add: (names: string[]) => Promise<ApiResponse<Account[]>>
    list: () => Promise<ApiResponse<Account[]>>
    delete: (id: string) => Promise<ApiResponse<void>>
    deleteMany: (ids: string[]) => Promise<ApiResponse<void>>
    addTag: (accountId: string, tagId: string) => Promise<ApiResponse<void>>
    removeTag: (accountId: string, tagId: string) => Promise<ApiResponse<void>>
    addTagsToAccounts: (accountIds: string[], tagIds: string[]) => Promise<ApiResponse<void>>
    removeTagsFromAccounts: (accountIds: string[], tagIds: string[]) => Promise<ApiResponse<void>>
  }
  tag: {
    list: () => Promise<ApiResponse<Tag[]>>
    create: (name: string) => Promise<ApiResponse<Tag>>
    update: (id: string, name: string) => Promise<ApiResponse<Tag>>
    delete: (id: string) => Promise<ApiResponse<void>>
    deleteMany: (ids: string[]) => Promise<ApiResponse<void>>
  }
  article: {
    list: (params: {
      page?: number
      pageSize?: number
      search?: string
      accountId?: string
    }) => Promise<ApiResponse<ArticleListResult>>
    get: (id: string) => Promise<ApiResponse<Article>>
    delete: (id: string) => Promise<ApiResponse<void>>
    deleteMany: (ids: string[]) => Promise<ApiResponse<void>>
    deleteByAccount: (accountId: string) => Promise<ApiResponse<void>>
    stats: () => Promise<ApiResponse<{ total: number; byAccount: Record<string, number> }>>
  }
  scraper: {
    start: (params: {
      accountNames: string[]
      rangeType: 'days' | 'count' | 'all'
      days?: number
      count?: number
    }) => Promise<ApiResponse<ScrapeResult>>
    stop: () => Promise<ApiResponse<void>>
    onLog: (callback: (data: { type: string; message: string }) => void) => () => void
    onProgress: (callback: (data: { current: number; total: number }) => void) => () => void
    onComplete: (callback: (data: ScrapeResult) => void) => () => void
  }
  dashboard: {
    getStatistics: () => Promise<ApiResponse<Statistics>>
    getTrend: (days: number) => Promise<ApiResponse<TrendData[]>>
    getRecentArticles: (limit: number) => Promise<ApiResponse<Article[]>>
    getTopAccounts: (limit: number) => Promise<ApiResponse<Array<{ name: string; count: number }>>>
  }
  scheduler: {
    start: () => Promise<ApiResponse<void>>
    stop: () => Promise<ApiResponse<void>>
    enableAutoLaunch: () => Promise<ApiResponse<void>>
    disableAutoLaunch: () => Promise<ApiResponse<void>>
    getStatus: () => Promise<
      ApiResponse<{
        enabled: boolean
        nextRunTime: string | null
      }>
    >
    cancelTask: () => Promise<ApiResponse<void>>
    getLogs: (params?: { limit?: number; offset?: number }) => Promise<ApiResponse<SchedulerLog[]>>
    getStats: () => Promise<
      ApiResponse<{
        totalTasks: number
        completedTasks: number
        failedTasks: number
        cancelledTasks: number
        successRate: string
      }>
    >
    onCountdown: (
      callback: (data: { countdown: number; accountNames: string[] }) => void
    ) => () => void
    onCancelled: (callback: () => void) => () => void
    onCountdownComplete: (callback: () => void) => () => void
  }
  theme: {
    setNativeTheme: (theme: 'dark' | 'light') => void
  }
  file: {
    downloadImages: (
      imageUrls: string[],
      articleTitle: string
    ) => Promise<
      ApiResponse<{
        total: number
        success: number
        failed: number
        folder: string
        results: Array<{ url: string; success: boolean; path?: string; error?: string }>
      }>
    >
    showInFolder: (folderPath: string) => Promise<ApiResponse<void>>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
