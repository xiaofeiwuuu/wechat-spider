<template>
  <div class="login-container">
    <div class="login-content">
      <!-- 标题 -->
      <h1 class="login-title">{{ appTitle }}</h1>

      <!-- 一言文案 -->
      <div class="hitokoto-container">
        <p v-if="hitokoto.loading" class="hitokoto-text">
          <el-icon class="loading-icon" style="margin-right: 8px">
            <Loading />
          </el-icon>
          加载中...
        </p>
        <p v-else-if="hitokoto.text" class="hitokoto-text">
          {{ hitokoto.text }}
          <span v-if="hitokoto.from" class="hitokoto-from">—— {{ hitokoto.from }}</span>
        </p>
      </div>

      <!-- 登录按钮和状态 -->
      <div class="login-actions">
        <!-- 未登录且未在加载时显示登录按钮 -->
        <el-button
          v-if="!store.isLoggedIn && !store.isLoading"
          class="login-button"
          text
          size="large"
          @click="handleLogin"
        >
          开始登录
        </el-button>

        <!-- 登录中显示状态 -->
        <div v-else-if="store.isLoading && !store.isLoggedIn" class="login-status">
          <el-space direction="vertical" alignment="center" :size="8">
            <el-icon class="loading-icon" :size="24" style="color: var(--color-accent)">
              <Loading />
            </el-icon>
            <p class="status-text">{{ store.currentStatus }}</p>
          </el-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useLoginStore } from '../stores/login'

const store = useLoginStore()

// 应用标题
const appTitle = ref('微信公众号爬虫工具')

// 一言数据
interface HitokotoData {
  loading: boolean
  text: string
  from: string
}

const hitokoto = ref<HitokotoData>({
  loading: true,
  text: '',
  from: ''
})

// 获取一言
async function fetchHitokoto(): Promise<void> {
  try {
    hitokoto.value.loading = true
    const response = await fetch('https://v1.hitokoto.cn?max_length=24')
    const data = await response.json()
    hitokoto.value.text = data.hitokoto
    hitokoto.value.from = data.from
  } catch (error) {
    console.error('获取一言失败:', error)
    hitokoto.value.text = '点击下方按钮开始登录'
    hitokoto.value.from = ''
  } finally {
    hitokoto.value.loading = false
  }
}

// 处理登录
async function handleLogin(): Promise<void> {
  try {
    await store.login()
    ElMessage.success('登录成功!')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '登录失败'
    ElMessage.error(errorMessage)
  }
}

// 页面加载时检查登录状态和获取一言
onMounted(() => {
  store.checkStatus()
  fetchHitokoto()
})
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 142px);
}

.login-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.login-title {
  margin: 0 0 32px;
  color: var(--color-accent);
  font-size: 42px;
  font-weight: 600;
  letter-spacing: 2px;
}

.hitokoto-container {
  margin-bottom: 48px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;

  .hitokoto-text {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.8;
    text-align: center;
    font-style: italic;

    .hitokoto-from {
      display: block;
      margin-top: 8px;
      font-size: 14px;
      color: var(--color-text-disabled);
      font-style: normal;
    }
  }
}

.login-actions {
  margin-bottom: 24px;

  .login-button {
    min-width: 140px;
    height: 48px;
    font-size: 16px;
    border-radius: 6px;
    position: relative;
    color: var(--color-text-primary);

    &:hover {
      background: transparent !important;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 8px;
      left: 10%;
      width: 0;
      height: 2px;
      background: var(--color-accent);
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 80%;
    }
  }

  .login-success-tip {
    text-align: center;
    padding: 24px;

    .success-text {
      margin: 0 0 8px;
      color: var(--color-accent);
      font-size: 20px;
      font-weight: 600;
    }

    .tip-text {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 14px;
    }
  }
}

.login-status {
  margin-top: 32px;
  text-align: center;

  .status-text {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 15px;
    font-weight: 500;
  }
}

// Loading 图标旋转动画
.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
