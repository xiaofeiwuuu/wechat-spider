# 微信公众号爬虫 UI - 样式指南

> 统一的设计规范和样式指南

---

## 🎨 设计原则

1. **简洁明了** - 界面清晰,操作直观
2. **响应迅速** - 快速反馈用户操作
3. **一致性** - 统一的视觉风格和交互模式
4. **易用性** - 降低学习成本,提升用户体验

---

## 🌈 颜色系统

### 主题色
```css
--primary-color: #1890ff     /* 品牌主色 - Ant Design 蓝 */
--success-color: #52c41a     /* 成功 - 绿色 */
--warning-color: #faad14     /* 警告 - 橙色 */
--error-color: #f5222d       /* 错误 - 红色 */
```

### 文本颜色
```css
--text-color: rgba(0, 0, 0, 0.85)      /* 主要文本 */
--text-secondary: rgba(0, 0, 0, 0.65)  /* 次要文本 */
```

### 边框和背景
```css
--border-color: #d9d9d9       /* 边框颜色 */
--background-color: #f0f2f5   /* 页面背景色 */
```

---

## 📐 布局规范

### 间距系统
遵循 8px 栅格系统:

```
8px  - 最小间距
16px - 小间距
24px - 常规间距
32px - 大间距
48px - 超大间距
```

### 页面结构

```
┌─────────────────────────────────────────┐
│  MainLayout (整体布局)                   │
│  ┌────────────┬─────────────────────────┤
│  │            │  Header (64px)          │
│  │  Sider     ├─────────────────────────┤
│  │  (220px)   │                         │
│  │            │  Content                │
│  │            │  (padding: 24px)        │
│  │            │                         │
│  │            ├─────────────────────────┤
│  │            │  Footer (48px)          │
│  └────────────┴─────────────────────────┘
```

#### 尺寸规范:
- **侧边栏宽度**: 220px (展开) / 80px (收起)
- **头部高度**: 64px
- **底部高度**: 48px
- **内容区 padding**: 24px

---

## 🔤 字体规范

### 字体家族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
             'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue',
             Helvetica, Arial, sans-serif;
```

### 字号规范

| 场景 | 字号 | 行高 | 用途 |
|------|------|------|------|
| 超大标题 | 24px | 32px | 页面主标题 |
| 大标题 | 20px | 28px | 卡片标题 |
| 标题 | 16px | 24px | 表单标签、列表标题 |
| 正文 | 14px | 22px | 正文内容 |
| 辅助文字 | 12px | 20px | 说明文字、时间戳 |

### 字重

| 场景 | 字重 | 数值 |
|------|------|------|
| 常规 | Normal | 400 |
| 中等 | Medium | 500 |
| 加粗 | Bold | 600 |

---

## 🎯 组件规范

### 按钮

#### 类型

```vue
<!-- 主按钮 - 重要操作 -->
<a-button type="primary">确认</a-button>

<!-- 次要按钮 - 常规操作 -->
<a-button>取消</a-button>

<!-- 文本按钮 - 轻量操作 -->
<a-button type="link">查看详情</a-button>

<!-- 危险按钮 - 危险操作 -->
<a-button danger>删除</a-button>
```

#### 尺寸

```vue
<a-button size="large">大按钮</a-button>
<a-button>默认按钮</a-button>
<a-button size="small">小按钮</a-button>
```

#### 使用原则

1. 每个操作区域最多一个主按钮
2. 危险操作使用红色/danger 样式
3. 次要操作使用默认样式
4. 按钮文字简洁明了,2-4个字为佳

### 卡片

```vue
<a-card title="卡片标题">
  <template #extra>
    <a-button type="link">更多</a-button>
  </template>

  <p>卡片内容</p>
</a-card>
```

#### 使用规范

- 标题简洁清晰
- 内容区 padding: 24px
- 相邻卡片间距: 16px-24px

### 表单

```vue
<a-form layout="vertical" :model="formState">
  <a-form-item label="表单项" name="field">
    <a-input v-model:value="formState.field" />
  </a-form-item>
