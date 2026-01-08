# 单元测试文档

## 测试结构

本项目使用 Vitest + Vue Test Utils + Happy DOM 进行单元测试。

### 测试目录结构

```
tests/
├── setup.ts                  # 测试环境设置
├── api/                      # API 测试
│   ├── auth/
│   │   ├── me.test.ts       # 用户信息 API 测试
│   │   └── delete-account.test.ts  # 账号注销 API 测试
│   └── user/
│       └── profile.test.ts   # 用户资料 API 测试
├── components/               # 组件测试
│   ├── LoginView.test.ts    # 登录页面测试
│   └── RegisterView.test.ts  # 注册页面测试
└── stores/                  # Store 测试
    └── auth.test.ts         # 认证 Store 测试
```

## 测试类型

### 1. API 测试

测试后端 API 端点的功能，包括：
- 认证检查
- 数据验证
- 错误处理
- 响应格式

#### 已测试的 API
- `GET /api/auth/me` - 获取当前用户信息
- `PATCH /api/user/profile` - 更新用户资料
- `DELETE /api/auth/delete-account` - 删除用户账号

### 2. 组件测试

测试 Vue 组件的渲染和交互，包括：
- 组件渲染
- 表单验证
- 用户交互
- 状态更新

#### 已测试的组件
- `LoginView` - 登录页面
- `RegisterView` - 注册页面

### 3. Store 测试

测试 Pinia 状态管理，包括：
- 状态初始化
- 异步操作
- 状态更新
- 错误处理

#### 已测试的 Store
- `auth` - 认证状态管理

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行测试并监听文件变化
```bash
npm run test:watch
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

## 测试覆盖率

我们致力于维护高测试覆盖率：
- API 测试覆盖率：> 80%
- 组件测试覆盖率：> 70%
- Store 测试覆盖率：> 90%

## 最佳实践

1. **测试隔离**：每个测试都应该是独立的，不依赖其他测试
2. **模拟依赖**：使用 `vi.mock()` 模拟外部依赖（如 Supabase、路由器等）
3. **描述性测试**：测试名称应该清晰地描述测试的内容
4. **断言清晰**：使用清晰的断言表达测试的预期结果
5. **清理**：在每个测试后清理模拟和状态

## 模拟说明

### Supabase 模拟
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      // ...
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      // ...
    })),
  },
}))
```

### 路由器模拟
```typescript
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      // ...
    }),
  }
})
```

### Pinia 模拟
```typescript
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    defineStore: vi.fn(() => ({
      // store methods
    })),
  }
})
```

## 注意事项

1. **H3 模拟**：`api/` 中的测试需要模拟 H3 的上下文对象
2. **异步测试**：确保正确处理异步操作（使用 `async/await`）
3. **Vue 组件测试**：使用 `mount()` 或 `shallowMount()` 渲染组件
4. **状态更新**：使用 `await wrapper.vm.$nextTick()` 等待 Vue 更新

## 未来改进

1. 添加 E2E 测试（使用 Playwright 或 Cypress）
2. 增加 API 集成测试
3. 添加性能测试
4. 增加视觉回归测试

## 贡献指南

添加新测试时，请遵循以下步骤：
1. 在适当的目录中创建测试文件
2. 编写清晰的测试用例
3. 确保所有模拟和清理都已正确设置
4. 运行测试以确保它们通过
5. 更新此文档（如果需要）
