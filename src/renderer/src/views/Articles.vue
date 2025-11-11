<template>
  <div class="articles">
    <div class="articles-header">
      <el-space>
        <el-input
          v-model="searchText"
          placeholder="搜索文章标题..."
          style="width: 300px"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <el-icon class="el-input__icon" style="cursor: pointer" @click="handleSearch">
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filterAccountId"
          placeholder="筛选公众号"
          style="width: 200px"
          clearable
          filterable
          @change="handleAccountFilterChange"
        >
          <el-option
            v-for="account in accounts"
            :key="account.id"
            :label="account.name"
            :value="account.id"
          />
        </el-select>
        <el-button :loading="loading" @click="loadArticles">刷新列表</el-button>
      </el-space>
    </div>

    <el-table :data="articles" :loading="loading" row-key="id" height="calc(100vh - 303px)">
      <el-table-column prop="title" label="标题" show-overflow-tooltip />
      <el-table-column label="公众号" width="150">
        <template #default="{ row }">
          {{ row.account?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.publishTime) }}
        </template>
      </el-table-column>
      <el-table-column label="爬取时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row.id)"
              >删除</el-button
            >
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { Article, Account } from '../../../preload/index.d'

// 使用 preload 定义的类型
type ArticleItem = Article
type AccountItem = Account

const route = useRoute()
const router = useRouter()

const searchText = ref('')
const loading = ref(false)
const articles = ref<ArticleItem[]>([])
const accounts = ref<AccountItem[]>([])
const filterAccountId = ref<string>('')

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

// 格式化日期
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载文章列表
const loadArticles = async (): Promise<void> => {
  try {
    loading.value = true
    const result = await window.api.article.list({
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: searchText.value,
      accountId: filterAccountId.value || undefined
    })
    if (result.success) {
      articles.value = result.data.items
      pagination.total = result.data.total
    } else {
      ElMessage.error('加载文章列表失败: ' + result.error)
    }
  } catch (error: unknown) {
    ElMessage.error('加载文章列表失败: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handlePageChange = (page: number): void => {
  pagination.current = page
  loadArticles()
}

// 处理每页条数变化
const handleSizeChange = (size: number): void => {
  pagination.pageSize = size
  pagination.current = 1
  loadArticles()
}

// 搜索文章
const handleSearch = (): void => {
  pagination.current = 1
  loadArticles()
}

// 查看文章
const handleView = (record: ArticleItem): void => {
  // TODO: 打开文章详情对话框或新窗口
  console.log('View article:', record)
  ElMessage.info('文章查看功能开发中...')
}

// 删除文章
const handleDelete = async (id: string): Promise<void> => {
  try {
    await ElMessageBox.confirm('确定删除这篇文章吗?', '确认删除', { type: 'warning' })

    const result = await window.api.article.delete(id)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadArticles()
    } else {
      ElMessage.error('删除失败: ' + result.error)
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
}

// 加载公众号列表
const loadAccounts = async (): Promise<void> => {
  try {
    const result = await window.api.account.list()
    if (result.success) {
      accounts.value = result.data
    }
  } catch (error: unknown) {
    console.error('加载公众号列表失败:', error)
  }
}

// 处理公众号筛选变化
const handleAccountFilterChange = (value: string): void => {
  pagination.current = 1
  if (value) {
    router.push({
      path: '/articles',
      query: { accountId: value }
    })
  } else {
    router.push({ path: '/articles' })
  }
  loadArticles()
}

// 组件挂载时加载数据
onMounted(async () => {
  // 先加载公众号列表
  await loadAccounts()

  // 从路由参数读取公众号筛选条件
  const accountId = route.query.accountId as string

  if (accountId) {
    filterAccountId.value = accountId
  }

  // 加载文章列表
  loadArticles()
})
</script>

<style scoped>
.articles {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.articles-header {
  margin-bottom: 16px;
  flex-shrink: 0;
}
</style>
