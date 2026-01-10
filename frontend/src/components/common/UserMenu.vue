<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MessagePlugin, Dialog } from 'tdesign-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const menuVisible = ref(false)

// 切换菜单显示
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

// 处理菜单显示状态变化
function handleVisibleChange(visible: boolean | null) {
  if (typeof visible === 'boolean') {
    menuVisible.value = visible
  }
}

// 关闭菜单
function closeMenu() {
  menuVisible.value = false
}

// 处理登录按钮点击
function handleLogin() {
  router.push('/login')
}

// 登出
async function handleLogout() {
  try {
    // 先关闭菜单，避免状态更新时 UI 冲突
    closeMenu()

    console.log('[UserMenu] Starting logout...')
    // 执行登出
    const result = await authStore.logout()

    console.log('[UserMenu] Logout result:', result)

    // 显示成功消息
    MessagePlugin.success('已退出登录')

    // 等待一小段时间让状态更新完成
    setTimeout(() => {
      router.push('/login')
    }, 200)
  } catch (error: any) {
    console.error('[UserMenu] Error during logout:', error)

    // 如果是 AbortError，通常表示登出实际上是成功的
    if (error.name === 'AbortError' || error.message.includes('signal is aborted')) {
      MessagePlugin.success('已退出登录')
      setTimeout(() => {
        router.push('/login')
      }, 200)
    } else {
      MessagePlugin.error('退出失败，请重试')
    }
  }
}

// 查看个人资料
function viewProfile() {
  // TODO: 实现个人资料页面
  MessagePlugin.info('个人资料功能开发中')
  closeMenu()
}

// 进入设置
function goToSettings() {
  // TODO: 实现设置页面
  MessagePlugin.info('设置功能开发中')
  closeMenu()
}
</script>

<template>
  <div class="user-menu">
    <!-- 未登录状态：显示登录按钮 -->
    <div v-if="!authStore.isAuthenticated" class="login-section">
      <TButton
        theme="primary"
        variant="outline"
        block
        class="login-button"
        @click="handleLogin"
      >
        <template #icon>
          <TIcon name="login" />
        </template>
        <span>登录</span>
      </TButton>
    </div>

    <!-- 已登录状态：显示用户菜单 -->
    <div v-else class="user-section">
      <TButton
        variant="text"
        block
        class="user-button"
        @click="toggleMenu"
      >
        <div class="user-info">
          <TAvatar
            :image="authStore.profile?.avatar_url"
            :fallback="authStore.profile?.full_name?.[0] || 'U'"
            size="small"
          />
          <span class="user-name">
            {{ authStore.profile?.full_name || '用户' }}
          </span>
        </div>
        <TIcon
          name="chevron-down"
          :class="{ rotated: menuVisible }"
          class="chevron-icon"
        />
      </TButton>

      <!-- 自定义下拉菜单 -->
      <div v-if="menuVisible" class="custom-dropdown">
        <div class="dropdown-mask" @click="closeMenu"></div>
        <div class="dropdown-menu">
          <div class="dropdown-item" @click="viewProfile">
            <TIcon name="user" />
            <span>个人资料</span>
          </div>
          <div class="dropdown-item" @click="goToSettings">
            <TIcon name="setting" />
            <span>设置</span>
          </div>
          <div class="dropdown-item dropdown-item-danger" @click="handleLogout">
            <TIcon name="logout" />
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-menu {
  width: 100%;
}

/* 登录按钮样式 */
.login-section {
  padding: 0;
}

.login-button {
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.3) !important;
  color: white !important;
}

.login-button:hover {
  background: rgba(59, 130, 246, 0.2) !important;
  border-color: rgba(59, 130, 246, 0.5) !important;
  transform: translateY(-1px);
}

.login-button .t-icon {
  font-size: 16px;
  margin-right: 8px;
}

.login-button span {
  font-size: 14px;
  font-weight: 500;
}

.user-button {
  width: 100%;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.user-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  text-align: left;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.chevron-icon {
  transition: transform 0.2s ease;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  flex-shrink: 0;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* TAvatar样式优化 */
:deep(.t-avatar) {
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease;
}

.user-button:hover :deep(.t-avatar) {
  border-color: rgba(255, 255, 255, 0.3);
}

/* 自定义下拉菜单 */
.custom-dropdown {
  position: relative;
  z-index: 1000;
}

.dropdown-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 999;
}

.dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 8px;
  margin-bottom: 8px;
  z-index: 1001;
  animation: dropdown-fade-in 0.2s ease-out;
}

@keyframes dropdown-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.dropdown-item-danger {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 4px;
  padding-top: 8px;
  color: #ff6b6b;
}

.dropdown-item-danger:hover {
  background: rgba(255, 107, 107, 0.1);
  color: #ff5252;
}

.dropdown-item .t-icon {
  font-size: 16px;
}
</style>
