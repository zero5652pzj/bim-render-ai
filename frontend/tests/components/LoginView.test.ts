import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginView from '@/views/LoginView.vue'

// 模拟依赖
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    loginWithPhonePassword: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
  }),
}))

vi.mock('tdesign-vue-next', () => ({
  MessagePlugin: {
    success: vi.fn(),
  },
}))

describe('LoginView', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(LoginView)
  })

  it('renders login form', () => {
    expect(wrapper.find('.login-container').exists()).toBe(true)
    expect(wrapper.find('input[type="tel"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('validates phone format', async () => {
    const phoneInput = wrapper.find('input[type="tel"]')
    await phoneInput.setValue('invalid-phone')
    await phoneInput.trigger('blur')

    expect(wrapper.vm.phoneError).toBe('请输入有效的手机号（中国大陆）')
  })

  it('validates password length', async () => {
    const passwordInput = wrapper.find('input[type="password"]')
    await passwordInput.setValue('123')
    await passwordInput.trigger('blur')

    expect(wrapper.vm.passwordError).toBe('密码至少需要 6 位')
  })

  it('disables submit button when form is invalid', async () => {
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    const phoneInput = wrapper.find('input[type="tel"]')
    const passwordInput = wrapper.find('input[type="password"]')

    await phoneInput.setValue('13800138000')
    await passwordInput.setValue('password123')

    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('calls loginWithPhonePassword when form is submitted', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    vi.mocked(authStore.loginWithPhonePassword).mockResolvedValue({
      success: true,
      error: null,
    })

    const phoneInput = wrapper.find('input[type="tel"]')
    const passwordInput = wrapper.find('input[type="password"]')

    await phoneInput.setValue('13800138000')
    await passwordInput.setValue('password123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(authStore.loginWithPhonePassword).toHaveBeenCalledWith('13800138000', 'password123')
  })
})
