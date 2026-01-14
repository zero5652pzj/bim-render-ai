<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MessagePlugin } from 'tdesign-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const emailError = ref('')
const passwordError = ref('')

// 实时验证
const validateEmail = () => {
  const email = formData.value.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email) {
    emailError.value = '请输入邮箱地址'
    return false
  }

  if (!emailRegex.test(email)) {
    emailError.value = '请输入有效的邮箱地址'
    return false
  }

  emailError.value = ''
  return true
}

const validatePassword = () => {
  const password = formData.value.password

  if (!password) {
    passwordError.value = '请输入密码'
    return false
  }

  if (password.length < 6) {
    passwordError.value = '密码至少需要 6 位'
    return false
  }

  passwordError.value = ''
  return true
}

const isFormValid = computed(() => {
  return validateEmail() && validatePassword() && formData.value.email && formData.value.password
})

// 登录
async function handleLogin() {
  if (!isFormValid.value) {
    error.value = '请检查表单信息'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await authStore.loginWithPassword(
      formData.value.email,
      formData.value.password
    )

    if (result.success) {
      MessagePlugin.success('登录成功！')

      // 等待认证状态更新后再跳转
      let attempts = 0
      const maxAttempts = 50 // 最多等待5秒 (50 * 100ms)

      const checkAuth = () => {
        if (authStore.isAuthenticated) {
          const redirect = router.currentRoute.value.query.redirect as string
          router.push(redirect || '/')
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkAuth, 100)
        } else {
          // 超时后强制跳转
          const redirect = router.currentRoute.value.query.redirect as string
          router.push(redirect || '/')
        }
      }

      // 开始检查认证状态
      checkAuth()
    } else {
      error.value = result.error || '登录失败，请检查邮箱和密码'
    }
  } catch (err: any) {
    error.value = err.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 处理键盘事件
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && isFormValid.value) {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-container">
    <!-- 动态背景 -->
    <div class="bg-animation">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="bg-particles">
        <div v-for="i in 20" :key="i" class="particle" :style="{
          left: Math.random() * 100 + '%',
          animationDelay: Math.random() * 2 + 's',
          animationDuration: (Math.random() * 3 + 2) + 's'
        }"></div>
      </div>
    </div>

    <div class="login-content">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="url(#logoGradient)" opacity="0.2"/>
            <path d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z" fill="url(#logoGradient)"/>
            <circle cx="50" cy="50" r="15" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <h1 class="logo-title">AI+BIM</h1>
        <p class="logo-subtitle">智能 BIM 建模平台</p>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="card-header">
          <h2 class="card-title">欢迎回来</h2>
          <p class="card-description">登录您的账户以继续使用</p>
        </div>

        <!-- 错误提示 -->
        <Transition name="fade-slide">
          <div v-if="error" class="error-banner">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 邮箱输入 -->
          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <div class="input-wrapper" :class="{ 'error': emailError }">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke-width="2"/>
                <polyline points="22,6 12,13 2,6" stroke-width="2"/>
              </svg>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="form-input"
                :class="{ 'has-value': formData.email }"
                placeholder="请输入邮箱地址"
                @blur="validateEmail"
                @keydown="handleKeydown"
                autocomplete="email"
              />
            </div>
            <Transition name="fade-slide">
              <p v-if="emailError" class="error-text">{{ emailError }}</p>
            </Transition>
          </div>

          <!-- 密码输入 -->
          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <div class="input-wrapper" :class="{ 'error': passwordError }">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2"/>
                <circle cx="12" cy="16" r="1" stroke-width="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2"/>
              </svg>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-input"
                :class="{ 'has-value': formData.password }"
                placeholder="请输入密码"
                @blur="validatePassword"
                @keydown="handleKeydown"
                autocomplete="current-password"
              />
            </div>
            <Transition name="fade-slide">
              <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
            </Transition>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            class="login-button"
            :disabled="loading || !isFormValid"
          >
            <Transition name="button-loading" mode="out-in">
              <div v-if="loading" key="loading" class="button-content">
                <svg class="spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" class="spinner-path"/>
                </svg>
                <span>登录中...</span>
              </div>
              <span v-else key="text">登录</span>
            </Transition>
          </button>
        </form>

        <!-- 底部链接 -->
        <div class="card-footer">
          <p class="footer-text">
            还没有账户？
            <button
              type="button"
              class="link-button"
              @click="router.push('/register')"
            >
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 2rem 1rem;
  overflow: hidden;
}

/* 动态背景 */
.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(
    circle at 30% 40%,
    rgba(59, 130, 246, 0.15) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 70% 60%,
    rgba(139, 92, 246, 0.15) 0%,
    transparent 50%
  );
  animation: gradient-shift 15s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(5%, 5%) rotate(180deg);
  }
}

.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-move 20s linear infinite;
}

@keyframes grid-move {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.bg-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  animation: float infinite ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) translateX(10px);
    opacity: 1;
  }
}

/* 主内容 */
.login-content {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  margin-bottom: 3rem;
  animation: fade-in-up 0.6s ease-out;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  animation: logo-float 3s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.logo-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.logo-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 20px 60px rgba(59, 130, 246, 0.1),
    0 8px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fade-in-up 0.6s ease-out 0.2s backwards;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
}

.card-description {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

/* 错误提示 */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-wrapper.error {
  border-color: #ef4444;
}

.input-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  margin-left: 0.75rem;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  color: #0f172a;
  background: transparent;
}

.form-input::placeholder {
  color: #94a3b8;
}

/* 按钮 */
.login-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.login-button:hover:not(:disabled)::before {
  left: 100%;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.spinner-path {
  transform-origin: center;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 底部 */
.card-footer {
  margin-top: 2rem;
  text-align: center;
}

.footer-text {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.link-button {
  background: none;
  border: none;
  color: #3B82F6;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
  margin-left: 0.25rem;
}

.link-button:hover {
  color: #2563EB;
  text-decoration: underline;
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.button-loading-enter-active,
.button-loading-leave-active {
  transition: all 0.2s ease;
}

/* 响应式 */
@media (max-width: 640px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .logo-title {
    font-size: 2rem;
  }

  .card-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem 1rem;
  }

  .logo-section {
    margin-bottom: 2rem;
  }

  .logo-icon {
    width: 60px;
    height: 60px;
  }

  .logo-title {
    font-size: 1.75rem;
  }
}
</style>
