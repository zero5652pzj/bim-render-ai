/**
 * 主题类型定义
 */

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeColors {
  // 背景色
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  bgGlass: string

  // 文字颜色
  textPrimary: string
  textSecondary: string
  textMuted: string

  // 边框颜色
  border: string
  borderHover: string

  // 品牌色
  brand: string
  brandHover: string
  brandLight: string

  // 功能色
  accent: string
  success: string
  warning: string
  error: string

  // 阴影
  shadow: string
}

export interface ThemeConfig {
  name: string
  mode: ThemeMode
  colors: ThemeColors
}
