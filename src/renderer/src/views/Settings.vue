<template>
  <div class="settings">
    <el-tabs v-model="activeKey" class="settings-tabs">
      <el-tab-pane label="存储设置" name="storage">
        <el-form label-position="top">
          <el-form-item>
            <template #label>
              <span>默认存储模式</span>
              <el-tooltip content="选择文章内容的存储方式" placement="right">
                <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <el-select v-model="storageMode" style="width: 200px">
              <el-option label="本地文件" value="local" />
              <el-option label="数据库" value="database" />
              <el-option label="双模式" value="both" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <template #label>
              <span>本地存储路径</span>
              <el-tooltip content="爬取的文章HTML文件保存位置" placement="right">
                <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <div class="path-input-group">
              <el-input
                v-model="storagePath"
                placeholder="选择存储路径"
                style="width: calc(100% - 110px)"
              />
              <el-button style="width: 100px; margin-left: 8px" @click="selectStoragePath">
                选择路径
              </el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button :loading="saving" @click="saveStorageSettings"> 保存设置 </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="爬取设置" name="scraper">
        <el-form label-position="top">
          <el-form-item label="默认爬取范围">
            <el-radio-group v-model="scraperDefaults.rangeType">
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

          <el-form-item>
            <template #label>
              <span>默认天数</span>
              <el-tooltip content="按天数爬取时的默认值" placement="right">
                <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <el-input-number v-model="scraperDefaults.days" :min="1" :max="365" :controls="false" />
          </el-form-item>

          <el-form-item>
            <template #label>
              <span>默认文章数量</span>
              <el-tooltip content="按数量爬取时的默认值" placement="right">
                <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <el-input-number
              v-model="scraperDefaults.count"
              :min="1"
              :max="1000"
              :controls="false"
            />
          </el-form-item>

          <el-form-item>
            <template #label>
              <span>请求间隔(秒)</span>
              <el-tooltip content="每个请求之间的等待时间,避免请求过快" placement="right">
                <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <el-input-number v-model="requestInterval" :min="1" :max="60" :controls="false" />
          </el-form-item>

          <el-form-item>
            <el-button :loading="saving" @click="saveScraperSettings"> 保存设置 </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="定时任务" name="scheduler">
        <el-form label-position="top">
          <el-form-item label="启用定时任务">
            <el-tooltip content="关闭应用后定时任务将无法执行,建议启用开机自启动" placement="right">
              <el-switch v-model="schedulerConfig.enabled" />
            </el-tooltip>
          </el-form-item>

          <el-form-item label="开机自启动">
            <el-tooltip content="启用后应用将在系统启动时自动运行" placement="right">
              <el-switch v-model="schedulerConfig.autoLaunch" />
            </el-tooltip>
          </el-form-item>

          <el-form-item label="执行模式">
            <el-radio-group v-model="schedulerConfig.mode">
              <el-tooltip content="每隔固定时间执行一次任务" placement="top">
                <el-radio value="interval">间隔执行</el-radio>
              </el-tooltip>
              <el-tooltip content="在指定的时间点执行任务" placement="top">
                <el-radio value="fixed">定时执行</el-radio>
              </el-tooltip>
            </el-radio-group>
          </el-form-item>

          <!-- 间隔执行配置 -->
          <template v-if="schedulerConfig.mode === 'interval'">
            <el-form-item>
              <template #label>
                <span>执行间隔</span>
                <el-tooltip content="设置任务自动执行的时间间隔" placement="right">
                  <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <div class="interval-input-group">
                <el-input-number
                  v-model="schedulerConfig.intervalValue"
                  :min="1"
                  :max="999"
                  :controls="false"
                  style="width: 120px"
                />
                <el-select
                  v-model="schedulerConfig.intervalUnit"
                  style="width: 100px; margin-left: 8px"
                >
                  <el-option label="分钟" value="minutes" />
                  <el-option label="小时" value="hours" />
                  <el-option label="天" value="days" />
                </el-select>
              </div>
            </el-form-item>
          </template>

          <!-- 定时执行配置 -->
          <template v-if="schedulerConfig.mode === 'fixed'">
            <el-form-item>
              <template #label>
                <span>执行频率</span>
                <el-tooltip content="选择每天执行还是每周特定几天执行" placement="right">
                  <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-radio-group v-model="schedulerConfig.frequency">
                <el-radio value="daily">每天</el-radio>
                <el-radio value="weekly">每周</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <template #label>
                <span>执行时间</span>
                <el-tooltip content="设置每天执行任务的具体时间点" placement="right">
                  <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-time-picker
                v-model="schedulerConfig.time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                style="width: 200px"
              />
            </el-form-item>

            <el-form-item v-if="schedulerConfig.frequency === 'weekly'">
              <template #label>
                <span>星期几</span>
                <el-tooltip content="选择任务在每周哪些天执行" placement="right">
                  <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
              <el-checkbox-group v-model="schedulerConfig.weekDays">
                <el-checkbox :value="1">周一</el-checkbox>
                <el-checkbox :value="2">周二</el-checkbox>
                <el-checkbox :value="3">周三</el-checkbox>
                <el-checkbox :value="4">周四</el-checkbox>
                <el-checkbox :value="5">周五</el-checkbox>
                <el-checkbox :value="6">周六</el-checkbox>
                <el-checkbox :value="0">周日</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </template>

          <el-form-item label="任务冲突处理">
            <el-tooltip content="启用后,如果上次任务还在执行,将跳过本次任务" placement="right">
              <el-switch v-model="schedulerConfig.skipIfRunning" />
            </el-tooltip>
          </el-form-item>

          <el-form-item>
            <template #label>
              <span>要爬取的公众号</span>
              <el-tooltip content="留空则使用爬取页面的配置" placement="right">
                <el-icon style="margin-left: 4px; cursor: help"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
            <div style="display: flex; gap: 8px">
              <el-select
                v-model="selectedTagForFilter"
                placeholder="按标签筛选"
                clearable
                multiple
                collapse-tags
                style="width: 200px"
                @change="filterAccountsByTags"
              >
                <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id" />
              </el-select>
              <el-select
                v-model="schedulerConfig.accountNames"
                multiple
                filterable
                placeholder="选择要定时爬取的公众号"
                style="flex: 1"
              >
                <el-option
                  v-for="account in filteredAccounts"
                  :key="account.name"
                  :label="account.name"
                  :value="account.name"
                />
              </el-select>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button :loading="saving" @click="saveSchedulerSettings"> 保存设置 </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'

