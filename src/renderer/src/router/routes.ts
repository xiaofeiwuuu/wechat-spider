import type { RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'
import {
  Odometer,
  User,
  Download,
  Document,
  Setting,
  UserFilled,
  Clock,
  PriceTag
} from '@element-plus/icons-vue'

/**
 * 路由元信息接口
 */
export interface RouteMetaConfig extends Record<PropertyKey, unknown> {
  title: string
  icon?: Component
  showInMenu?: boolean
}

/**
 * 扩展的路由配置接口
 */
export interface AppRouteConfig extends Omit<RouteRecordRaw, 'meta'> {
  meta: RouteMetaConfig
}

/**
 * 应用路由配置
 * 统一管理菜单和路由,避免重复配置
 */
export const appRoutes: AppRouteConfig[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '仪表盘',
      icon: Odometer,
      showInMenu: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '微信公众平台登录',
      icon: User,
      showInMenu: true
    }
  },
  {
    path: '/scraper',
    name: 'Scraper',
    component: () => import('../views/Scraper.vue'),
    meta: {
      title: '爬取任务',
      icon: Download,
      showInMenu: true
    }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('../views/Tags.vue'),
    meta: {
      title: '标签管理',
      icon: PriceTag,
      showInMenu: true
    }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('../views/Accounts.vue'),
    meta: {
      title: '公众号管理',
      icon: UserFilled,
      showInMenu: true
    }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('../views/Articles.vue'),
    meta: {
      title: '文章管理',
      icon: Document,
      showInMenu: true
    }
  },
  {
    path: '/scheduler-logs',
    name: 'SchedulerLogs',
    component: () => import('../views/SchedulerLogs.vue'),
    meta: {
      title: '定时任务日志',
      icon: Clock,
      showInMenu: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: {
      title: '系统设置',
      icon: Setting,
      showInMenu: true
    }
  }
]

/**
 * 获取菜单配置
 * 从路由配置中筛选出需要在菜单中显示的项
 */
export function getMenuItems(): Array<{
  key: string
  path: string
  label: string
  icon: Component | undefined
  title: string
}> {
  return appRoutes
    .filter((route) => route.meta.showInMenu)
    .map((route, index) => ({
      key: String(index + 1),
      path: route.path,
      label: route.meta.title,
      icon: route.meta.icon,
      title: route.meta.title
    }))
}
