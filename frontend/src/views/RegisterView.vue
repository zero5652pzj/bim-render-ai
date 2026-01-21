<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MessagePlugin } from 'tdesign-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const formErrors = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 验证规则
const validateFullName = () => {
  if (!formData.value.fullName) {
    formErrors.value.fullName = '请输入昵称'
    return false
  }
  formErrors.value.fullName = ''
  return true
}

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.email) {
    formErrors.value.email = '请输入邮箱地址'
    return false
  }
  if (!emailRegex.test(formData.value.email)) {
    formErrors.value.email = '请输入有效的邮箱地址'
    return false
  }
  formErrors.value.email = ''
  return true
}

const validatePassword = () => {
  if (!formData.value.password) {
    formErrors.value.password = '请输入密码'
    return false
  }
  if (formData.value.password.length < 6) {
    formErrors.value.password = '密码至少需要 6 位'
    return false
  }
  formErrors.value.password = ''
  return true
}

const validateConfirmPassword = () => {
  if (!formData.value.confirmPassword) {
    formErrors.value.confirmPassword = '请再次输入密码'
    return false
  }
  if (formData.value.confirmPassword !== formData.value.password) {
    formErrors.value.confirmPassword = '两次输入的密码不一致'
    return false
  }
  formErrors.value.confirmPassword = ''
  return true
}

const isFormValid = computed(() => {
  return validateFullName() && validateEmail() && validatePassword() && validateConfirmPassword()
})

// 注册
async function handleRegister() {
  if (!isFormValid.value) {
    console.log('表单验证失败', {
      fullName: formErrors.value.fullName,
      email: formErrors.value.email,
      password: formErrors.value.password,
      confirmPassword: formErrors.value.confirmPassword
    })
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log('开始注册流程...', {
      email: formData.value.email,
      fullName: formData.value.fullName
    })

    const result = await authStore.registerWithEmail(
      formData.value.email,
      formData.value.password,
      formData.value.fullName
    )

    console.log('注册结果:', result)

    if (result.success) {
      MessagePlugin.success('注册成功！')
      console.log('注册成功，准备跳转...')

      // 等待认证状态更新后再跳转
      let attempts = 0
      const maxAttempts = 50 // 最多等待5秒 (50 * 100ms)

      const checkAuth = () => {
        if (authStore.isAuthenticated) {
          router.push('/')
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(checkAuth, 100)
        } else {
          // 超时后强制跳转
          router.push('/')
        }
      }

      // 开始检查认证状态
      checkAuth()
    } else {
      error.value = result.error || '注册失败，请稍后重试'
      console.error('注册失败:', result.error)
    }
  } catch (err: any) {
    console.error('注册异常:', err)
    error.value = err.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-container">
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

    <div class="register-content">
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

      <!-- 注册卡片 -->
      <div class="register-card">
        <div class="card-header">
          <h2 class="card-title">创建账户</h2>
          <p class="card-description">加入我们，开启智能建模之旅</p>
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

        <!-- 注册表单 -->
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- 昵称输入 -->
          <div class="form-group">
            <label for="fullName" class="form-label">昵称</label>
            <div class="input-wrapper" :class="{ 'error': formErrors.fullName }">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2"/>
                <circle cx="12" cy="7" r="4" stroke-width="2"/>
              </svg>
              <input
                id="fullName"
                v-model="formData.fullName"
                type="text"
                class="form-input"
                :class="{ 'has-value': formData.fullName }"
                placeholder="请输入昵称"
                @blur="validateFullName"
              />
            </div>
            <Transition name="fade-slide">
              <p v-if="formErrors.fullName" class="error-text">{{ formErrors.fullName }}</p>
            </Transition>
          </div>

          <!-- 邮箱输入 -->
          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <div class="input-wrapper" :class="{ 'error': formErrors.email }">
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
                autocomplete="email"
              />
            </div>
            <Transition name="fade-slide">
              <p v-if="formErrors.email" class="error-text">{{ formErrors.email }}</p>
            </Transition>
          </div>

          <!-- 密码输入 -->
          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <div class="input-wrapper" :class="{ 'error': formErrors.password }">
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
                placeholder="请输入密码（至少 6 位）"
                @blur="validatePassword"
                autocomplete="new-password"
              />
            </div>
            <Transition name="fade-slide">
              <p v-if="formErrors.password" class="error-text">{{ formErrors.password }}</p>
            </Transition>
          </div>

          <!-- 确认密码 -->
          <div class="form-group">
            <label for="confirmPassword" class="form-label">确认密码</label>
            <div class="input-wrapper" :class="{ 'error': formErrors.confirmPassword }">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2"/>
                <circle cx="12" cy="16" r="1" stroke-width="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2"/>
              </svg>
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                class="form-input"
                :class="{ 'has-value': formData.confirmPassword }"
                placeholder="请再次输入密码"
                @blur="validateConfirmPassword"
                autocomplete="new-password"
              />
            </div>
            <Transition name="fade-slide">
              <p v-if="formErrors.confirmPassword" class="error-text">{{ formErrors.confirmPassword }}</p>
            </Transition>
          </div>

          <!-- 注册按钮 -->
          <button
            type="submit"
            class="register-button"
            :disabled="loading"
          >
            <Transition name="button-loading" mode="out-in">
              <div v-if="loading" key="loading" class="button-content">
                <svg class="spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" class="spinner-path"/>
                </svg>
                <span>注册中...</span>
              </div>
              <span v-else key="text">立即注册</span>
            </Transition>
          </button>
        </form>

        <!-- 底部链接 -->
        <div class="card-footer">
          <p class="footer-text">
            已有账户？
            <button
              type="button"
              class="link-button"
              @click="router.push('/login')"
            >
              立即登录
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器 */
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 2rem 1rem;
  overflow: hidden;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
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
    color-mix(in srgb, var(--neon-blue) 15%, transparent) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 70% 60%,
    color-mix(in srgb, var(--neon-violet) 15%, transparent) 0%,
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
    linear-gradient(color-mix(in srgb, var(--neon-blue) 5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--neon-blue) 5%, transparent) 1px, transparent 1px);
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
  background: var(--neon-blue);
  opacity: 0.3;
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
    opacity: 0.8;
  }
}

