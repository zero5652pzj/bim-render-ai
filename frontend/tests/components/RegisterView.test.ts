import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterView from '@/views/RegisterView.vue'

// 模拟依赖
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    registerWithPhone: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('tdesign-vue-next', () => ({
  MessagePlugin: {
    success: vi.fn(),
  },
}))

describe('RegisterView', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(RegisterView)
  })

  it('renders registration form', () => {
    expect(wrapper.find('.register-container').exists()).toBe(true)
    expect(wrapper.find('input[id="fullName"]').exists()).toBe(true)
    expect(wrapper.find('input[id="phone"]').exists()).toBe(true)
    expect(wrapper.find('input[id="password"]').exists()).toBe(true)
    expect(wrapper.find('input[id="confirmPassword"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('validates phone number format', async () => {
    const phoneInput = wrapper.find('input[id="phone"]')
    await phoneInput.setValue('123')
    await phoneInput.trigger('blur')

    expect(wrapper.vm.formErrors.phone).toBe('请输入有效的手机号（中国大陆）')
  })

  it('validates full name is required', async () => {
    const fullNameInput = wrapper.find('input[id="fullName"]')
    await fullNameInput.setValue('')
    await fullNameInput.trigger('blur')

    expect(wrapper.vm.formErrors.fullName).toBe('请输入昵称')
  })

  it('validates password length', async () => {
    const passwordInput = wrapper.find('input[id="password"]')
    await passwordInput.setValue('123')
    await passwordInput.trigger('blur')

    expect(wrapper.vm.formErrors.password).toBe('密码至少需要 6 位')
  })

  it('validates password confirmation', async () => {
    const passwordInput = wrapper.find('input[id="password"]')
    const confirmPasswordInput = wrapper.find('input[id="confirmPassword"]')

    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('different-password')
    await confirmPasswordInput.trigger('blur')

    expect(wrapper.vm.formErrors.confirmPassword).toBe('两次输入的密码不一致')
  })

  it('calls registerWithPhone when form is submitted', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    vi.mocked(authStore.registerWithPhone).mockResolvedValue({
      success: true,
      error: null,
    })

    const fullNameInput = wrapper.find('input[id="fullName"]')
    const phoneInput = wrapper.find('input[id="phone"]')
    const passwordInput = wrapper.find('input[id="password"]')
    const confirmPasswordInput = wrapper.find('input[id="confirmPassword"]')

    await fullNameInput.setValue('Test User')
    await phoneInput.setValue('13800138000')
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('password123')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(authStore.registerWithPhone).toHaveBeenCalledWith(
      '13800138000',
      'password123',
      'Test User'
    )
  })

  it('disables submit button when form is invalid', async () => {
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    const fullNameInput = wrapper.find('input[id="fullName"]')
    const phoneInput = wrapper.find('input[id="phone"]')
    const passwordInput = wrapper.find('input[id="password"]')
    const confirmPasswordInput = wrapper.find('input[id="confirmPassword"]')

    await fullNameInput.setValue('Test User')
    await phoneInput.setValue('13800138000')
    await passwordInput.setValue('password123')
    await confirmPasswordInput.setValue('password123')

    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })
})
