import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { themes, type ThemeName, type ThemeConfig } from '../config/theme'

const THEME_STORAGE_KEY = 'app-theme'

export const useThemeStore = defineStore('theme', () => {
  // 当前主题名称
  const currentThemeName = ref<ThemeName>('dark')

  // 当前主题配置
  const currentTheme = computed<ThemeConfig>(() => themes[currentThemeName.value])

  // 初始化:从 localStorage 读取主题设置
  function initTheme(): void {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null
    if (savedTheme && themes[savedTheme]) {
      currentThemeName.value = savedTheme
    }
    applyTheme()
  }

  // 切换主题
  function setTheme(themeName: ThemeName): void {
    currentThemeName.value = themeName
    localStorage.setItem(THEME_STORAGE_KEY, themeName)
    applyTheme()
  }

  // 应用主题到 CSS 变量
  function applyTheme(): void {
    const theme = currentTheme.value
    const root = document.documentElement

    // 设置主题属性到 html 标签
    root.setAttribute('data-theme', theme.name)

    // 通知主进程更新原生窗口主题
    if (window.api?.theme?.setNativeTheme) {
      window.api.theme.setNativeTheme(theme.name as 'dark' | 'light')
    }

    // 设置基础 CSS 变量
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-border', theme.colors.border)
    root.style.setProperty('--header-shadow', theme.colors.headerShadow)

    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-disabled', theme.colors.text.disabled)

    root.style.setProperty('--color-hover-bg', theme.colors.hover.background)
    root.style.setProperty('--color-hover-text', theme.colors.hover.text)

    root.style.setProperty('--color-selected-bg', theme.colors.selected.background)
    root.style.setProperty('--color-selected-text', theme.colors.selected.text)

    root.style.setProperty('--color-table-hover-bg', theme.colors.tableHover.background)
    root.style.setProperty('--color-table-hover-text', theme.colors.tableHover.text)

    root.style.setProperty('--color-input-focus-border', theme.colors.input.focusBorder)
    root.style.setProperty('--color-input-hover-border', theme.colors.input.hoverBorder)

    root.style.setProperty('--color-button-primary-border', theme.colors.button.primaryBorder)

    // 设置统计卡片 CSS 变量
    root.style.setProperty('--color-stat-articles', theme.colors.stats.articles)
    root.style.setProperty('--color-stat-accounts', theme.colors.stats.accounts)
    root.style.setProperty('--color-stat-today', theme.colors.stats.today)
    root.style.setProperty('--color-stat-month', theme.colors.stats.month)

    // 设置控制台 CSS 变量
    root.style.setProperty('--console-bg', theme.colors.console.bg)
    root.style.setProperty('--console-header-bg', theme.colors.console.headerBg)
    root.style.setProperty('--console-progress-bg', theme.colors.console.progressBg)
    root.style.setProperty('--console-border', theme.colors.console.border)
    root.style.setProperty('--console-title-color', theme.colors.console.titleColor)
    root.style.setProperty('--console-text-normal', theme.colors.console.textNormal)
    root.style.setProperty('--console-text-info', theme.colors.console.textInfo)
    root.style.setProperty('--console-text-success', theme.colors.console.textSuccess)
    root.style.setProperty('--console-text-warning', theme.colors.console.textWarning)
    root.style.setProperty('--console-text-error', theme.colors.console.textError)
    root.style.setProperty('--console-text-disabled', theme.colors.console.textDisabled)
    root.style.setProperty('--console-prefix-color', theme.colors.console.prefixColor)
    root.style.setProperty('--console-time-color', theme.colors.console.timeColor)
    root.style.setProperty('--console-scrollbar-track', theme.colors.console.scrollbarTrack)
    root.style.setProperty('--console-scrollbar-thumb', theme.colors.console.scrollbarThumb)
    root.style.setProperty(
      '--console-scrollbar-thumb-hover',
      theme.colors.console.scrollbarThumbHover
    )
  }

  // 切换深色/浅色主题
  function toggleTheme(): void {
    setTheme(currentThemeName.value === 'dark' ? 'light' : 'dark')
  }

  // 监听主题变化,自动应用
  watch(currentThemeName, () => {
    applyTheme()
  })

  return {
    currentThemeName,
    currentTheme,
    initTheme,
    setTheme,
    toggleTheme,
    applyTheme
  }
})
