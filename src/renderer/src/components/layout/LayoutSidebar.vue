<template>
  <el-aside :width="isCollapsed ? '64px' : '220px'" class="main-sider">
    <div class="sider-content">
      <LayoutLogo :collapsed="isCollapsed" />

      <el-menu
        :default-active="activeKey"
        class="main-menu"
        :collapse="isCollapsed"
        @select="handleMenuClick"
      >
        <el-menu-item v-for="item in menuItems" :key="item.key" :index="item.key">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>
            <span>{{ item.label }}</span>
          </template>
        </el-menu-item>
      </el-menu>

      <div class="collapse-trigger" @click="toggleCollapse">
        <el-icon :size="18">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Fold, Expand } from '@element-plus/icons-vue'
import { getMenuItems } from '../../router/routes'
import LayoutLogo from './LayoutLogo.vue'

const router = useRouter()
const route = useRoute()

const isCollapsed = ref(false)
const activeKey = ref('1')
const menuItems = getMenuItems()

// 根据路由更新选中菜单
watch(
  () => route.path,
  (newPath) => {
    const currentItem = menuItems.find((item) => item.path === newPath)
    if (currentItem) {
      activeKey.value = currentItem.key
    }
  },
  { immediate: true }
)

function toggleCollapse(): void {
  isCollapsed.value = !isCollapsed.value
}

function handleMenuClick(key: string): void {
  const item = menuItems.find((i) => i.key === key)
  if (item) {
    router.push(item.path)
  }
}
</script>

<style scoped lang="scss">
.main-sider {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  background: var(--color-primary);
  // z-index: 100;
  transition: width 0.3s;
  height: 100vh;
  overflow: hidden;
}

.sider-content {
  display: flex;
  flex-direction: column;
  background: var(--color-primary);
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.main-menu {
  flex: 1;
  border-right: none;
  margin-top: 8px;
  background: var(--color-primary);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    width: calc(100% - 16px);
    border-radius: 6px;
    color: var(--color-text-primary);
    background: transparent;

    &:hover {
      background: var(--color-hover-bg);
      color: var(--color-hover-text);
    }

    &.is-active {
      background: var(--color-selected-bg);
      color: var(--color-selected-text);
      font-weight: 600;

      .el-icon {
        color: var(--color-selected-text);
      }
    }

    .el-icon {
      font-size: 18px;
      color: var(--color-text-primary);
    }
  }

  &.el-menu--collapse {
    width: 64px !important;
    --el-menu-base-level-padding: 0px;
    --el-menu-level-padding: 0px;
    --el-menu-icon-width: 48px;

    .el-menu-item {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 4px 8px;

      .el-menu-tooltip__trigger {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 !important;
      }
    }
  }
}

.collapse-trigger {
  height: 48px;
  line-height: 48px;
  text-align: left;
  padding-left: 24px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.3s;
  flex-shrink: 0;

  &:hover {
    color: var(--color-hover-text);
    background: var(--color-hover-bg);
  }
}
</style>
