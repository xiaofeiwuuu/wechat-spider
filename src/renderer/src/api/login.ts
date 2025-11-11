/**
 * 登录 API 封装
 */

export interface UserInfo {
  nickName: string
  avatar: string
  uin: string
  userName: string
  cookie?: string
  createdAt?: string
}

export interface LoginStatus {
  isValid: boolean
  expiresIn?: number
  expiresAt?: string
  userInfo?: UserInfo
}

export interface LoginData {
  token: string
  cookie: string
  timestamp: number
  userInfo?: UserInfo
}

/**
 * 检查登录状态
 */
export async function checkLoginStatus(): Promise<LoginStatus> {
  const result = await window.api.login.checkStatus()

  if (!result.success) {
    throw new Error(result.error || '检查登录状态失败')
  }

  return result.data!
}

/**
 * 开始登录
 */
export async function startLogin(): Promise<LoginData> {
  const result = await window.api.login.start()

  if (!result.success || !result.data) {
    throw new Error(result.error || '登录失败')
  }

  return result.data
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  const result = await window.api.login.logout()

  if (!result.success) {
    throw new Error(result.error || '退出登录失败')
  }
}

/**
 * 刷新登录(重新登录)
 */
export async function refreshLogin(): Promise<LoginData> {
  const result = await window.api.login.refresh()

  if (!result.success || !result.data) {
    throw new Error(result.error || '刷新登录失败')
  }

  return result.data
}

/**
 * 监听登录状态变化
 */
export function onLoginStatusChange(callback: (status: string) => void): () => void {
  return window.api.login.onStatusChange(callback)
}
