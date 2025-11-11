import type { Statistics, TrendData, Article } from '../../../preload/index.d'

/**
 * 获取统计数据
 */
export async function getStatistics(): Promise<Statistics> {
  const result = await window.api.dashboard.getStatistics()
  if (result.success && result.data) {
    return result.data
  }
  throw new Error(result.error || '获取统计数据失败')
}

/**
 * 获取趋势数据(最近7天)
 */
export async function getTrendData(days: number = 7): Promise<TrendData[]> {
  const result = await window.api.dashboard.getTrend(days)
  if (result.success && result.data) {
    return result.data
  }
  throw new Error(result.error || '获取趋势数据失败')
}

/**
 * 获取最近文章
 */
export async function getRecentArticles(limit: number = 10): Promise<Article[]> {
  const result = await window.api.dashboard.getRecentArticles(limit)
  if (result.success && result.data) {
    return result.data
  }
  throw new Error(result.error || '获取最近文章失败')
}

/**
 * 获取热门公众号 Top 10
 */
export async function getTopAccounts(
  limit: number = 10
): Promise<Array<{ name: string; count: number }>> {
  const result = await window.api.dashboard.getTopAccounts(limit)
  if (result.success && result.data) {
    return result.data
  }
  throw new Error(result.error || '获取热门公众号失败')
}
