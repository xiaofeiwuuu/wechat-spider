/**
 * 文章接口
 */
export interface Article {
  id: string
  accountId: string
  accountName: string
  title: string
  url: string
  publishTime: string
  publishTimestamp: number
  content?: string
  summary?: string
  digest?: string
  media?: string
  createdAt: string
  updatedAt: string
}

/**
 * 公众号接口
 */
export interface Account {
  id: string
  name: string
  platform: string
  accountId?: string
  createdAt: string
  updatedAt: string
  articleCount?: number
}

/**
 * 统计数据接口
 */
export interface Statistics {
  totalArticles: number
  totalAccounts: number
  todayArticles: number
  weekArticles: number
  monthArticles: number
}

/**
 * 趋势数据接口
 */
export interface TrendData {
  date: string
  count: number
}

/**
 * 爬取选项接口
 */
export interface ScrapeOptions {
  rangeType: 'days' | 'count' | 'pages' | 'dateRange' | 'all'
  days?: number
  count?: number
  pages?: number
  startDate?: string
  endDate?: string
  storage: ('local' | 'database')[]
  downloadMedia?: boolean
  skipExisting?: boolean
}

/**
 * 爬取进度接口
 */
export interface ScrapeProgress {
  taskId: string
  accountName: string
  status: 'searching' | 'fetching' | 'parsing' | 'saving' | 'completed' | 'error'
  current: number
  total: number
  currentArticle?: string
  error?: string
}

/**
 * 任务接口
 */
export interface Task {
  id: string
  accountName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  total: number
  createdAt: string
  completedAt?: string
  error?: string
}

/**
 * 配置接口
 */
export interface AppConfig {
  storage: {
    mode: 'local' | 'database' | 'both'
    local: {
      baseDir: string
      downloadMedia: boolean
      saveAs: 'markdown' | 'html'
    }
  }
  scraper: {
    requestInterval: number
    maxPages: number
    days: number
  }
  media: {
    download: {
      concurrent: number
    }
  }
}

/**
 * 文章过滤条件
 */
export interface ArticleFilters {
  accountName?: string
  startDate?: string
  endDate?: string
  keyword?: string
  page?: number
  pageSize?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
