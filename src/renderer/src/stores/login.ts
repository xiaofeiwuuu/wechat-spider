import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  checkLoginStatus,
  startLogin,
  logout,
  refreshLogin,
  onLoginStatusChange
} from '../api/login'
import type { LoginStatus, UserInfo } from '../api/login'

export const useLoginStore = defineStore('login', () => {
  // State
  const isLoggedIn = ref(false)
  const loginStatus = ref<LoginStatus>({
    isValid: false
  })
  const userInfo = ref<UserInfo | null>(null)
  const loginTime = ref<string | null>(null)
  const currentStatus = ref<string>('未登录')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 状态文本映射
  const statusTextMap: Record<string, string> = {
    'checking-cache': '正在检查缓存...',
    'cache-valid': '缓存有效',
    'launching-browser': '正在启动浏览器...',
    navigating: '正在打开登录页...',
    'waiting-scan': '请使用微信扫码登录',
    'login-success': '扫码成功!',
    'fetching-userinfo': '正在获取用户信息...',
    error: '登录失败'
  }

  // Actions
  async function checkStatus(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      loginStatus.value = await checkLoginStatus()
      isLoggedIn.value = loginStatus.value.isValid

      // 加载用户信息
      if (loginStatus.value.isValid && loginStatus.value.userInfo) {
        userInfo.value = loginStatus.value.userInfo
        loginTime.value = loginStatus.value.userInfo.createdAt || null
        currentStatus.value = '已登录'
      } else {
        userInfo.value = null
        loginTime.value = null
        currentStatus.value = '未登录'
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('Check login status failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function login(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      // 监听登录状态变化
      const removeListener = onLoginStatusChange((status) => {
        currentStatus.value = statusTextMap[status] || status
      })

      try {
        const loginData = await startLogin()
        // 保存用户信息并立即更新状态
        if (loginData.userInfo) {
          userInfo.value = loginData.userInfo
          loginTime.value = loginData.userInfo.createdAt || null
          isLoggedIn.value = true
          loginStatus.value = {
            isValid: true,
            userInfo: loginData.userInfo
          }
          currentStatus.value = '已登录'
        }
        // 在后台检查状态,不影响当前显示
        checkStatus()
      } finally {
        removeListener()
        isLoading.value = false
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      currentStatus.value = '登录失败'
      isLoading.value = false
      console.error('Login failed:', err)
      throw err
    }
  }

  async function doLogout(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      await logout()
      isLoggedIn.value = false
      loginStatus.value = { isValid: false }
      userInfo.value = null
      loginTime.value = null
      currentStatus.value = '未登录'
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('Logout failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function refresh(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      // 监听登录状态变化
      const removeListener = onLoginStatusChange((status) => {
        currentStatus.value = statusTextMap[status] || status
      })

      try {
        const loginData = await refreshLogin()
        // 保存用户信息
        if (loginData.userInfo) {
          userInfo.value = loginData.userInfo
        }
        await checkStatus()
      } finally {
        removeListener()
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      currentStatus.value = '刷新失败'
      console.error('Refresh login failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoggedIn,
    loginStatus,
    userInfo,
    loginTime,
    currentStatus,
    isLoading,
    error,
    checkStatus,
    login,
    logout: doLogout,
    refresh
  }
})
