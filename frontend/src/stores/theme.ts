/**
 * 主题 Store
 * 管理应用主题状态
 */

import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { themes, type ThemeName } from '@/config/theme'

const THEME_STORAGE_KEY = 'app-theme'

export const useThemeStore = defineStore('theme', () => {
  // 当前主题名称
  const currentTheme = ref<ThemeName>('light')

  // 是否已初始化
  const initialized = ref(false)

  // 当前主题配置
  const themeConfig = computed(() => themes[currentTheme.value])

  // 是否是浅色主题
  const isLight = computed(() => currentTheme.value === 'light')

  // 初始化主题
  function initialize() {
    if (initialized.value) return

    // 从 localStorage 读取用户偏好
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null

    if (savedTheme && savedTheme in themes) {
      currentTheme.value = savedTheme
    } else {
      // 默认使用浅色主题
      currentTheme.value = 'light'
    }

    // 应用主题
    applyTheme(currentTheme.value)
    initialized.value = true

    // 监听系统主题变化 (仅当用户未设置偏好时可选择性跟随，此处为保持默认浅色，暂不强制自动切换)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // 如果用户没有手动设置过主题，则跟随系统
      const hasSavedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (!hasSavedTheme) {
        // currentTheme.value = e.matches ? 'dark' : 'light' // Disable auto-switch to enforce default light unless requested
      }
    })
  }

  // 应用主题到 DOM
  function applyTheme(themeName: ThemeName) {
    const config = themes[themeName]
    const root = document.documentElement

    // 设置 data-theme 属性
    root.setAttribute('data-theme', themeName)

    // 设置 CSS 变量
    const colors = config.colors
    root.style.setProperty('--bg-primary', colors.bgPrimary)
    root.style.setProperty('--bg-secondary', colors.bgSecondary)
    root.style.setProperty('--bg-tertiary', colors.bgTertiary)
    root.style.setProperty('--bg-glass', colors.bgGlass)

    root.style.setProperty('--text-primary', colors.textPrimary)
    root.style.setProperty('--text-secondary', colors.textSecondary)
    root.style.setProperty('--text-muted', colors.textMuted)

    root.style.setProperty('--border', colors.border)
    root.style.setProperty('--border-hover', colors.borderHover)

    root.style.setProperty('--brand', colors.brand)
    root.style.setProperty('--brand-hover', colors.brandHover)
    root.style.setProperty('--brand-light', colors.brandLight)

    root.style.setProperty('--accent', colors.accent)
    root.style.setProperty('--success', colors.success)
    root.style.setProperty('--warning', colors.warning)
    root.style.setProperty('--error', colors.error)

    root.style.setProperty('--shadow', colors.shadow)

    root.style.setProperty('--glass-border', colors.glassBorder)
    root.style.setProperty('--glass-shadow', colors.glassShadow)

    root.style.setProperty('--neon-blue', colors.neonBlue)
    root.style.setProperty('--neon-violet', colors.neonViolet)
    root.style.setProperty('--neon-cyan', colors.neonCyan)
  }

  // 切换主题
  function toggleTheme() {
    const newTheme: ThemeName = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // 设置主题
  function setTheme(themeName: ThemeName) {
    if (!(themeName in themes)) {
      console.warn(`[Theme] Unknown theme: ${themeName}`)
      return
    }

    currentTheme.value = themeName
    localStorage.setItem(THEME_STORAGE_KEY, themeName)
    applyTheme(themeName)
  }

  // 监听主题变化，同步到 CSS
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    currentTheme,
    themeConfig,
    isLight,
    initialized,
    initialize,
    setTheme,
    toggleTheme,
  }
})
