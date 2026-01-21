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
      const maxAttempts = 50 // 最多等待5秒

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

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && isFormValid.value) {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 极光背景 -->
    <div class="aurora-bg">
      <div class="aurora-blob blob-1"></div>
      <div class="aurora-blob blob-2"></div>
      <div class="aurora-blob blob-3"></div>
      <div class="noise-overlay"></div>
    </div>

    <div class="login-wrapper">
      <!-- 头部 Logo -->
      <div class="brand-section">
        <div class="logo-box">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>AI+BIM</h1>
          <p>Next Gen Modeling</p>
        </div>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="card-content">
          <div class="header">
            <h2>Welcome Back</h2>
            <p>登录以继续您的创作</p>
          </div>

          <!-- 错误提示 -->
          <Transition name="fade-slide">
            <div v-if="error" class="error-alert">
              <span class="icon">!</span>
              <span>{{ error }}</span>
            </div>
          </Transition>

          <form @submit.prevent="handleLogin" class="form-stack">
            <!-- 邮箱 -->
            <div class="input-group">
              <label for="email">邮箱地址</label>
              <div class="input-field" :class="{ 'has-error': emailError }">
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  placeholder="name@example.com"
                  @blur="validateEmail"
                  @keydown="handleKeydown"
                  autocomplete="email"
                />
              </div>
              <span v-if="emailError" class="field-error">{{ emailError }}</span>
            </div>

            <!-- 密码 -->
            <div class="input-group">
              <label for="password">密码</label>
              <div class="input-field" :class="{ 'has-error': passwordError }">
                <input
                  id="password"
                  v-model="formData.password"
                  type="password"
                  placeholder="••••••••"
                  @blur="validatePassword"
                  @keydown="handleKeydown"
                  autocomplete="current-password"
                />
              </div>
              <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
            </div>

            <!-- 按钮 -->
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading" class="spinner"></span>
              <span v-else>登 录</span>
            </button>
          </form>

          <div class="footer-links">
            <span>还没有账号?</span>
            <a @click="router.push('/register')" class="register-link">立即注册</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc; /* Light Fallback */
  color: #1e293b; /* Dark text */
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 极光背景 - 浅色版 */
.aurora-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
}

.aurora-blob {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
}

.blob-1 {
  width: 60vw;
  height: 60vw;
  background: #bae6fd; /* Light Blue */
  top: -20%;
  left: -10%;
  animation-delay: 0s;
}

.blob-2 {
  width: 50vw;
  height: 50vw;
  background: #ddd6fe; /* Light Violet */
  bottom: -10%;
  right: -10%;
  animation-delay: -5s;
}

.blob-3 {
  width: 40vw;
  height: 40vw;
  background: #bfdbfe; /* Blue */
  top: 40%;
  left: 40%;
  animation-delay: -10s;
}

.noise-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.4; /* Slightly more visible on light */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  pointer-events: none;
  mix-blend-mode: overlay;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* 登录主体 */
.login-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 品牌区 */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.logo-box {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
  color: white;
}

.logo-svg {
  width: 32px;
  height: 32px;
}

.brand-text h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #1e293b, #475569); /* Dark gradient text */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-text p {
  color: #64748b;
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* 卡片样式 - 浅色玻璃 */
.login-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.05); /* Softer shadow */
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.header p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

/* 表单样式 */
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.input-field {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.input-field:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background: #fff;
}

.input-field.has-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.input-field input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  outline: none;
  color: #0f172a;
  font-size: 1rem;
}

.input-field input::placeholder {
  color: #94a3b8;
}

.field-error {
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

/* 按钮 */
.submit-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

/* 底部链接 */
.footer-links {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
}

.register-link {
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  margin-left: 0.5rem;
  text-decoration: none;
  transition: color 0.2s;
}

.register-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* 错误提示 */
.error-alert {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.error-alert .icon {
  width: 18px;
  height: 18px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    background: rgba(255, 255, 255, 0.8);
  }
}
</style>
