<template>
  <el-header class="main-header">
    <div class="header-left">
      <h1 class="header-title">{{ currentPageTitle }}</h1>
    </div>
    <div class="header-right">
      <el-space :size="16">
        <!-- 主题切换按钮 -->
        <el-tooltip
          :content="themeStore.currentThemeName === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
        >
          <el-button text class="theme-toggle-btn" @click="themeStore.toggleTheme()">
            <el-icon :size="18">
              <component :is="themeStore.currentThemeName === 'dark' ? Sunny : Moon" />
            </el-icon>
          </el-button>
        </el-tooltip>

        <!-- 使用说明按钮 -->
        <el-tooltip content="使用说明">
          <el-button text class="theme-toggle-btn" @click="helpDialogVisible = true">
            <el-icon :size="18">
              <QuestionFilled />
            </el-icon>
          </el-button>
        </el-tooltip>

        <!-- 通知图标 -->
        <el-dropdown trigger="click" @command="handleNotificationCommand">
          <el-badge
            :value="notificationStore.unreadCount"
            :max="99"
            :hidden="notificationStore.unreadCount === 0"
          >
            <el-icon class="header-icon notification-icon" :size="18">
              <Bell />
            </el-icon>
          </el-badge>
          <template #dropdown>
            <el-dropdown-menu class="notification-dropdown-menu">
              <div class="notification-header">
                <span>通知中心</span>
                <el-button
                  v-if="notificationStore.unreadCount > 0"
                  text
                  size="small"
                  @click="handleMarkAllRead"
                >
                  全部已读
                </el-button>
              </div>
              <el-scrollbar max-height="400px">
                <div v-if="notificationStore.notifications.length === 0" class="notification-empty">
                  <el-empty description="暂无通知" :image-size="60" />
                </div>
                <div
                  v-for="notification in notificationStore.notifications"
                  :key="notification.id"
                  class="notification-item"
                  :class="{ unread: !notification.read }"
                  @click="handleNotificationClick(notification.id)"
                >
                  <div class="notification-icon-wrapper">
                    <el-icon :size="20" :color="getNotificationColor(notification.type)">
                      <component :is="getNotificationIcon(notification.type)" />
                    </el-icon>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <el-progress
                      v-if="notification.type === 'progress' && notification.progress !== undefined"
                      :percentage="notification.progress"
                      :show-text="false"
                      :stroke-width="4"
                    />
                    <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
                  </div>
                </div>
              </el-scrollbar>
              <div v-if="notificationStore.notifications.length > 0" class="notification-footer">
                <el-button text size="small" @click="handleClearAll">清空所有</el-button>
              </div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 用户下拉菜单 - 已登录时显示 -->
        <el-dropdown v-if="loginStore.isLoggedIn" @command="handleMenuClick">
          <div class="user-info">
            <el-avatar
              v-if="loginStore.userInfo?.avatar"
              :size="32"
              :src="loginStore.userInfo.avatar"
              class="user-avatar"
            />
            <el-avatar v-else :size="32" class="user-avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="user-name">{{ loginStore.userInfo?.nickName || '用户' }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="user-dropdown-menu">
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                <span>个人信息</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="refresh">
                <el-icon><Refresh /></el-icon>
                <span>刷新登录</span>
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录状态标签 - 可点击跳转到登录页 -->
        <el-tag v-else type="info" class="login-status-tag clickable" @click="goToLogin"
          >未登录</el-tag
        >
      </el-space>
    </div>

    <!-- 个人信息对话框 -->
    <el-dialog v-model="profileDialogVisible" title="个人信息" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">
          {{ loginStore.userInfo?.nickName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="头像">
          <el-avatar
            v-if="loginStore.userInfo?.avatar"
            :size="50"
            :src="loginStore.userInfo.avatar"
          />
          <el-avatar v-else :size="50">
            <el-icon><User /></el-icon>
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="loginStore.isLoggedIn ? 'success' : 'info'">
            {{ loginStore.isLoggedIn ? '已登录' : '未登录' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="登录时间">
          {{
            loginStore.loginTime ? dayjs(loginStore.loginTime).format('YYYY-MM-DD HH:mm:ss') : '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="Cookie状态">
          <el-tag :type="loginStore.userInfo?.cookie ? 'success' : 'warning'">
            {{ loginStore.userInfo?.cookie ? '有效' : '无效' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="profileDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleRefreshFromDialog">刷新登录</el-button>
      </template>
    </el-dialog>

    <!-- 使用说明对话框 -->
    <el-dialog v-model="helpDialogVisible" title="使用说明" width="900px">
      <el-scrollbar max-height="60vh">
        <div class="help-content">
          <el-steps direction="vertical" :active="activeStep" finish-status="success">
            <!-- 步骤1: 登录 -->
            <el-step title="登录系统" @click="activeStep = 0">
              <template #description>
                <div class="step-content">
                  <ol>
                    <li>点击"登录"按钮</li>
                    <li>使用微信扫描二维码</li>
                    <li>在手机上确认登录</li>
                    <li>等待应用获取登录信息</li>
                  </ol>
                  <el-alert type="warning" :closable="false" show-icon>
                    <p><strong>重要提示:</strong> 只有在登录状态下才能爬取公众号文章</p>
                  </el-alert>
                </div>
              </template>
            </el-step>

            <!-- 步骤2: 爬取文章 -->
            <el-step title="爬取文章" @click="activeStep = 1">
              <template #description>
                <div class="step-content">
                  <h4>快速爬取公众号文章</h4>
                  <p><strong>快速选择公众号:</strong></p>
                  <ul>
                    <li><strong>通过标签:</strong> 选择标签快速批量添加同类公众号</li>
                    <li><strong>手动输入:</strong> 输入公众号名称后按回车添加</li>
                    <li><strong>从列表选择:</strong> 从已爬取的公众号列表中选择</li>
                  </ul>
                  <p><strong>配置爬取范围:</strong></p>
                  <ul>
                    <li><strong>按天数:</strong> 爬取最近N天内发布的文章</li>
                    <li><strong>按数量:</strong> 爬取最新的N篇文章</li>
                    <li><strong>全部:</strong> 爬取该公众号的所有历史文章</li>
                  </ul>
                  <p><strong>执行爬取:</strong></p>
                  <ol>
                    <li>点击"开始爬取"按钮</li>
                    <li>实时查看爬取进度和状态</li>
                    <li>右侧查看最近爬取记录</li>
                  </ol>
                  <el-alert type="info" :closable="false" show-icon>
                    <p><strong>提示:</strong> 使用标签可以快速批量爬取同类公众号,无需逐个添加</p>
                  </el-alert>
                </div>
              </template>
            </el-step>

            <!-- 步骤3: 数据管理 (标签 + 公众号 + 文章) -->
            <el-step title="数据管理" @click="activeStep = 2">
              <template #description>
                <div class="step-content">
                  <h4>标签、公众号、文章三位一体管理</h4>

                  <div class="module-section">
                    <p class="module-title">
                      <el-icon><PriceTag /></el-icon> <strong>1. 标签管理</strong>
                    </p>
                    <p class="module-desc">创建标签为公众号分类,便于在爬取任务中快速选择</p>
                    <ul>
                      <li>按行业: 科技、财经、娱乐等</li>
                      <li>按重要性: 重点关注、一般关注等</li>
                      <li>按更新频率: 日更、周更等</li>
                      <li><strong>核心作用:</strong> 在爬取页面通过标签一键批量添加公众号</li>
                    </ul>
                  </div>

                  <div class="module-section">
                    <p class="module-title">
                      <el-icon><List /></el-icon> <strong>2. 公众号管理</strong>
                    </p>
                    <p class="module-desc">为公众号添加标签,实现分类管理</p>
                    <ul>
                      <li>查看已爬取的所有公众号</li>
                      <li>查看公众号的文章数量</li>
                    </ul>
                  </div>

                  <div class="module-section">
                    <p class="module-title">
                      <el-icon><Document /></el-icon> <strong>3. 文章列表</strong>
                    </p>
                    <p class="module-desc">查看和管理所有爬取的文章</p>
                    <ul>
                      <li>查看发布时间和爬取时间</li>
                    </ul>
                  </div>

                  <el-alert type="success" :closable="false" show-icon>
                    <p>
                      <strong>使用流程:</strong> 创建标签 → 为公众号添加标签 →
                      爬取时通过标签快速批量选择 → 查看分类后的文章
                    </p>
                  </el-alert>
                </div>
              </template>
            </el-step>

            <!-- 步骤4: 设置定时任务 -->
            <el-step title="设置定时任务" @click="activeStep = 3">
              <template #description>
                <div class="step-content">
                  <h4>自动化爬取配置</h4>
                  <p><strong>执行模式:</strong></p>
                  <ul>
                    <li><strong>间隔执行:</strong> 每隔固定时间执行一次(如每6小时)</li>
                    <li><strong>定时执行:</strong> 在指定时间点执行(如每天22:00)</li>
                  </ul>
                  <p><strong>配置步骤:</strong></p>
                  <ol>
                    <li>启用定时任务开关</li>
                    <li>选择执行模式和时间</li>
                    <li>通过标签筛选或直接选择要爬取的公众号</li>
                    <li>保存设置</li>
                  </ol>
                  <p><strong>查看执行日志:</strong></p>
                  <ul>
                    <li>查看定时任务执行历史记录</li>
                    <li>统计成功/失败次数</li>
                    <li>查看每次执行的详细信息</li>
                  </ul>
                  <el-alert type="warning" :closable="false" show-icon>
                    <p>定时任务需要应用保持运行,建议启用"开机自启动"</p>
                  </el-alert>
                </div>
              </template>
            </el-step>

            <!-- 步骤5: 系统设置 -->
            <el-step title="系统设置" @click="activeStep = 4">
              <template #description>
                <div class="step-content">
                  <h4>个性化配置</h4>
                  <p><strong>存储设置:</strong></p>
                  <ul>
                    <li><strong>本地文件:</strong> 将文章保存为HTML文件</li>
                    <li><strong>数据库:</strong> 仅在数据库中保存文章信息</li>
                    <li><strong>双模式:</strong> 同时保存到文件和数据库</li>
                  </ul>
                  <p><strong>爬取设置:</strong></p>
                  <ul>
                    <li>配置默认的爬取范围和参数</li>
                    <li>设置请求间隔,避免请求过快被限制</li>
                  </ul>
                  <p><strong>定时任务设置:</strong></p>
                  <ul>
                    <li>配置定时任务的详细参数</li>
                    <li>设置开机自启动</li>
                    <li>选择要定时爬取的公众号</li>
                  </ul>
                </div>
              </template>
            </el-step>
          </el-steps>
        </div>
      </el-scrollbar>
      <template #footer>
        <el-button type="primary" @click="helpDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </el-header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell,
  User,
  SwitchButton,
  Refresh,
  Sunny,
  Moon,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  Loading,
  QuestionFilled,
  List,
  Document,
  PriceTag
} from '@element-plus/icons-vue'
import { getMenuItems } from '../../router/routes'
import { useThemeStore } from '../../stores/theme'
import { useLoginStore } from '../../stores/login'
import { useNotificationStore } from '../../stores/notification'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const loginStore = useLoginStore()
const notificationStore = useNotificationStore()
const menuItems = getMenuItems()

const currentPageTitle = computed(() => {
  const currentItem = menuItems.find((item) => item.path === route.path)
  return currentItem?.title || import.meta.env.VITE_APP_TITLE
})

// 个人信息对话框状态
const profileDialogVisible = ref(false)

// 帮助对话框状态
const helpDialogVisible = ref(false)
const activeStep = ref(0)

// 跳转到登录页
function goToLogin(): void {
  router.push('/login')
}

// 获取通知图标
function getNotificationIcon(
  type: string
):
  | typeof SuccessFilled
  | typeof WarningFilled
  | typeof CircleCloseFilled
  | typeof Loading
  | typeof InfoFilled {
  switch (type) {
    case 'success':
      return SuccessFilled
    case 'warning':
      return WarningFilled
    case 'error':
      return CircleCloseFilled
    case 'progress':
      return Loading
    default:
      return InfoFilled
  }
}

// 获取通知颜色
function getNotificationColor(type: string): string {
  switch (type) {
    case 'success':
      return '#52c41a'
    case 'warning':
      return '#faad14'
    case 'error':
      return '#ff4d4f'
    case 'progress':
      return '#1890ff'
    default:
      return '#909399'
  }
}

// 格式化时间
function formatTime(timestamp: number): string {
  return dayjs(timestamp).fromNow()
}

// 处理通知点击
function handleNotificationClick(id: string): void {
  notificationStore.markAsRead(id)
}

// 标记全部已读
function handleMarkAllRead(): void {
  notificationStore.markAllAsRead()
}

// 清空所有通知
function handleClearAll(): void {
  notificationStore.clearAll()
}

// 处理通知命令
function handleNotificationCommand(): void {
  // 预留接口,暂时不用
}

// 处理用户菜单点击
async function handleMenuClick(command: string): Promise<void> {
  if (command === 'refresh') {
    try {
      await loginStore.refresh()
      ElMessage.success('刷新登录成功!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新登录失败'
      ElMessage.error(errorMessage)
    }
  } else if (command === 'logout') {
    try {
      await loginStore.logout()
      ElMessage.success('已退出登录')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '退出登录失败'
      ElMessage.error(errorMessage)
    }
  } else if (command === 'profile') {
    profileDialogVisible.value = true
  }
}

// 从对话框刷新登录
async function handleRefreshFromDialog(): Promise<void> {
  try {
    await loginStore.refresh()
    ElMessage.success('刷新登录成功!')
    profileDialogVisible.value = false
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '刷新登录失败'
    ElMessage.error(errorMessage)
  }
}
</script>

<style scoped lang="scss">
.main-header {
  height: 64px;
  background: var(--color-primary);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  .header-title {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: var(--color-accent);
  }
}

.header-right {
  display: flex;
  align-items: center;

  .login-status-tag {
    font-size: 13px;
    padding: 4px 12px;
    border-radius: 4px;
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-secondary);

    &.clickable {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: var(--color-accent) !important;
        color: var(--color-accent) !important;
      }
    }
  }

  .theme-toggle-btn {
    color: var(--color-text-primary);
    padding: 4px;

    &:hover {
      background: transparent !important;
      color: var(--color-accent) !important;
    }

    &:focus {
      background: transparent !important;
    }
  }

  .header-icon {
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: var(--color-accent);
    }
  }

  // Element Plus badge 容器的 hover 样式
  :deep(.el-badge) {
    &:hover {
      background: transparent !important;
    }
  }

  // Element Plus dropdown 移除聚焦边框
  :deep(.el-dropdown) {
    outline: none !important;

    &:focus,
    &:focus-visible {
      outline: none !important;
    }

    .el-tooltip__trigger {
      outline: none !important;

      &:focus,
      &:focus-visible {
        outline: none !important;
      }
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    .user-name {
      color: var(--color-text-primary);
      font-size: 14px;
    }
  }

  .user-avatar {
    background-color: var(--color-accent);
    color: var(--color-selected-text);
  }
}
</style>

<style lang="scss">
// 用户下拉菜单全局样式 (下拉菜单被挂载到 body 下,必须使用全局样式)
.user-dropdown-menu.el-dropdown-menu {
  background: var(--color-primary) !important;

  .el-dropdown-menu__item {
    color: var(--color-text-primary) !important;
    font-weight: 500;
    background: var(--color-primary) !important;

    &:hover {
      background: var(--color-primary) !important;
      color: var(--color-accent) !important;
    }

    .el-icon {
      color: var(--color-text-primary) !important;
      margin-right: 8px;
    }

    &:hover .el-icon {
      color: var(--color-accent) !important;
    }
  }
}

// 覆盖 el-popper 的边框颜色
.el-popper:has(.user-dropdown-menu) {
  background: var(--color-primary) !important;
  border: 1px solid var(--color-border) !important;
}

// 覆盖用户菜单箭头颜色
.el-popper:has(.user-dropdown-menu) .el-popper__arrow::before {
  background: var(--color-primary) !important;
  border: 1px solid var(--color-border) !important;
}

// 通知下拉菜单全局样式
.notification-dropdown-menu.el-dropdown-menu {
  background: var(--color-primary) !important;
  padding: 0;
  min-width: 360px;
  max-width: 480px;

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .notification-empty {
    padding: 20px;
  }

  .notification-item {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--color-table-hover-bg);
    }

    &.unread {
      background-color: rgba(0, 255, 50, 0.05);

      &:hover {
        background-color: rgba(0, 255, 50, 0.1);
      }
    }

    .notification-icon-wrapper {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--color-surface);
    }

    .notification-content {
      flex: 1;
      min-width: 0;

      .notification-title {
        font-weight: 500;
        color: var(--color-text-primary);
        margin-bottom: 4px;
        font-size: 14px;
      }

      .notification-message {
        color: var(--color-text-secondary);
        font-size: 13px;
        margin-bottom: 4px;
        word-break: break-word;
      }

      .notification-time {
        font-size: 12px;
        color: var(--color-text-disabled);
        margin-top: 4px;
      }

      .el-progress {
        margin-top: 4px;
      }
    }
  }

  .notification-footer {
    padding: 8px 16px;
    border-top: 1px solid var(--color-border);
    text-align: center;
  }
}

// 覆盖通知菜单的 el-popper 边框
.el-popper:has(.notification-dropdown-menu) {
  background: var(--color-primary) !important;
  border: 1px solid var(--color-border) !important;
}

.el-popper:has(.notification-dropdown-menu) .el-popper__arrow::before {
  background: var(--color-primary) !important;
  border: 1px solid var(--color-border) !important;
}

// 帮助对话框样式
.help-content {
  padding: 0 16px;

  :deep(.el-steps) {
    .el-step__head {
      cursor: pointer;

      &:hover {
        .el-step__icon {
          border-color: var(--color-accent);
        }
      }
    }

    .el-step__icon {
      width: 48px;
      height: 48px;
      border: 2px solid var(--color-border);
      background: var(--color-primary);
      transition: all 0.3s;

      .el-icon {
        color: var(--color-text-primary);
      }
    }

    .el-step__icon.is-text {
      border-color: var(--color-accent);

      .el-icon {
        color: var(--color-accent);
      }
    }

    .el-step__title {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .el-step__line {
      background-color: var(--color-border);
    }

    .el-step.is-success {
      .el-step__icon {
        border-color: var(--color-accent);
        background: var(--color-accent);

        .el-icon {
          color: #fff;
        }
      }

      .el-step__title {
        color: var(--color-accent);
      }

      .el-step__line {
        background-color: var(--color-accent);
      }
    }

    .el-step__description {
      padding-right: 20px;
      color: var(--color-text-primary);
    }
  }

  .step-content {
    padding: 8px 0;
    line-height: 1.8;

    h4 {
      margin: 0 0 12px 0;
      font-size: 15px;
      font-weight: 500;
      color: var(--color-accent);
    }

    p {
      margin: 8px 0;
      color: var(--color-text-primary);
    }

    strong {
      color: var(--color-accent);
      font-weight: 500;
    }

    ul,
    ol {
      margin: 8px 0;
      padding-left: 24px;
      color: var(--color-text-secondary);

      li {
        margin: 6px 0;
      }

      ul {
        margin-top: 4px;
        padding-left: 20px;

        li {
          margin: 4px 0;
          list-style-type: circle;
        }
      }
    }

    .el-alert {
      margin-top: 12px;

      p {
        margin: 0;
        font-size: 13px;
      }
    }

    .module-section {
      margin: 16px 0;
      padding: 12px;
      border-left: 3px solid var(--color-accent);
      background: var(--color-surface);
      border-radius: 4px;

      &:first-child {
        margin-top: 8px;
      }

      &:last-child {
        margin-bottom: 8px;
      }
    }

    .module-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 15px;
      color: var(--color-accent);

      .el-icon {
        color: var(--color-accent);
      }
    }

    .module-desc {
      margin: 4px 0 8px 0;
      font-size: 14px;
      color: var(--color-text-secondary);
      font-style: italic;
    }
  }
}
</style>
