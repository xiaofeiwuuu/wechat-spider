<template>
  <div class="scraper">
    <!-- 主要内容区域:左侧表单 + 右侧历史列表 -->
    <div class="scraper-content">
      <!-- 左侧:爬取表单 -->
      <div class="scraper-form">
        <el-form :model="formState" label-position="top">
          <el-form-item label="公众号名称">
            <!-- 快速选择区域 -->
            <div class="quick-select-area">
              <div class="quick-select-row">
                <!-- 标签选择下拉框 -->
                <el-select
                  v-if="allTags.length > 0"
                  v-model="selectedTagForFilter"
                  placeholder="选择标签快速添加公众号"
                  clearable
                  filterable
                  style="width: 280px"
                  @change="handleTagSelect"
                >
                  <el-option
                    v-for="tag in allTags"
                    :key="tag.id"
                    :label="tag.name"
                    :value="tag.id"
                  />
                </el-select>

                <!-- 实用按钮 -->
                <div class="action-buttons">
                  <el-button @click="clearSelection">清空</el-button>
                </div>
              </div>
            </div>

            <el-select
              v-model="formState.accountNames"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入公众号名称后按回车添加,或从列表中选择"
              style="width: 100%"
              :loading="loadingAccounts"
              tag-type="success"
            >
              <el-option
                v-for="account in accounts"
                :key="account.name"
                :label="account.name"
                :value="account.name"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="爬取范围">
            <el-radio-group v-model="formState.rangeType">
              <el-tooltip content="爬取最近指定天数内发布的文章" placement="top">
                <el-radio value="days">按天数</el-radio>
              </el-tooltip>
              <el-tooltip content="爬取最新的指定数量的文章" placement="top">
                <el-radio value="count">按数量</el-radio>
              </el-tooltip>
              <el-tooltip content="爬取该公众号的所有历史文章" placement="top">
                <el-radio value="all">全部</el-radio>
              </el-tooltip>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="formState.rangeType === 'days'" label="天数">
            <el-input-number v-model="formState.days" :min="1" :max="365" :controls="false" />
          </el-form-item>

          <el-form-item v-if="formState.rangeType === 'count'" label="文章数量">
            <el-input-number v-model="formState.count" :min="1" :max="1000" :controls="false" />
          </el-form-item>

          <el-form-item>
            <el-space>
              <el-button v-if="!scraperStore.scraping" type="primary" @click="handleScrape">
                开始爬取
              </el-button>
              <el-button v-else type="danger" @click="handleStop"> 停止爬取 </el-button>
              <el-button :disabled="scraperStore.scraping" @click="handleReset">重置</el-button>
              <el-button v-if="scraperStore.logs.length > 0" @click="handleClearLogs"
                >清空日志</el-button
              >
            </el-space>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧:最近爬取历史 -->
      <div class="scraper-history">
        <div class="history-header">
          <span class="history-title">最近爬取记录</span>
          <el-button v-if="scrapingHistory.length > 0" size="small" text @click="clearHistory">
            清空
          </el-button>
        </div>
        <div class="history-list">
          <div v-if="scrapingHistory.length === 0" class="history-empty">暂无爬取记录</div>
          <div
            v-for="(history, index) in scrapingHistory"
            :key="index"
            class="history-item"
            @click="loadHistoryItem(history)"
          >
            <div class="history-item-header">
              <span class="history-time">{{ history.time }}</span>
              <el-tag size="small" :type="history.success ? 'success' : 'info'">
                {{ history.accounts.length }} 个公众号
              </el-tag>
            </div>
            <div class="history-accounts">
              <el-tag
                v-for="(account, idx) in history.accounts.slice(0, 3)"
                :key="idx"
                size="small"
                type="info"
                style="margin-right: 4px"
              >
                {{ account }}
              </el-tag>
              <span v-if="history.accounts.length > 3" class="history-more">
                +{{ history.accounts.length - 3 }}
              </span>
            </div>
            <div class="history-config">
              {{ getRangeText(history.config) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 爬取进度和日志 - 底部全宽显示 -->
    <div class="scraper-console">
      <div class="console-header">
        <span class="console-title">爬取日志</span>
        <el-tag v-if="scraperStore.scraping" type="primary" effect="dark">进行中</el-tag>
        <el-tag v-else-if="scraperStore.logs.length > 0" type="success" effect="dark"
          >已完成</el-tag
        >
        <span v-else class="console-status">等待开始...</span>
      </div>

      <!-- 进度条 -->
      <el-progress
        v-if="scraperStore.progress.total > 0"
        :percentage="
          Math.round((scraperStore.progress.current / scraperStore.progress.total) * 100)
        "
        :status="scraperStore.scraping ? undefined : 'success'"
      >
        <template #default="{ percentage }">
          {{ scraperStore.progress.current }} / {{ scraperStore.progress.total }} ({{
            percentage
          }}%)
        </template>
      </el-progress>

      <!-- 日志显示区域 -->
      <div ref="logContainer" class="console-logs">
        <div v-if="scraperStore.logs.length === 0" class="log-empty">
          <span class="log-empty-icon">›</span>
          <span class="log-empty-text">等待爬取任务...</span>
        </div>
        <div
          v-for="(log, index) in scraperStore.logs"
          :key="index"
          class="log-item"
          :class="[`log-${log.type}`]"
        >
          <span class="log-prefix">›</span>
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useScraperStore } from '../stores/scraper'
import { scraperEventsManager } from '../services/scraperEvents'

// 使用 scraper store
const scraperStore = useScraperStore()

// 爬取任务表单状态
const formState = reactive({
  accountNames: [] as string[],
  rangeType: 'days' as 'days' | 'count' | 'all',
  days: 30,
  count: 100
})

// 爬取历史记录
interface ScrapingHistoryItem {
  time: string
  accounts: string[]
  config: {
    rangeType: 'days' | 'count' | 'all'
    days?: number
    count?: number
  }
  success: boolean
}

const SCRAPING_HISTORY_KEY = 'scraper_history'
const scrapingHistory = ref<ScrapingHistoryItem[]>([])

const logContainer = ref<HTMLElement | null>(null)

// 配置类型定义
interface ScraperDefaultsConfig {
  rangeType: 'days' | 'count' | 'all'
  days: number
  count: number
}

// 定义标签接口
interface Tag {
  id: string
  name: string
}

// 定义公众号接口
interface Account {
  name: string
  accountTags?: Array<{ tag: Tag }>
}

// 公众号列表
const accounts = ref<Account[]>([])
const loadingAccounts = ref(false)

// 所有标签列表
const allTags = ref<Tag[]>([])
// 当前选中的标签ID(用于下拉框)
const selectedTagForFilter = ref<string | null>(null)

// 加载所有标签
const loadTags = async (): Promise<void> => {
  try {
    const result = await window.api.tag.list()
    if (result.success) {
      allTags.value = result.data
    }
  } catch (error: unknown) {
    console.error('加载标签列表失败:', error)
  }
}

// 处理标签选择
const handleTagSelect = (tagId: string | null): void => {
  if (!tagId) return

  // 找到选中的标签
  const tag = allTags.value.find((t) => t.id === tagId)
  if (!tag) return

  // 找出拥有该标签的所有公众号
  const accountsWithTag = accounts.value
    .filter((account) => account.accountTags?.some((at) => at.tag.id === tag.id))
    .map((account) => account.name)

  // 合并到现有选择(去重)
  const newSelection = [...new Set([...formState.accountNames, ...accountsWithTag])]
  formState.accountNames = newSelection

  ElMessage.success(`已选择标签"${tag.name}"下的 ${accountsWithTag.length} 个公众号`)

  // 清空选择,以便下次可以再选
  selectedTagForFilter.value = null
}

// 清空选择
const clearSelection = (): void => {
  formState.accountNames = []
  ElMessage.info('已清空选择')
}

// 历史记录相关函数
const loadHistory = (): void => {
  try {
    const saved = localStorage.getItem(SCRAPING_HISTORY_KEY)
    if (saved) {
      scrapingHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载爬取历史失败:', error)
    scrapingHistory.value = []
  }
}

const saveHistory = (item: ScrapingHistoryItem): void => {
  try {
    // 添加到历史记录开头
    scrapingHistory.value.unshift(item)
    // 只保留最近 20 条
    if (scrapingHistory.value.length > 20) {
      scrapingHistory.value = scrapingHistory.value.slice(0, 20)
    }
    localStorage.setItem(SCRAPING_HISTORY_KEY, JSON.stringify(scrapingHistory.value))
  } catch (error) {
    console.error('保存爬取历史失败:', error)
  }
}

const clearHistory = (): void => {
  scrapingHistory.value = []
  localStorage.removeItem(SCRAPING_HISTORY_KEY)
  ElMessage.success('已清空爬取历史')
}

const loadHistoryItem = (item: ScrapingHistoryItem): void => {
  formState.accountNames = [...item.accounts]
  formState.rangeType = item.config.rangeType
  if (item.config.days !== undefined) {
    formState.days = item.config.days
  }
  if (item.config.count !== undefined) {
    formState.count = item.config.count
  }
  ElMessage.success('已加载历史记录')
}

const getRangeText = (config: ScrapingHistoryItem['config']): string => {
  if (config.rangeType === 'all') {
    return '全部文章'
  } else if (config.rangeType === 'days') {
    return `最近 ${config.days} 天`
  } else {
    return `最新 ${config.count} 篇`
  }
}

// 添加日志
const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string): void => {
  scraperStore.addLog(type, message)

  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// 开始爬取
const handleScrape = async (): Promise<void> => {
  if (!formState.accountNames || formState.accountNames.length === 0) {
    ElMessage.warning('请输入要爬取的公众号名称')
    return
  }

  // 过滤空值
  const names = formState.accountNames.map((name) => name.trim()).filter((name) => name.length > 0)

  if (names.length === 0) {
    ElMessage.warning('请输入有效的公众号名称')
    return
  }

  scraperStore.setScraping(true)
  scraperStore.setIsStopped(false) // 重置停止标志
  scraperStore.resetProgress()
  scraperStore.setProgress(0, names.length)

  // 通过全局事件管理器创建开始爬取的通知
  scraperEventsManager.startScraping(names.length)

  try {
    // 调用爬虫 IPC 接口
    const result = await window.api.scraper.start({
      accountNames: names,
      rangeType: formState.rangeType as 'days' | 'count' | 'all',
      days: formState.days,
      count: formState.count
    })

    if (!result.success) {
      addLog('error', `启动爬取失败: ${result.error}`)
      ElMessage.error('启动爬取失败')
      scraperStore.setScraping(false)

      // 更新通知为错误状态
      scraperEventsManager.setScrapingError(result.error || '启动爬取失败')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `启动爬取失败: ${errorMessage}`)
    ElMessage.error('启动爬取失败')
    scraperStore.setScraping(false)

    // 更新通知为错误状态
    scraperEventsManager.setScrapingError(errorMessage)
  }
}

// 停止爬取
const handleStop = async (): Promise<void> => {
  try {
    addLog('warning', '正在停止爬取...')
    scraperStore.setIsStopped(true) // 设置停止标志
    const result = await window.api.scraper.stop()
    if (result.success) {
      scraperStore.setScraping(false)
      // 重置进度条
      scraperStore.resetProgress()
      addLog('warning', '✓ 爬取已停止')
      ElMessage.warning('爬取已停止')

      // 更新通知为警告状态
      scraperEventsManager.setScrapingStopped()
    } else {
      addLog('error', `停止失败: ${result.error}`)
      ElMessage.error('停止失败')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `停止失败: ${errorMessage}`)
    ElMessage.error('停止失败')
  }
}

// 重置表单
const handleReset = async (): Promise<void> => {
  formState.accountNames = []

  // 重置为默认设置
  try {
    const defaultSettings = await window.api.config.get<ScraperDefaultsConfig>('scraperDefaults')
    if (defaultSettings) {
      formState.rangeType = defaultSettings.rangeType || 'days'
      formState.days = defaultSettings.days || 30
      formState.count = defaultSettings.count || 100
    } else {
      // 如果没有保存过设置,使用内置默认值
      formState.rangeType = 'days'
      formState.days = 30
      formState.count = 100
    }
  } catch (error) {
    console.error('加载默认设置失败:', error)
    // 出错时使用内置默认值
    formState.rangeType = 'days'
    formState.days = 30
    formState.count = 100
  }
}

// 清空日志
const handleClearLogs = (): void => {
  scraperStore.clearLogs()
  scraperStore.resetProgress()
}

// 加载公众号列表
const loadAccounts = async (): Promise<void> => {
  try {
    loadingAccounts.value = true
    const result = await window.api.account.list()
    if (result.success) {
      accounts.value = result.data
    }
  } catch (error: unknown) {
    console.error('加载公众号列表失败:', error)
  } finally {
    loadingAccounts.value = false
  }
}

// 监听 logs 变化,自动滚动到底部
watch(
  () => scraperStore.logs.length,
  () => {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }
)

// 组件挂载时加载公众号列表和默认设置
// 注意:IPC 事件监听器已经在 App.vue 中全局注册,这里不需要再注册
onMounted(async () => {
  loadTags()
  loadAccounts()
  loadHistory()

  // 加载爬取默认设置
  try {
    const defaultSettings = await window.api.config.get<ScraperDefaultsConfig>('scraperDefaults')
    if (defaultSettings) {
      formState.rangeType = defaultSettings.rangeType || 'days'
      formState.days = defaultSettings.days || 30
      formState.count = defaultSettings.count || 100
    }
  } catch (error) {
    console.error('加载默认设置失败:', error)
  }

  // 监听爬取完成事件,保存历史记录
  window.api.scraper.onComplete((data) => {
    // 只有当前页面发起的爬取才保存(通过 currentNotificationId 判断不是定时任务)
    if (scraperStore.scraping || formState.accountNames.length > 0) {
      interface ScraperResult {
        success: boolean
      }

      const historyItem: ScrapingHistoryItem = {
        time: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        accounts: [...formState.accountNames],
        config: {
          rangeType: formState.rangeType,
          days: formState.days,
          count: formState.count
        },
        success: data.results ? data.results.some((r: ScraperResult) => r.success) : false
      }
      saveHistory(historyItem)
    }
  })
})
</script>

<style scoped lang="scss">
.scraper {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;

  // 主要内容区域:左右布局
  .scraper-content {
    display: flex;
    gap: 24px;
    flex: 1;
    min-height: 0;
  }

  // 左侧:爬取表单
  .scraper-form {
    flex: 1;
    min-width: 0;
  }

  // 右侧:最近爬取历史
  .scraper-history {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    background: var(--color-surface);
    max-height: 600px;

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);

      .history-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }
    }

    .history-list {
      flex: 1;
      overflow-y: auto;

      .history-empty {
        text-align: center;
        padding: 40px 0;
        color: var(--color-text-secondary);
        font-size: 14px;
      }

      .history-item {
        padding: 12px;
        margin-bottom: 12px;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: var(--color-primary);

        &:hover {
          border-color: var(--color-accent);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .history-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .history-time {
            font-size: 12px;
            color: var(--color-text-secondary);
            font-family: 'Consolas', 'Monaco', monospace;
          }
        }

        .history-accounts {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
          flex-wrap: wrap;

          .history-more {
            font-size: 12px;
            color: var(--color-text-secondary);
          }
        }

        .history-config {
          font-size: 12px;
          color: var(--color-text-secondary);
        }
      }
    }
  }

  // 快速选择区域样式
  .quick-select-area {
    margin-bottom: 12px;

    .quick-select-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .action-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }
    }
  }

  // 控制台样式 - 终端风格
  .scraper-console {
    // margin-top: 24px;
    border-radius: 6px;
    overflow: hidden;
    background: var(--console-bg);
    border: 2px solid var(--console-border);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--console-header-bg);
      border-bottom: 1px solid var(--console-border);

      .console-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--console-title-color);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }

      .console-status {
        font-size: 13px;
        color: var(--color-text-disabled);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }
    }

    // 进度条样式
    :deep(.el-progress) {
      padding: 12px 16px;
      margin: 0;
      background: var(--console-progress-bg);

      .el-progress__text {
        color: var(--console-text-normal);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }
    }

    // 日志区域 - 终端风格
    .console-logs {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: var(--console-bg);
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.8;
      min-height: 0;

      // 滚动条样式
      &::-webkit-scrollbar {
        width: 10px;
      }

      &::-webkit-scrollbar-track {
        background: var(--console-scrollbar-track);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--console-scrollbar-thumb);
        border-radius: 5px;

        &:hover {
          background: var(--console-scrollbar-thumb-hover);
        }
      }

      // 空状态
      .log-empty {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--console-text-disabled);
        opacity: 0.6;

        .log-empty-icon {
          font-size: 16px;
          font-weight: bold;
          color: var(--color-accent);
        }

        .log-empty-text {
          font-size: 13px;
        }
      }

      // 日志条目
      .log-item {
        display: flex;
        gap: 8px;
        padding: 2px 0;
        animation: fadeIn 0.2s ease-in;
        align-items: baseline;

        .log-prefix {
          flex-shrink: 0;
          color: var(--console-prefix-color);
          font-weight: bold;
          font-size: 14px;
        }

        .log-time {
          flex-shrink: 0;
          color: var(--console-time-color);
          font-size: 12px;
          opacity: 0.7;
        }

        .log-message {
          flex: 1;
          word-break: break-word;
        }

        // 不同类型的日志颜色 - 终端风格
        &.log-info {
          .log-prefix {
            color: var(--console-text-info);
          }
          .log-message {
            color: var(--console-text-info);
          }
        }

        &.log-success {
          .log-prefix {
            color: var(--console-text-success);
          }
          .log-message {
            color: var(--console-text-success);
          }
        }

        &.log-warning {
          .log-prefix {
            color: var(--console-text-warning);
          }
          .log-message {
            color: var(--console-text-warning);
          }
        }

        &.log-error {
          .log-prefix {
            color: var(--console-text-error);
          }
          .log-message {
            color: var(--console-text-error);
          }
        }
      }
    }
  }

  // 渐入动画
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 表单 label 跟随主题切换
  :deep(.el-form-item__label) {
    color: var(--color-text-primary);
  }

  // Tag 标签主题色
  :deep(.el-tag) {
    background-color: var(--color-accent) !important;
    border-color: var(--color-accent) !important;
    color: var(--color-primary) !important;
  }
}

// 深色主题下 Scraper 页面的 Tag 为绿色
[data-theme='dark'] .scraper {
  :deep(.el-tag) {
    background-color: #00ff32 !important;
    border-color: #00ff32 !important;
    color: #1a1a1a !important;
  }
}

// 浅色主题下 Scraper 页面的 Tag 为蓝色
[data-theme='light'] .scraper {
  :deep(.el-tag) {
    background-color: #ecf5ff !important;
    border-color: #d9ecff !important;
    color: #409eff !important;
  }
}
</style>
