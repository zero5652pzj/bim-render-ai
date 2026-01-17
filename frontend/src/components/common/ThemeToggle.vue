<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const isLight = computed(() => themeStore.isLight)

function toggleTheme() {
  themeStore.toggleTheme()
}
</script>

<template>
  <button
    class="theme-toggle"
    :class="{ light: isLight }"
    @click="toggleTheme"
    :title="isLight ? '切换到深色主题' : '切换到浅色主题'"
  >
    <svg
      v-if="isLight"
      class="icon sun-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
    <svg
      v-else
      class="icon moon-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
}

.theme-toggle:hover {
  background: var(--bg-secondary);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.theme-toggle:active {
  transform: translateY(0);
}

.theme-toggle .icon {
  width: 20px;
  height: 20px;
}

/* 浅色主题特殊样式 */
.theme-toggle.light {
  background: #F7F7F8;
  border-color: #D9D9E3;
}

.theme-toggle.light:hover {
  background: #ECECF1;
  border-color: #C4C4CF;
}
</style>
