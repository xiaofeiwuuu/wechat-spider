<template>
  <div class="scheduler-logs-page">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-label">总任务数</div>
          <div class="stat-value">{{ stats.totalTasks }}</div>
        </div>
      </el-card>
      <el-card class="stat-card success">
        <div class="stat-content">
          <div class="stat-label">成功任务</div>
          <div class="stat-value">{{ stats.completedTasks }}</div>
        </div>
      </el-card>
      <el-card class="stat-card fail">
        <div class="stat-content">
          <div class="stat-label">失败任务</div>
          <div class="stat-value">{{ stats.failedTasks }}</div>
        </div>
      </el-card>
      <el-card class="stat-card cancel">
        <div class="stat-content">
          <div class="stat-label">取消任务</div>
          <div class="stat-value">{{ stats.cancelledTasks }}</div>
        </div>
      </el-card>
      <el-card class="stat-card rate">
        <div class="stat-content">
          <div class="stat-label">成功率</div>
          <div class="stat-value">{{ stats.successRate }}%</div>
        </div>
      </el-card>
    </div>

    <!-- 日志列表 -->
    <el-card class="logs-card">
      <template #header>
        <div class="card-header">
          <span>执行日志</span>
          <el-button :loading="loading" @click="loadLogs">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="logs" style="width: 100%">
        <el-table-column prop="startTime" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="accountNames" label="公众号" min-width="200">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.accountNames.length > 2"
              :content="row.accountNames.join('、')"
              placement="top"
            >
              <span>{{ row.accountNames.slice(0, 2).join('、') }} 等{{ row.accountCount }}个</span>
            </el-tooltip>
            <span v-else>{{ row.accountNames.join('、') }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="successCount" label="成功" width="80" align="center">
          <template #default="{ row }">
            <span class="success-text">{{ row.successCount }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="failCount" label="失败" width="80" align="center">
          <template #default="{ row }">
            <span class="fail-text">{{ row.failCount }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalArticles" label="文章数" width="100" align="center" />

        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>

        <el-table-column prop="errorMessage" label="错误信息" min-width="200">
          <template #default="{ row }">
            <el-tooltip v-if="row.errorMessage" :content="row.errorMessage" placement="top">
              <span class="error-text">{{ row.errorMessage }}</span>
            </el-tooltip>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

interface SchedulerLog {
  id: string
  startTime: string
  endTime: string | null
  status: string
  accountCount: number
  accountNames: string[]
  successCount: number
  failCount: number
  totalArticles: number
  errorMessage: string | null
  duration: number | null
}

interface Stats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  cancelledTasks: number
  successRate: string
}

const loading = ref(false)
const logs = ref<SchedulerLog[]>([])
const stats = ref<Stats>({
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  cancelledTasks: 0,
  successRate: '0'
})

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载统计信息
const loadStats = async (): Promise<void> => {
  try {
    const result = await window.api.scheduler.getStats()
    if (result.success && result.data) {
      stats.value = result.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 加载日志列表
const loadLogs = async (): Promise<void> => {
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * pageSize.value
    const result = await window.api.scheduler.getLogs({
      limit: pageSize.value,
      offset
    })

    if (result.success && result.data) {
      logs.value = result.data
      total.value = stats.value.totalTasks // 使用总任务数作为总数
    } else {
      ElMessage.error(result.error || '加载日志失败')
    }
  } catch (error: unknown) {
    ElMessage.error((error instanceof Error ? error.message : String(error)) || '加载日志失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (time: string): string => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化耗时
const formatDuration = (duration: number | null): string => {
  if (!duration) return '-'
  if (duration < 60) return `${duration}秒`
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}分${seconds}秒`
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    completed: 'success',
    cancelled: 'warning',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    pending: '进行中',
    completed: '完成',
    cancelled: '已取消',
    failed: '失败'
  }
  return textMap[status] || status
}

// 分页大小改变
const handleSizeChange = (size: number): void => {
  pageSize.value = size
  loadLogs()
}

// 页码改变
const handleCurrentChange = (page: number): void => {
  currentPage.value = page
  loadLogs()
}

onMounted(() => {
  loadStats()
  loadLogs()
})
</script>

<style scoped lang="scss">
.stats-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  &.success {
    border-left: 4px solid #67c23a;
  }

  &.fail {
    border-left: 4px solid #f56c6c;
  }

  &.cancel {
    border-left: 4px solid #e6a23c;
  }

  &.rate {
    border-left: 4px solid #409eff;
  }
}

.stat-content {
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
  }
}

.logs-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.success-text {
  color: #67c23a;
  font-weight: 500;
}

.fail-text {
  color: #f56c6c;
  font-weight: 500;
}

.error-text {
  color: #f56c6c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  max-width: 100%;
}

.text-muted {
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
