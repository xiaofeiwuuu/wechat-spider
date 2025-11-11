<template>
  <div class="accounts">
    <div class="accounts-header">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索公众号名称"
          clearable
          style="width: 250px; margin-right: 12px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedTagFilter"
          placeholder="筛选标签"
          clearable
          multiple
          collapse-tags
          style="width: 250px; margin-right: 12px"
          @change="handleSearch"
        >
          <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id" />
        </el-select>
        <el-button :loading="loadingAccounts" @click="loadAccounts">刷新列表</el-button>
      </div>
      <div v-if="selectedRows.length > 0" class="batch-actions">
        <el-button @click="showBatchTagDialog">批量管理标签</el-button>
        <el-button type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <el-table
      :data="paginatedAccounts"
      :loading="loadingAccounts"
      row-key="id"
      height="calc(100vh - 267px)"
      style="flex: 1; min-height: 0"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="公众号名称" min-width="150" />
      <el-table-column label="标签" min-width="150">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap">
            <el-tag
              v-for="accountTag in row.accountTags"
              :key="accountTag.id"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ accountTag.tag.name }}
            </el-tag>
            <span
              v-if="row.accountTags.length === 0"
              style="color: var(--el-text-color-placeholder); font-size: 12px"
            >
              暂无标签
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="文章数量" width="120">
        <template #default="{ row }">
          <el-tag>{{ row._count?.articles || 0 }} 篇</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="首次爬取时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button type="primary" link size="small" @click="handleManageTags(row)">
              管理标签
            </el-button>
            <el-button type="primary" link size="small" @click="handleViewArticles(row)">
              查看文章
            </el-button>
            <el-button type="danger" link size="small" @click="handleDeleteAccount(row.id)">
              删除
            </el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.current"
      v-model:page-size="pagination.pageSize"
      :total="filteredTotal"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 管理标签对话框 -->
    <el-dialog
      v-model="manageTagsDialogVisible"
      :title="`管理标签 - ${currentAccount?.name}`"
      width="600px"
    >
      <el-select
        v-model="selectedTagsToAdd"
        multiple
        filterable
        placeholder="选择要添加的标签"
        style="width: 100%"
      >
        <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id" />
      </el-select>
      <template #footer>
        <el-button @click="manageTagsDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="addTagsToAccount"> 保存 </el-button>
      </template>
    </el-dialog>

    <!-- 批量管理标签对话框 -->
    <el-dialog v-model="batchTagDialogVisible" title="批量管理标签" width="600px">
      <el-form label-width="100px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="batchTagOperation">
            <el-radio value="add">添加标签</el-radio>
            <el-radio value="remove">移除标签</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择标签">
          <el-select
            v-model="batchTagIds"
            multiple
            filterable
            :placeholder="batchTagOperation === 'add' ? '选择要添加的标签' : '选择要移除的标签'"
            style="width: 100%"
          >
            <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchTagOperation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { Account as BaseAccount, Tag } from '../../../preload/index.d'

const router = useRouter()

// 扩展 Account 类型,确保 accountTags 不为 undefined
type Account = BaseAccount & {
  accountTags: NonNullable<BaseAccount['accountTags']>
}

// 公众号列表状态
const accounts = ref<Account[]>([])
const loadingAccounts = ref(false)

// 所有标签
const allTags = ref<Tag[]>([])

// 搜索和筛选
const searchKeyword = ref('')
const selectedTagFilter = ref<string[]>([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 管理标签对话框
const manageTagsDialogVisible = ref(false)
const currentAccount = ref<Account | null>(null)
const selectedTagsToAdd = ref<string[]>([])

// 批量操作状态
const selectedRows = ref<Account[]>([])
const batchTagDialogVisible = ref(false)
const batchTagOperation = ref<'add' | 'remove'>('add')
const batchTagIds = ref<string[]>([])

// 处理表格选择变化
const handleSelectionChange = (selection: Account[]): void => {
  selectedRows.value = selection
}

// 过滤后的公众号列表
const filteredAccounts = computed(() => {
  let filtered = accounts.value

  // 名称模糊搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter((account) => account.name.toLowerCase().includes(keyword))
  }

  // 标签筛选
  if (selectedTagFilter.value.length > 0) {
    filtered = filtered.filter((account) => {
      const accountTagIds = account.accountTags.map((at) => at.tag.id)
      // 检查是否包含所有选中的标签（AND 逻辑）
      return selectedTagFilter.value.every((tagId) => accountTagIds.includes(tagId))
    })
  }

  return filtered
})

// 过滤后的总数
const filteredTotal = computed(() => filteredAccounts.value.length)

// 计算分页后的数据
const paginatedAccounts = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredAccounts.value.slice(start, end)
})

// 处理搜索
const handleSearch = (): void => {
  // 搜索时重置到第一页
  pagination.current = 1
}

// 管理标签
const handleManageTags = (account: Account): void => {
  currentAccount.value = account
  // 回显已有的标签
  selectedTagsToAdd.value = account.accountTags.map((at) => at.tag.id)
  manageTagsDialogVisible.value = true
}

