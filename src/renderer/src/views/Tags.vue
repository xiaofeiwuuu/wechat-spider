<template>
  <div class="tags-page">
    <div class="page-header">
      <el-button type="primary" @click="showCreatePrompt">创建标签</el-button>
    </div>

    <!-- 标签列表 -->
    <el-table v-loading="loading" :data="tagsList" style="width: 100%">
      <el-table-column prop="name" label="标签名称" min-width="150"> </el-table-column>
      <el-table-column prop="_count.accountTags" label="使用数量" min-width="150">
        <template #default="{ row }">
          <span>{{ row._count?.accountTags || 0 }} 个公众号</span>
        </template>
      </el-table-column>
      <el-table-column proxp="createdAt" label="创建时间" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="showEditPrompt(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="deleteTag(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Tag {
  id: string
  name: string
  createdAt: string
  _count?: {
    accountTags: number
  }
}

const loading = ref(false)
const tagsList = ref<Tag[]>([])

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 加载所有标签
const loadTags = async (): Promise<void> => {
  try {
    loading.value = true
    const result = await window.api.tag.list()
    if (result.success) {
      tagsList.value = result.data
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error('加载标签列表失败: ' + message)
  } finally {
    loading.value = false
  }
}

// 显示创建标签提示框
const showCreatePrompt = (): void => {
  ElMessageBox.prompt('请输入标签名称', '创建标签', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '标签名称不能为空'
  })
    .then(async ({ value }) => {
      try {
        loading.value = true
        const result = await window.api.tag.create(value.trim())
        if (result.success) {
          ElMessage.success('标签创建成功')
          await loadTags()
        } else {
          ElMessage.error(result.error || '创建失败')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        ElMessage.error('创建失败: ' + message)
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 显示编辑标签提示框
const showEditPrompt = (tag: Tag): void => {
  ElMessageBox.prompt('请输入标签名称', '编辑标签', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: tag.name,
    inputPattern: /\S+/,
    inputErrorMessage: '标签名称不能为空'
  })
    .then(async ({ value }) => {
      try {
        loading.value = true
        const result = await window.api.tag.update(tag.id, value.trim())
        if (result.success) {
          ElMessage.success('标签更新成功')
          await loadTags()
        } else {
          ElMessage.error(result.error || '更新失败')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        ElMessage.error('更新失败: ' + message)
      } finally {
        loading.value = false
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 删除标签
const deleteTag = async (tag: Tag): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签"${tag.name}"吗? 这将从所有公众号中移除此标签关联。`,
      '确认删除',
      { type: 'warning' }
    )

    loading.value = true
    const result = await window.api.tag.delete(tag.id)
    if (result.success) {
      ElMessage.success('标签删除成功')
      await loadTags()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error: unknown) {
    if (error !== 'cancel') {
      const message = error instanceof Error ? error.message : String(error)
      ElMessage.error('删除失败: ' + message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped lang="scss">
.tags-page {
  height: 100%;
  display: flex;
  flex-direction: column;

  .page-header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    > div:first-child {
      flex: 1;
    }

    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .page-desc {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
