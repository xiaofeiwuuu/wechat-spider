// 主题配置
export interface ThemeConfig {
  name: string
  colors: {
    primary: string // 主色调
    accent: string // 强调色(绿色)
    background: string // 背景色
    surface: string // 卡片/表面背景色
    border: string // 边框颜色
    headerShadow: string // 头部阴影
    text: {
      primary: string // 主要文字
      secondary: string // 次要文字
      disabled: string // 禁用文字
    }
    hover: {
      background: string // hover 背景
      text: string // hover 文字
    }
    selected: {
      background: string // 选中背景
      text: string // 选中文字
    }
    tableHover: {
      background: string // 表格 hover 背景
      text: string // 表格 hover 文字
    }
    input: {
      focusBorder: string // 输入框focus边框颜色
      hoverBorder: string // 输入框hover边框颜色
    }
    button: {
      primaryBorder: string // 主按钮边框颜色
    }
    stats: {
      articles: string // 文章统计颜色
      accounts: string // 公众号统计颜色
      today: string // 今日统计颜色
      month: string // 本月统计颜色
    }
    console: {
      bg: string // 控制台背景
      headerBg: string // 控制台头部背景
      progressBg: string // 进度条背景
      border: string // 控制台边框
      titleColor: string // 标题颜色
      textNormal: string // 正常文本
      textInfo: string // 信息文本
      textSuccess: string // 成功文本
      textWarning: string // 警告文本
      textError: string // 错误文本
      textDisabled: string // 禁用文本
      prefixColor: string // 前缀颜色
      timeColor: string // 时间颜色
      scrollbarTrack: string // 滚动条轨道
      scrollbarThumb: string // 滚动条滑块
      scrollbarThumbHover: string // 滚动条滑块hover
    }
  }
}

// 深色主题 (深灰色)
export const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    primary: '#16171a',
    accent: '#00ff32',
    background: '#101114',
    surface: '#16171a',
    border: '#2c2c2c',
    headerShadow: '0 2px 8px rgba(255, 255, 255, 0.1)',
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0',
      disabled: '#808080'
    },
    hover: {
      background: '#00ff32',
      text: '#000'
    },
    selected: {
      background: '#00ff32',
      text: '#000'
    },
    tableHover: {
      background: '#2a2b2e',
      text: '#e0e0e0'
    },
    input: {
      focusBorder: '#00ff32',
      hoverBorder: '#00ff32'
    },
    button: {
      primaryBorder: '#00ff32'
    },
    stats: {
      articles: '#52c41a', // 绿色
      accounts: '#1890ff', // 蓝色
      today: '#f5222d', // 红色
      month: '#faad14' // 橙色
    },
    console: {
      bg: '#1a1a1a',
      headerBg: '#252525',
      progressBg: '#1f1f1f',
      border: '#00ff32',
      titleColor: '#00ff32',
      textNormal: '#00ff32',
      textInfo: '#888888',
      textSuccess: '#00ff32',
      textWarning: '#ffcc00',
      textError: '#ff4444',
      textDisabled: '#666666',
      prefixColor: '#00ff32',
      timeColor: '#888888',
      scrollbarTrack: '#0d0d0d',
      scrollbarThumb: '#333333',
      scrollbarThumbHover: '#555555'
    }
  }
}

// 浅色主题 (纯白黑)
export const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    primary: '#fff',
    accent: '#409eff', // 蓝色强调色
    background: '#fff',
    surface: '#fff',
    border: '#d9d9d9',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    text: {
      primary: '#000', // 主要文字 - 纯黑
      secondary: '#595959', // 次要文字 - 深灰
      disabled: '#bfbfbf' // 禁用文字 - 浅灰
    },
    hover: {
      background: '#e8f2ff',
      text: '#000'
    },
    selected: {
      background: '#409eff',
      text: '#fff'
    },
    tableHover: {
      background: '#f5f5f5',
      text: '#000'
    },
    input: {
      focusBorder: '#000',
      hoverBorder: '#000'
    },
    button: {
      primaryBorder: '#000'
    },
    stats: {
      articles: '#3f8600', // 深绿色
      accounts: '#1677ff', // 深蓝色
      today: '#cf1322', // 深红色
      month: '#d46b08' // 深橙色
    },
    console: {
      bg: '#ffffff', // 白色背景
      headerBg: '#f5f5f5', // 浅灰色头部
      progressBg: '#fafafa', // 浅灰色进度背景
      border: '#d1d5db', // 浅灰色边框
      titleColor: '#374151', // 深灰色标题
      textNormal: '#22c55e', // 淡绿色正常文本
      textInfo: '#6b7280', // 灰色信息文本
      textSuccess: '#22c55e', // 淡绿色成功文本
      textWarning: '#f59e0b', // 橙色警告
      textError: '#dc2626', // 红色错误
      textDisabled: '#9ca3af', // 灰色禁用
      prefixColor: '#22c55e', // 淡绿色前缀
      timeColor: '#6b7280', // 灰色时间
      scrollbarTrack: '#f5f5f5', // 浅灰色滚动条轨道
      scrollbarThumb: '#d1d5db', // 灰色滚动条滑块
      scrollbarThumbHover: '#9ca3af' // 深灰色滚动条悬停
    }
  }
}

// 默认主题
export const themes = {
  dark: darkTheme,
  light: lightTheme
}

export type ThemeName = keyof typeof themes