const activeKey = ref('storage')
const storageMode = ref('local')
const storagePath = ref('./output')
const requestInterval = ref(10)
const maxPages = ref(10)
const saving = ref(false)

// 爬取默认设置
const scraperDefaults = reactive({
  rangeType: 'days' as 'days' | 'count' | 'all',
  days: 30,
  count: 100
})

// 定时任务配置
const schedulerConfig = reactive({
  enabled: false,
  autoLaunch: false,
  mode: 'interval' as 'interval' | 'fixed',
  intervalValue: 2,
  intervalUnit: 'hours' as 'minutes' | 'hours' | 'days',
  frequency: 'daily' as 'daily' | 'weekly',
  time: null as string | null,
  weekDays: [] as number[],
  skipIfRunning: true,
  accountNames: [] as string[]
})

// 配置类型定义
interface StorageConfig {
  mode: string
  path: string
}

interface ScraperConfig {
  requestInterval: number
  maxPages: number
}

interface ScraperDefaultsConfig {
  rangeType: 'days' | 'count' | 'all'
  days: number
  count: number
}

interface SchedulerConfigData {
  enabled: boolean
  autoLaunch: boolean
  mode: 'interval' | 'fixed'
  intervalValue: number
  intervalUnit: 'minutes' | 'hours' | 'days'
  frequency: 'daily' | 'weekly'
  time: string | null
  weekDays: number[]
  skipIfRunning: boolean
  accountNames: string[]
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
// 所有标签
const allTags = ref<Tag[]>([])
// 标签筛选
const selectedTagForFilter = ref<string[]>([])
// 筛选后的公众号列表
const filteredAccounts = ref<Account[]>([])

// 加载配置
onMounted(async () => {
  try {
    // 加载存储配置
    const storageConfig = await window.api.config.get<StorageConfig>('storage')
    if (storageConfig) {
      storageMode.value = storageConfig.mode || 'local'
      storagePath.value = storageConfig.path || './output'
    }

    // 加载爬取配置
    const scraperConfig = await window.api.config.get<ScraperConfig>('scraper')
    if (scraperConfig) {
      requestInterval.value = scraperConfig.requestInterval || 10
      maxPages.value = scraperConfig.maxPages || 10
    }

    // 加载爬取默认设置
    const scraperDefaultsConfig =
      await window.api.config.get<ScraperDefaultsConfig>('scraperDefaults')
    if (scraperDefaultsConfig) {
      scraperDefaults.rangeType = scraperDefaultsConfig.rangeType || 'days'
      scraperDefaults.days = scraperDefaultsConfig.days || 30
      scraperDefaults.count = scraperDefaultsConfig.count || 100
    }

    // 加载定时任务配置
    const schedulerConfigData = await window.api.config.get<SchedulerConfigData>('scheduler')
    if (schedulerConfigData) {
      schedulerConfig.enabled = schedulerConfigData.enabled || false
      schedulerConfig.autoLaunch = schedulerConfigData.autoLaunch || false
      schedulerConfig.mode = schedulerConfigData.mode || 'interval'
      schedulerConfig.intervalValue = schedulerConfigData.intervalValue || 2
      schedulerConfig.intervalUnit = schedulerConfigData.intervalUnit || 'hours'
      schedulerConfig.frequency = schedulerConfigData.frequency || 'daily'
      schedulerConfig.time = schedulerConfigData.time || null
      schedulerConfig.weekDays = schedulerConfigData.weekDays || []
      schedulerConfig.skipIfRunning = schedulerConfigData.skipIfRunning ?? true
      schedulerConfig.accountNames = schedulerConfigData.accountNames || []
    }

    // 加载公众号列表
    const accountsResult = await window.api.account.list()
    if (accountsResult.success) {
      accounts.value = accountsResult.data
      filteredAccounts.value = accountsResult.data // 初始显示所有公众号
    }

    // 加载标签列表
    const tagsResult = await window.api.tag.list()
    if (tagsResult.success) {
      allTags.value = tagsResult.data
    }
  } catch (error: unknown) {
    console.error('加载配置失败:', error)
  }
})

// 根据标签筛选公众号
const filterAccountsByTags = (): void => {
  if (selectedTagForFilter.value.length === 0) {
    // 没有选择标签,显示所有公众号
    filteredAccounts.value = accounts.value
    return
  }

  // 筛选包含所选标签的公众号
  const filtered = accounts.value.filter((account) => {
    const accountTagIds = account.accountTags?.map((at) => at.tag.id) || []
    // 检查是否包含所有选中的标签（AND 逻辑）
    return selectedTagForFilter.value.every((tagId) => accountTagIds.includes(tagId))
  })

  filteredAccounts.value = filtered

  // 自动将筛选出的公众号名称添加到选中列表
  const filteredAccountNames = filtered.map((account) => account.name)
  // 合并已选中的公众号和筛选出的公众号,去重
  const uniqueAccountNames = Array.from(
    new Set([...schedulerConfig.accountNames, ...filteredAccountNames])
  )
  schedulerConfig.accountNames = uniqueAccountNames
}

// 选择存储路径
async function selectStoragePath(): Promise<void> {
  try {
    const path = await window.api.dialog.selectFolder(storagePath.value)
    if (path) {
      storagePath.value = path
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error('选择路径失败: ' + message)
  }
}

// 保存存储设置
async function saveStorageSettings(): Promise<void> {
  try {
    saving.value = true
    await window.api.config.set(
      'storage',
      {
        mode: storageMode.value,
        path: storagePath.value
      },
      '存储配置'
    )
    ElMessage.success('保存成功')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error('保存失败: ' + message)
  } finally {
    saving.value = false
  }
}

// 保存爬取设置
async function saveScraperSettings(): Promise<void> {
  try {
    saving.value = true

    // 保存爬取默认设置到数据库
    await window.api.config.set(
      'scraperDefaults',
      {
        rangeType: scraperDefaults.rangeType,
        days: scraperDefaults.days,
        count: scraperDefaults.count
      },
      '爬取默认设置'
    )

    // 保存其他爬取配置到数据库
    await window.api.config.set(
      'scraper',
      {
        requestInterval: requestInterval.value,
        maxPages: maxPages.value
      },
      '爬取配置'
    )
    ElMessage.success('保存成功')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error('保存失败: ' + message)
  } finally {
    saving.value = false
  }
}

// 保存定时任务设置
async function saveSchedulerSettings(): Promise<void> {
  try {
    saving.value = true
    // 验证配置
    if (schedulerConfig.enabled) {
      if (schedulerConfig.mode === 'fixed' && !schedulerConfig.time) {
        ElMessage.warning('请选择执行时间')
        return
      }
      if (
        schedulerConfig.mode === 'fixed' &&
        schedulerConfig.frequency === 'weekly' &&
        schedulerConfig.weekDays.length === 0
      ) {
        ElMessage.warning('请选择至少一个星期几')
        return
      }
    }

    // 将 Vue Proxy 对象转换为普通对象,避免 IPC 序列化问题
    const configData = {
      enabled: schedulerConfig.enabled,
      autoLaunch: schedulerConfig.autoLaunch,
      mode: schedulerConfig.mode,
      intervalValue: schedulerConfig.intervalValue,
      intervalUnit: schedulerConfig.intervalUnit,
      frequency: schedulerConfig.frequency,
      time: schedulerConfig.time,
      weekDays: [...schedulerConfig.weekDays], // 转换为普通数组
      skipIfRunning: schedulerConfig.skipIfRunning,
      accountNames: [...schedulerConfig.accountNames] // 转换为普通数组
    }

    // 保存配置到数据库
    await window.api.config.set('scheduler', configData, '定时任务配置')
    // 如果启用了定时任务,通知主进程启动调度器
    if (schedulerConfig.enabled) {
      await window.api.scheduler.start()
    } else {
      await window.api.scheduler.stop()
    }

    // 设置开机自启动
    if (schedulerConfig.autoLaunch) {
      await window.api.scheduler.enableAutoLaunch()
    } else {
      await window.api.scheduler.disableAutoLaunch()
    }

    ElMessage.success('保存成功')
  } catch (error: unknown) {
    console.error('[Settings] ❌ 保存失败:', error)
    console.error('[Settings] 错误类型:', typeof error)
    console.error('[Settings] 错误详情:', error)
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error('保存失败: ' + message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.path-input-group {
  display: flex;
  align-items: center;
  width: 100%;
}

.interval-input-group {
  display: flex;
  align-items: center;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.settings-tabs :deep(.el-tabs__item) {
  color: var(--color-text-secondary);
}

.settings-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-accent);
}

.settings-tabs :deep(.el-tabs__active-bar) {
  background: var(--color-accent);
}

.settings-tabs :deep(.el-tabs__item:hover) {
  color: var(--color-accent);
}

.settings-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.settings :deep(.el-form-item__label) {
  color: var(--color-text-primary);
}
</style>