// 添加标签到公众号
const addTagsToAccount = async (): Promise<void> => {
  if (!currentAccount.value) return

  try {
    loadingAccounts.value = true

    // 获取当前已有的标签ID
    const existingTagIds = currentAccount.value.accountTags.map((at) => at.tag.id)

    // 找出需要添加的标签(新选择的)
    const tagsToAdd = selectedTagsToAdd.value.filter((tagId) => !existingTagIds.includes(tagId))

    // 找出需要移除的标签(取消选择的)
    const tagsToRemove = existingTagIds.filter((tagId) => !selectedTagsToAdd.value.includes(tagId))

    // 添加新标签
    for (const tagId of tagsToAdd) {
      const result = await window.api.account.addTag(currentAccount.value.id, tagId)
      if (!result.success) {
        ElMessage.warning(`添加标签失败: ${result.error}`)
      }
    }

    // 移除取消选择的标签
    for (const tagId of tagsToRemove) {
      const result = await window.api.account.removeTag(currentAccount.value.id, tagId)
      if (!result.success) {
        ElMessage.warning(`移除标签失败: ${result.error}`)
      }
    }

    if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
      ElMessage.success('标签更新成功')
    }

    selectedTagsToAdd.value = []
    manageTagsDialogVisible.value = false
    await loadAccounts()

    // 更新当前账号数据
    const updatedAccount = accounts.value.find((a) => a.id === currentAccount.value?.id)
    if (updatedAccount) {
      currentAccount.value = updatedAccount
    }
  } catch (error: unknown) {
    ElMessage.error('操作失败: ' + (error instanceof Error ? error.message : String(error)))
  } finally {
    loadingAccounts.value = false
  }
}

// 显示批量管理标签对话框
const showBatchTagDialog = (): void => {
  batchTagIds.value = []
  batchTagOperation.value = 'add'
  batchTagDialogVisible.value = true
}

// 处理批量标签操作
const handleBatchTagOperation = async (): Promise<void> => {
  if (batchTagIds.value.length === 0) {
    ElMessage.warning('请选择标签')
    return
  }

  try {
    loadingAccounts.value = true
    const accountIds = selectedRows.value.map((row) => row.id)
    const tagIds = [...batchTagIds.value]

    let result
    if (batchTagOperation.value === 'add') {
      result = await window.api.account.addTagsToAccounts(accountIds, tagIds)
    } else {
      result = await window.api.account.removeTagsFromAccounts(accountIds, tagIds)
    }

    if (result.success) {
      const action = batchTagOperation.value === 'add' ? '添加' : '移除'
      ElMessage.success(`已为 ${selectedRows.value.length} 个公众号${action}标签`)
      batchTagDialogVisible.value = false
      await loadAccounts()
      selectedRows.value = []
    } else {
      const action = batchTagOperation.value === 'add' ? '添加' : '移除'
      ElMessage.error(`批量${action}标签失败: ${result.error}`)
    }
  } catch (error: unknown) {
    const action = batchTagOperation.value === 'add' ? '添加' : '移除'
    ElMessage.error(
      `批量${action}标签失败: ${error instanceof Error ? error.message : String(error)}`
    )
  } finally {
    loadingAccounts.value = false
  }
}

// 批量删除
const batchDelete = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个公众号及其所有文章吗?`,
      '确认删除',
      { type: 'warning' }
    )

    loadingAccounts.value = true
    const ids = selectedRows.value.map((row) => row.id)
    const result = await window.api.account.deleteMany(ids)

    if (result.success) {
      ElMessage.success('删除成功')
      await loadAccounts()
      selectedRows.value = []
    } else {
      ElMessage.error('删除失败: ' + result.error)
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  } finally {
    loadingAccounts.value = false
  }
}

// 查看文章
const handleViewArticles = (account: Account): void => {
  router.push({
    path: '/articles',
    query: {
      accountId: account.id
    }
  })
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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

// 加载公众号列表
const loadAccounts = async (): Promise<void> => {
  try {
    loadingAccounts.value = true
    const result = await window.api.account.list()
    if (result.success) {
      // 确保 accountTags 总是数组
      accounts.value = result.data.map((account) => ({
        ...account,
        accountTags: account.accountTags || []
      })) as Account[]
      // pagination.total 会自动通过 filteredTotal computed 更新
    } else {
      ElMessage.error('加载公众号列表失败: ' + result.error)
    }
  } catch (error: unknown) {
    ElMessage.error(
      '加载公众号列表失败: ' + (error instanceof Error ? error.message : String(error))
    )
  } finally {
    loadingAccounts.value = false
  }
}

// 处理页码变化
const handlePageChange = (page: number): void => {
  pagination.current = page
}

// 处理每页条数变化
const handleSizeChange = (size: number): void => {
  pagination.pageSize = size
  pagination.current = 1
}

// 删除公众号
const handleDeleteAccount = async (id: string): Promise<void> => {
  try {
    await ElMessageBox.confirm('确定删除该公众号及其所有文章吗?', '确认删除', { type: 'warning' })

    const result = await window.api.account.delete(id)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadAccounts()
    } else {
      ElMessage.error('删除失败: ' + result.error)
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadTags()
  loadAccounts()
})
</script>

<style scoped>
.accounts {
  .accounts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .batch-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.accounts-header {
  margin-bottom: 16px;
  flex-shrink: 0;
}
</style>
