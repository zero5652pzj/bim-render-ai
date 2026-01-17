/**
 * 主题配置
 * 参考 ChatGPT 浅色主题设计
 */

import type { ThemeConfig } from '@/types/theme'

/**
 * 深色主题 (默认科技感主题)
 */
export const darkTheme: ThemeConfig = {
  name: '深色',
  mode: 'dark',
  colors: {
    // 背景色
    bgPrimary: '#0F172A',
    bgSecondary: '#1E1B4B',
    bgTertiary: 'rgba(15, 23, 42, 0.4)',
    bgGlass: 'rgba(15, 23, 42, 0.75)',

    // 文字颜色
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.6)',

    // 边框颜色
    border: 'rgba(59, 130, 246, 0.25)',
    borderHover: 'rgba(59, 130, 246, 0.4)',

    // 品牌色
    brand: '#3B82F6',
    brandHover: '#2563EB',
    brandLight: '#60A5FA',

    // 功能色
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // 阴影
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
}

/**
 * 浅色主题 (参考 ChatGPT)
 */
export const lightTheme: ThemeConfig = {
  name: '浅色',
  mode: 'light',
  colors: {
    // 背景色
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F7F7F8',
    bgTertiary: '#ECECF1',
    bgGlass: 'rgba(255, 255, 255, 0.85)',

    // 文字颜色
    textPrimary: '#2D333A',
    textSecondary: '#6E6E80',
    textMuted: '#8E8EA0',

    // 边框颜色
    border: '#D9D9E3',
    borderHover: '#C4C4CF',

    // 品牌色 - 使用蓝色系保持一致
    brand: '#3B82F6',
    brandHover: '#2563EB',
    brandLight: '#60A5FA',

    // 功能色
    accent: '#10A37F',
    success: '#10A37F',
    warning: '#F59E0B',
    error: '#EF4444',

    // 阴影
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
}

export const themes = {
  light: lightTheme,
  dark: darkTheme,
}

export type ThemeName = keyof typeof themes
