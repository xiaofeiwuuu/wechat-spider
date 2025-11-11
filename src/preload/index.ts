import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 登录相关 API
  login: {
    checkStatus: () => ipcRenderer.invoke('login:check-status'),
    start: () => ipcRenderer.invoke('login:start'),
    logout: () => ipcRenderer.invoke('login:logout'),
    refresh: () => ipcRenderer.invoke('login:refresh'),
    onStatusChange: (callback: (status: string) => void) => {
      ipcRenderer.on('login:status-change', (_, status) => callback(status))
      return () => ipcRenderer.removeAllListeners('login:status-change')
    }
  },

  // 配置相关 API
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown, description?: string) =>
      ipcRenderer.invoke('config:set', key, value, description),
    delete: (key: string) => ipcRenderer.invoke('config:delete', key),
    getAll: () => ipcRenderer.invoke('config:getAll')
  },

  // 对话框 API
  dialog: {
    selectFolder: (defaultPath?: string) => ipcRenderer.invoke('dialog:selectFolder', defaultPath)
  },

  // 公众号管理 API
  account: {
    add: (names: string[]) => ipcRenderer.invoke('account:add', names),
    list: () => ipcRenderer.invoke('account:list'),
    delete: (id: string) => ipcRenderer.invoke('account:delete', id),
    deleteMany: (ids: string[]) => ipcRenderer.invoke('account:deleteMany', ids),
    addTag: (accountId: string, tagId: string) =>
      ipcRenderer.invoke('account:addTag', accountId, tagId),
    removeTag: (accountId: string, tagId: string) =>
      ipcRenderer.invoke('account:removeTag', accountId, tagId),
    addTagsToAccounts: (accountIds: string[], tagIds: string[]) =>
      ipcRenderer.invoke('account:addTagsToAccounts', accountIds, tagIds),
    removeTagsFromAccounts: (accountIds: string[], tagIds: string[]) =>
      ipcRenderer.invoke('account:removeTagsFromAccounts', accountIds, tagIds)
  },

  // 标签管理 API
  tag: {
    list: () => ipcRenderer.invoke('tag:list'),
    create: (name: string) => ipcRenderer.invoke('tag:create', name),
    update: (id: string, name: string) => ipcRenderer.invoke('tag:update', id, name),
    delete: (id: string) => ipcRenderer.invoke('tag:delete', id),
    deleteMany: (ids: string[]) => ipcRenderer.invoke('tag:deleteMany', ids)
  },

  // 文章管理 API
  article: {
    list: (params: { page?: number; pageSize?: number; search?: string; accountId?: string }) =>
      ipcRenderer.invoke('article:list', params),
    get: (id: string) => ipcRenderer.invoke('article:get', id),
    delete: (id: string) => ipcRenderer.invoke('article:delete', id),
    deleteMany: (ids: string[]) => ipcRenderer.invoke('article:deleteMany', ids),
    deleteByAccount: (accountId: string) =>
      ipcRenderer.invoke('article:deleteByAccount', accountId),
    stats: () => ipcRenderer.invoke('article:stats')
  },

  // 爬虫 API
  scraper: {
    start: (params: {
      accountNames: string[]
      rangeType: 'days' | 'count' | 'all'
      days?: number
      count?: number
    }) => ipcRenderer.invoke('scraper:start', params),
    stop: () => ipcRenderer.invoke('scraper:stop'),
    onLog: (callback: (data: { type: string; message: string }) => void) => {
      ipcRenderer.on('scraper:log', (_, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('scraper:log')
    },
    onProgress: (callback: (data: { current: number; total: number }) => void) => {
      ipcRenderer.on('scraper:progress', (_, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('scraper:progress')
    },
    onComplete: (callback: (data: unknown) => void) => {
      ipcRenderer.on('scraper:complete', (_, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('scraper:complete')
    }
  },

  // 仪表盘 API
  dashboard: {
    getStatistics: () => ipcRenderer.invoke('dashboard:statistics'),
    getTrend: (days: number) => ipcRenderer.invoke('dashboard:trend', days),
    getRecentArticles: (limit: number) => ipcRenderer.invoke('dashboard:recent-articles', limit),
    getTopAccounts: (limit: number) => ipcRenderer.invoke('dashboard:top-accounts', limit)
  },

  // 定时任务 API
  scheduler: {
    start: () => ipcRenderer.invoke('scheduler:start'),
    stop: () => ipcRenderer.invoke('scheduler:stop'),
    enableAutoLaunch: () => ipcRenderer.invoke('scheduler:enableAutoLaunch'),
    disableAutoLaunch: () => ipcRenderer.invoke('scheduler:disableAutoLaunch'),
    getStatus: () => ipcRenderer.invoke('scheduler:getStatus'),
    cancelTask: () => ipcRenderer.invoke('scheduler:cancelTask'),
    getLogs: (params?: { limit?: number; offset?: number }) =>
      ipcRenderer.invoke('scheduler:getLogs', params),
    getStats: () => ipcRenderer.invoke('scheduler:getStats'),
    onCountdown: (callback: (data: { countdown: number; accountNames: string[] }) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: { countdown: number; accountNames: string[] }
      ): void => callback(data)
      ipcRenderer.on('scheduler:countdown', listener)
      return () => ipcRenderer.removeListener('scheduler:countdown', listener)
    },
    onCancelled: (callback: () => void) => {
      const listener = (): void => callback()
      ipcRenderer.on('scheduler:cancelled', listener)
      return () => ipcRenderer.removeListener('scheduler:cancelled', listener)
    },
    onCountdownComplete: (callback: () => void) => {
      const listener = (): void => callback()
      ipcRenderer.on('scheduler:countdown-complete', listener)
      return () => ipcRenderer.removeListener('scheduler:countdown-complete', listener)
    }
  },

  // 主题 API
  theme: {
    setNativeTheme: (theme: 'dark' | 'light') => ipcRenderer.send('theme:change', theme)
  },

  // 文件操作 API
  file: {
    downloadImages: (imageUrls: string[], articleTitle: string) =>
      ipcRenderer.invoke('file:downloadImages', imageUrls, articleTitle),
    showInFolder: (folderPath: string) => ipcRenderer.invoke('file:showInFolder', folderPath)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
