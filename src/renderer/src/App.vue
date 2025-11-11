<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useThemeStore } from './stores/theme'
import { scraperEventsManager } from './services/scraperEvents'

const themeStore = useThemeStore()

// 立即初始化主题,不等待 mounted
themeStore.initTheme()

// 初始化全局爬虫事件监听器
// 这些监听器会在整个应用生命周期中保持活跃,即使切换页面也能接收爬取进度
scraperEventsManager.initialize()
</script>
