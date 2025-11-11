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

    <!-- 文章详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentArticle?.title"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <template #header="{ titleId, titleClass }">
        <div class="dialog-header">
          <span :id="titleId" :class="titleClass">{{ currentArticle?.title }}</span>
          <div class="dialog-header-actions">
            <el-button size="small" @click="copyArticleContent">复制原文</el-button>
            <el-button size="small" @click="downloadImages">下载本文图片</el-button>
          </div>
        </div>
      </template>
      <div v-if="currentArticle" class="article-detail">
        <div class="article-content">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            v-if="currentArticle.content"
            class="article-body"
            v-html="processArticleContent(currentArticle.content)"
          ></div>
          <el-empty v-else description="暂无内容">
            <el-button type="primary" @click="openInBrowser"> 在浏览器中查看 </el-button>
          </el-empty>

          <!-- 文章底部信息 -->
          <div v-if="currentArticle.content" class="article-footer">
            <div class="article-info">
              <span class="publish-time"
                >发布时间: {{ formatDate(currentArticle.publishTime) }}</span
              >
              <el-link
                :href="currentArticle.url"
                target="_blank"
                type="primary"
                class="original-link"
              >
                查看原文
              </el-link>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openInBrowser">在浏览器中打开</el-button>
      </template>
    </el-dialog>
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

// 文章详情对话框
const detailDialogVisible = ref(false)
const currentArticle = ref<ArticleItem | null>(null)

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

// 处理文章内容中的图片链接
const processArticleContent = (content: string): string => {
  if (!content) return ''

  let processed = content

  // 1. 首先处理 Markdown 格式的图片 ![alt](url) - 替换为占位符
  const imageMap = new Map<string, { alt: string; url: string }>()
  let imageIndex = 0

  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
    const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
    imageMap.set(placeholder, { alt: alt || '图片', url: url.trim() })
    imageIndex++
    return placeholder
  })

  // 2. 处理 HTML <img> 标签
  processed = processed.replace(/<img[^>]*?>/gi, (match) => {
    const dataSrcMatch = match.match(/data-src=["']([^"']+)["']/)
    const srcMatch = match.match(/src=["']([^"']+)["']/)
    const src = dataSrcMatch ? dataSrcMatch[1] : srcMatch ? srcMatch[1] : ''

    const altMatch = match.match(/alt=["']([^"']*)["']/)
    const alt = altMatch && altMatch[1] ? altMatch[1] : '图片'

    if (src) {
      const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
      imageMap.set(placeholder, { alt, url: src.trim() })
      imageIndex++
      return placeholder
    }
    return match
  })

  // 3. 检查内容是否包含 HTML 标签
  const hasHtmlTags = /<[^>]+>/.test(processed)

  // 4. 如果是纯 Markdown,转换换行符为 HTML
  if (!hasHtmlTags) {
    // 将 Markdown 的双换行转换为段落,单换行转换为 <br>
    processed = processed
      .split('\n\n')
      .map((para) => {
        if (para.trim()) {
          return `<p>${para.replace(/\n/g, '<br>')}</p>`
        }
        return ''
      })
      .filter((para) => para)
      .join('\n')
  }

  // 5. 最后将所有占位符替换为实际的图片链接
  imageMap.forEach((img, placeholder) => {
    const link = `<a href="${img.url}" target="_blank" class="image-link">[${img.alt}]</a>`
    processed = processed.replace(placeholder, link)
  })

  return processed
}

// 查看文章
const handleView = (record: ArticleItem): void => {
  currentArticle.value = record
  detailDialogVisible.value = true
}

// 在浏览器中打开
const openInBrowser = (): void => {
  if (currentArticle.value?.url) {
    window.open(currentArticle.value.url, '_blank')
  }
}

