import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Statistics, TrendData, Article } from '../../../preload/index.d'
import { getStatistics, getTrendData, getRecentArticles, getTopAccounts } from '../api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const statistics = ref<Statistics>({
    totalArticles: 0,
    totalAccounts: 0,
    todayArticles: 0,
    weekArticles: 0,
    monthArticles: 0
  })

  const trendData = ref<TrendData[]>([])
  const recentArticles = ref<Article[]>([])
  const topAccounts = ref<Array<{ name: string; count: number }>>([])
  const isLoading = ref(false)

  // Actions
  async function fetchStatistics(): Promise<void> {
    try {
      isLoading.value = true
      statistics.value = await getStatistics()
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTrendData(days: number = 7): Promise<void> {
    try {
      trendData.value = await getTrendData(days)
    } catch (error) {
      console.error('Failed to fetch trend data:', error)
    }
  }

  async function fetchRecentArticles(limit: number = 10): Promise<void> {
    try {
      recentArticles.value = await getRecentArticles(limit)
    } catch (error) {
      console.error('Failed to fetch recent articles:', error)
    }
  }

  async function fetchTopAccounts(limit: number = 10): Promise<void> {
    try {
      topAccounts.value = await getTopAccounts(limit)
    } catch (error) {
      console.error('Failed to fetch top accounts:', error)
    }
  }

  async function refreshAll(): Promise<void> {
    await Promise.all([
      fetchStatistics(),
      fetchTrendData(),
      fetchRecentArticles(),
      fetchTopAccounts()
    ])
  }

  return {
    statistics,
    trendData,
    recentArticles,
    topAccounts,
    isLoading,
    fetchStatistics,
    fetchTrendData,
    fetchRecentArticles,
    fetchTopAccounts,
    refreshAll
  }
})
