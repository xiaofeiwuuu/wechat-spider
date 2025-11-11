import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { appRoutes } from './routes'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: appRoutes as RouteRecordRaw[]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
