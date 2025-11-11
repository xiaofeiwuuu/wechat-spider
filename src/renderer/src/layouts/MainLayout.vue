<template>
  <el-container class="main-layout">
    <LayoutSidebar />

    <el-container class="main-content-layout" direction="vertical">
      <div class="header-shadow-wrapper">
        <LayoutHeader />
      </div>

      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>

      <LayoutFooter />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import { useLoginStore } from '../stores/login'
import LayoutSidebar from '../components/layout/LayoutSidebar.vue'
import LayoutHeader from '../components/layout/LayoutHeader.vue'
import LayoutFooter from '../components/layout/LayoutFooter.vue'

const themeStore = useThemeStore()
const loginStore = useLoginStore()

// 初始化主题和检查登录状态
onMounted(() => {
  themeStore.initTheme()
  loginStore.checkStatus()
})
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background: var(--color-background);
}

.main-content-layout {
  transition: all 0.3s;
}

.header-shadow-wrapper {
  box-shadow: var(--header-shadow);
  position: relative;
  z-index: 10;
}

.main-content {
  margin: 0;
  padding: 0;
  background: var(--color-background);
  min-height: calc(100vh - 64px - 40px);
}

.content-wrapper {
  padding: 24px;
  height: calc(100vh - 64px - 40px);
  overflow: hidden;
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