</a-form>
```

#### 布局规范

1. **垂直布局** (`vertical`) - 标签在上,输入框在下 (推荐)
2. **水平布局** (`horizontal`) - 标签在左,输入框在右
3. **内联布局** (`inline`) - 表单项横向排列

#### 标签规范

- 标签文字简洁,避免冗余
- 必填项使用红色星号 `*`
- 复杂表单添加说明文字

### 表格

```vue
<a-table
  :columns="columns"
  :data-source="data"
  :pagination="pagination"
  row-key="id"
/>
```

#### 配置规范

1. **必须配置 `row-key`** - 唯一标识
2. **合理设置分页** - 默认每页 10 条
3. **操作列固定右侧** - `fixed: 'right'`
4. **数据为空时显示友好提示**

---

## 🎭 交互规范

### 加载状态

```vue
<!-- 按钮加载 -->
<a-button :loading="isLoading">提交</a-button>

<!-- 页面加载 -->
<a-spin :spinning="isLoading">
  <div>内容</div>
</a-spin>

<!-- 骨架屏 -->
<a-skeleton :loading="isLoading">
  <div>实际内容</div>
</a-skeleton>
```

### 反馈提示

```typescript
import { message, notification } from 'ant-design-vue'

// 成功提示
message.success('操作成功')

// 错误提示
message.error('操作失败')

// 警告提示
message.warning('请注意')

// 通知 (更多信息)
notification.success({
  message: '爬取完成',
  description: '成功爬取 100 篇文章'
})
```

#### 使用原则

1. **message** - 简单反馈,3秒自动关闭
2. **notification** - 复杂信息,包含详细描述
3. **modal.confirm** - 危险操作确认

### 动画效果

#### 页面切换动画

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

#### 悬停效果

```css
.hover-effect {
  transition: all 0.3s ease;
}

.hover-effect:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

## 📱 响应式设计

### 断点

```
xs: <576px   - 手机
sm: ≥576px   - 平板竖屏
md: ≥768px   - 平板横屏
lg: ≥992px   - 小屏桌面
xl: ≥1200px  - 标准桌面
xxl: ≥1600px - 大屏桌面
```

### 适配规则

1. **侧边栏**: 小屏设备自动收起
2. **表格**: 横向滚动或调整列宽
3. **表单**: 垂直布局改为单列

---

## 🔧 代码规范

### Vue 组件结构

```vue
<template>
  <!-- 模板代码 -->
</template>

<script setup lang="ts">
// 1. imports
import { ref } from 'vue'

// 2. props / emits
interface Props {
  title: string
}
const props = defineProps<Props>()

// 3. state
const isLoading = ref(false)

// 4. computed
const displayTitle = computed(() => props.title.toUpperCase())

// 5. methods
const handleSubmit = () => {
  // ...
}

// 6. lifecycle
onMounted(() => {
  // ...
})
</script>

<style scoped lang="scss">
/* 组件样式 */
.component {
  /* ... */
}
</style>
```

### CSS 类命名

使用 **BEM 命名规范**:

```scss
// Block (块)
.article-card { }

// Element (元素)
.article-card__title { }
.article-card__content { }

// Modifier (修饰符)
.article-card--featured { }
```

### TypeScript 类型定义

```typescript
// 使用 interface 定义对象类型
interface Article {
  id: string
  title: string
  content?: string  // 可选属性
}

// 使用 type 定义联合类型
type Status = 'pending' | 'success' | 'error'

// 使用泛型
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}
```

---

## ✅ 最佳实践

### 性能优化

1. **路由懒加载**
   ```typescript
   component: () => import('./views/Dashboard.vue')
   ```

2. **虚拟滚动** (大列表)
   ```vue
   <a-table-v2 :data="largeData" />
   ```

3. **防抖/节流**
   ```typescript
   import { debounce } from 'lodash-es'

   const handleSearch = debounce((value) => {
     // 搜索逻辑
   }, 300)
   ```

### 可访问性

1. **语义化 HTML**
2. **键盘操作支持**
3. **屏幕阅读器兼容**

### 代码质量

1. **ESLint** - 代码规范检查
2. **Prettier** - 代码格式化
3. **TypeScript** - 类型检查

---

## 📚 参考资源

- [Ant Design Vue 官方文档](https://antdv.com/)
- [Vue 3 文档](https://vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [BEM 命名规范](http://getbem.com/)

---

**文档版本:** v1.0
**最后更新:** 2024-01-15
**维护者:** 开发团队
