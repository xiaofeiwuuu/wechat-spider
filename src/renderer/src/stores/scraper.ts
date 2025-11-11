import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Log {
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export const useScraperStore = defineStore('scraper', () => {
  // 爬取状态
  const scraping = ref(false)
  const isStopped = ref(false)
  const logs = ref<Log[]>([])

  // 进度状态
  const progress = ref({
    current: 0,
    total: 0
  })

  // 设置爬取状态
  function setScraping(value: boolean): void {
    scraping.value = value
  }

  // 设置停止标志
  function setIsStopped(value: boolean): void {
    isStopped.value = value
  }

  // 添加日志
  function addLog(type: Log['type'], message: string): void {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

    logs.value.push({
      time,
      type,
      message
    })
  }

  // 清空日志
  function clearLogs(): void {
    logs.value = []
  }

  // 设置进度
  function setProgress(current: number, total: number): void {
    progress.value.current = current
    progress.value.total = total
  }

  // 重置进度
  function resetProgress(): void {
    progress.value.current = 0
    progress.value.total = 0
  }

  // 重置所有状态
  function reset(): void {
    scraping.value = false
    isStopped.value = false
    progress.value.current = 0
    progress.value.total = 0
  }

  return {
    scraping,
    isStopped,
    logs,
    progress,
    setScraping,
    setIsStopped,
    addLog,
    clearLogs,
    setProgress,
    resetProgress,
    reset
  }
})