// 复制原文内容(去除图片链接)
const copyArticleContent = async (): Promise<void> => {
  if (!currentArticle.value?.content) {
    ElMessage.warning('暂无内容可复制')
    return
  }

  try {
    // 处理内容:去除图片标记,只保留纯文本
    let content = currentArticle.value.content

    // 移除 Markdown 格式的图片
    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '')

    // 移除 HTML <img> 标签
    content = content.replace(/<img[^>]*?>/gi, '')

    // 清理多余的空行
    content = content.replace(/\n{3,}/g, '\n\n').trim()

    // 复制到剪贴板
    await navigator.clipboard.writeText(content)
    ElMessage.success('复制成功')
  } catch (error: unknown) {
    ElMessage.error('复制失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

// 下载本文所有图片
const downloadImages = async (): Promise<void> => {
  if (!currentArticle.value?.content || !currentArticle.value?.title) {
    ElMessage.warning('暂无图片可下载')
    return
  }

  try {
    const content = currentArticle.value.content
    const imageUrls: string[] = []

    // 提取 Markdown 格式的图片 URL
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
    let match
    while ((match = markdownImageRegex.exec(content)) !== null) {
      imageUrls.push(match[2].trim())
    }

    // 提取 HTML <img> 标签中的 URL
    const htmlImageRegex = /<img[^>]*?(?:data-src|src)=["']([^"']+)["'][^>]*?>/gi
    while ((match = htmlImageRegex.exec(content)) !== null) {
      const dataSrcMatch = match[0].match(/data-src=["']([^"']+)["']/)
      const srcMatch = match[0].match(/src=["']([^"']+)["']/)
      const url = dataSrcMatch ? dataSrcMatch[1] : srcMatch ? srcMatch[1] : ''
      if (url) {
        imageUrls.push(url.trim())
      }
    }

    if (imageUrls.length === 0) {
      ElMessage.warning('本文暂无图片')
      return
    }

    // 去重
    const uniqueUrls = [...new Set(imageUrls)]

    const loadingMessage = ElMessage.info({
      message: `正在下载 ${uniqueUrls.length} 张图片...`,
      duration: 0
    })

    // 调用主进程下载图片
    const result = await window.api.file.downloadImages(uniqueUrls, currentArticle.value.title)

    loadingMessage.close()

    if (result.success) {
      const { success, failed, folder } = result.data
      ElMessage.success({
        message: `成功下载 ${success} 张图片${failed > 0 ? `,失败 ${failed} 张` : ''}`,
        duration: 3000
      })

      // 询问是否打开文件夹
      ElMessageBox.confirm(`图片已保存到本地,是否打开文件夹查看?`, '下载完成', {
        confirmButtonText: '打开文件夹',
        cancelButtonText: '取消',
        type: 'success'
      })
        .then(async () => {
          await window.api.file.showInFolder(folder)
        })
        .catch(() => {
          // 用户取消,不做任何操作
        })
    } else {
      ElMessage.error('下载失败: ' + result.error)
    }
  } catch (error: unknown) {
    ElMessage.error('下载失败: ' + (error instanceof Error ? error.message : String(error)))
  }
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

/* 对话框头部样式 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 40px; /* 为关闭按钮留出空间 */
}

.dialog-header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 文章详情样式 */
.article-detail {
  max-height: 70vh;
  overflow-y: auto;
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.article-content {
  padding: 20px;
  background-color: var(--color-surface);
  border-radius: 8px;
  max-height: 60vh;
  overflow-y: auto;
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.article-body {
  line-height: 1.8;
  font-size: 15px;
  color: var(--color-text);
  word-wrap: break-word;
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

/* 允许文章内所有元素都可选择 */
.article-body :deep(*) {
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

/* 文章内容样式 */
.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  border-radius: 4px;
}

.article-body :deep(p) {
  margin: 12px 0;
  text-align: justify;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4),
.article-body :deep(h5),
.article-body :deep(h6) {
  margin: 20px 0 12px;
  font-weight: 600;
  color: var(--color-text);
}

.article-body :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
}

.article-body :deep(a:hover) {
  text-decoration: underline;
}

.article-body :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

.article-body :deep(code) {
  background-color: var(--color-background);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 0.9em;
}

.article-body :deep(pre) {
  background-color: var(--color-background);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.article-body :deep(li) {
  margin: 6px 0;
}

.article-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.article-body :deep(table th),
.article-body :deep(table td) {
  border: 1px solid var(--el-border-color);
  padding: 8px 12px;
  text-align: left;
}

.article-body :deep(table th) {
  background-color: var(--color-background);
  font-weight: 600;
}

.article-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color);
  margin: 24px 0;
}

.article-body :deep(strong) {
  font-weight: 600;
}

.article-body :deep(em) {
  font-style: italic;
}

/* 图片链接样式 */
.article-body :deep(.image-link) {
  display: inline-block;
  padding: 4px 12px;
  margin: 8px 4px;
  background-color: var(--color-primary);
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.article-body :deep(.image-link:hover) {
  background-color: var(--el-color-primary-light-3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.article-body :deep(.image-link:active) {
  transform: translateY(0);
}

/* 文章底部信息 */
.article-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color);
}

.article-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.publish-time {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.original-link {
  font-size: 14px;
  font-weight: 500;
}
</style>
