<template>
  <div class="logo-container">
    <div v-if="!collapsed" class="logo-expanded">
      <el-icon class="logo-icon" :size="28">
        <Download />
      </el-icon>
      <span class="logo-text">{{ appTitle }}</span>
    </div>
    <div v-else class="logo-collapsed">
      <el-icon class="logo-icon" :size="28">
        <Download />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Download } from '@element-plus/icons-vue'

defineProps<{
  collapsed: boolean
}>()

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE)
</script>

<style scoped lang="scss">
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px;
  flex-shrink: 0;
  overflow: hidden;
}

.logo-expanded {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;

  .logo-icon {
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-accent);
    letter-spacing: 1px;
    flex-shrink: 0;
  }
}

.logo-collapsed {
  .logo-icon {
    color: var(--color-accent);
  }
}
</style>