/* 主内容 */
.register-content {
  width: 100%;
  max-width: 440px;
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
  background: linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-violet) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.logo-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* 注册卡片 */
.register-card {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
  animation: fade-in-up 0.6s ease-out 0.2s backwards;
  transition: all 0.3s ease;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
}

.card-description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 注册类型切换 */
.type-switch {
  display: flex;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.switch-btn {
  flex: 1;
  border: none;
  background: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-btn.active {
  background: var(--bg-primary);
  color: var(--brand);
  box-shadow: var(--shadow);
}

/* 错误提示 */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: color-mix(in srgb, var(--error) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--error) 20%, transparent);
  border-radius: 12px;
  color: var(--error);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 表单 */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--bg-tertiary);
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 10%, transparent);
}

.input-wrapper.error {
  border-color: var(--error);
}

.input-icon {
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  margin-left: 0.75rem;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  color: var(--text-primary);
  background: transparent;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.error-text {
  color: var(--error);
  font-size: 0.8rem;
  margin: 0;
}

/* 按钮 */
.register-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%);
  color: #FFFFFF;
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

.register-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.register-button:hover:not(:disabled)::before {
  left: 100%;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--brand) 30%, transparent);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
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
  color: var(--text-secondary);
  margin: 0;
}

.link-button {
  background: none;
  border: none;
  color: var(--brand);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
  margin-left: 0.25rem;
}

.link-button:hover {
  color: var(--brand-hover);
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
  .register-container {
    padding: 1rem;
  }

  .register-card {
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
  .register-card {
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
