import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'progress'
  title: string
  message: string
  progress?: number // 0-100
  timestamp: number
  read: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  // 未读通知数量
  const unreadCount = computed(() => {
    return notifications.value.filter((n) => !n.read).length
  })

  // 添加通知
  function addNotification(
    type: Notification['type'],
    title: string,
    message: string,
    progress?: number
  ): string {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      progress,
      timestamp: Date.now(),
      read: false
    }
    notifications.value.unshift(notification)

    // 自动清理过多的通知(保留最近100条)
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }

    return notification.id
  }

  // 更新通知(主要用于更新进度)
  function updateNotification(id: string, updates: Partial<Notification>): void {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value[index] = {
        ...notifications.value[index],
        ...updates
      }
    }
  }

  // 标记为已读
  function markAsRead(id: string): void {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  // 标记全部为已读
  function markAllAsRead(): void {
    notifications.value.forEach((n) => {
      n.read = true
    })
  }

  // 删除通知
  function removeNotification(id: string): void {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 清空所有通知
  function clearAll(): void {
    notifications.value = []
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    updateNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  }
})
