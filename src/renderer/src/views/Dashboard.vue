<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card v-loading="store.isLoading" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon stat-articles">
              <el-icon :size="24">
                <Document />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">总文章数</div>
              <div class="stat-value stat-articles">
                {{ store.statistics.totalArticles }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card v-loading="store.isLoading" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon stat-accounts">
              <el-icon :size="24">
                <User />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">公众号数量</div>
              <div class="stat-value stat-accounts">
                {{ store.statistics.totalAccounts }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card v-loading="store.isLoading" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon stat-today">
              <el-icon :size="24">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">今日爬取</div>
              <div class="stat-value stat-today">
                {{ store.statistics.todayArticles }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card v-loading="store.isLoading" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon stat-month">
              <el-icon :size="24">
                <Calendar />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-title">本月爬取</div>
              <div class="stat-value stat-month">
                {{ store.statistics.monthArticles }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 爬取趋势折线图 -->
    <el-card class="mt-16">
      <template #header>
        <div class="card-header">
          <span>爬取趋势</span>
          <el-radio-group v-model="trendDays" size="small">
            <el-radio-button :value="7">近7天</el-radio-button>
            <el-radio-button :value="14">近14天</el-radio-button>
            <el-radio-button :value="30">近30天</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div class="chart-container">
        <el-empty v-if="store.trendData.length === 0" description="暂无数据" />
        <Line v-else :data="chartData" :options="chartOptions" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Document, User, TrendCharts, Calendar } from '@element-plus/icons-vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useDashboardStore } from '../stores/dashboard'
import { useThemeStore } from '../stores/theme'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const store = useDashboardStore()
const themeStore = useThemeStore()
const trendDays = ref(7)

// Chart.js 数据配置
const chartData = computed(() => ({
  labels: store.trendData.map((item) => dayjs(item.date).format('MM-DD')),
  datasets: [
    {
      label: '文章数量',
      data: store.trendData.map((item) => item.count),
      borderColor: '#00ff32',
      backgroundColor: 'rgba(0, 255, 50, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#00ff32',
      pointBorderColor: themeStore.currentThemeName === 'dark' ? '#000' : '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: '#00ff32',
      pointHoverBorderColor: themeStore.currentThemeName === 'dark' ? '#000' : '#fff',
      pointHoverBorderWidth: 2
    }
  ]
}))

// Chart.js 配置选项
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: themeStore.currentThemeName === 'dark' ? '#16171a' : '#ffffff',
      titleColor: themeStore.currentThemeName === 'dark' ? '#e0e0e0' : '#000000',
      bodyColor: '#00ff32',
      borderColor: themeStore.currentThemeName === 'dark' ? '#2c2c2c' : '#d1d5db',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        title: (context: unknown): string => {
          const ctx = context as Array<{ dataIndex: number }>
          const index = ctx[0].dataIndex
          return dayjs(store.trendData[index].date).format('YYYY-MM-DD')
        },
        label: (context: unknown): string => {
          const ctx = context as { parsed: { y: number } }
          return `${ctx.parsed.y} 篇`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 255, 50, 0.1)',
        drawBorder: false
      },
      ticks: {
        color:
          themeStore.currentThemeName === 'dark'
            ? 'rgba(255, 255, 255, 0.45)'
            : 'rgba(0, 0, 0, 0.45)'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 255, 50, 0.1)',
        drawBorder: false
      },
      ticks: {
        color:
          themeStore.currentThemeName === 'dark'
            ? 'rgba(255, 255, 255, 0.45)'
            : 'rgba(0, 0, 0, 0.45)',
        precision: 0
      }
    }
  }
}))

// 监听趋势天数变化
watch(trendDays, (newDays) => {
  store.fetchTrendData(newDays)
})

// 页面加载时获取数据
onMounted(() => {
  store.refreshAll()
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  min-height: calc(100vh - 112px);

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-content {
      flex: 1;
    }

    .stat-title {
      margin-bottom: 8px;
      color: var(--color-text-secondary);
      font-size: 14px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
    }

    // 统计卡片颜色类
    .stat-articles {
      color: var(--color-stat-articles);
    }

    .stat-accounts {
      color: var(--color-stat-accounts);
    }

    .stat-today {
      color: var(--color-stat-today);
    }

    .stat-month {
      color: var(--color-stat-month);
    }
  }

  .mt-16 {
    margin-top: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .chart-container {
    height: 350px;
    padding: 20px;
  }
}

// 浅色主题下所有统计图标统一为蓝色
[data-theme='light'] .dashboard {
  .stat-icon {
    color: #409eff !important;
  }
}
</style>
