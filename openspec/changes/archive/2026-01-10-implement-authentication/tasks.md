# 认证功能实现任务清单

> 变更 ID: `implement-authentication`
> 创建日期: 2026年1月7日

## 任务概览

| 任务类别 | 任务数量 | 预估工期 |
|---------|---------|---------|
| 数据库配置 | 3 | 0.5 天 |
| 前端认证系统 | 5 | 2 天 |
| 后端 API | 3 | 1 天 |
| UI 页面 | 4 | 1 天 |
| 测试与调试 | 3 | 0.5 天 |
| **总计** | **18** | **5 天** |

## 阶段一：数据库配置（Day 1）

### [ ] T1: 配置 Supabase 项目
**预估时间**: 0.5 天

**详细任务**:
1. 创建 Supabase 项目
2. 配置项目设置
3. 获取 API 密钥
4. 配置环境变量
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**完成标准**:
- [x] Supabase 项目创建完成
- [x] 环境变量配置正确
- [x] 本地开发环境可连接 Supabase

**依赖项**:
- Supabase 账号

### [ ] T2: 创建数据库迁移
**预估时间**: 0.5 天

**详细任务**:
1. 创建 profiles 表迁移文件
2. 配置 RLS 策略
3. 创建数据库触发器
4. 应用迁移到本地数据库
5. 生成 TypeScript 类型定义

**完成标准**:
- [x] `profiles` 表创建成功
- [x] RLS 策略启用
- [x] 触发器配置正确
- [x] 类型定义生成

**依赖项**:
- T1 完成

**文件位置**:
```
supabase/migrations/20260107000001_create_profiles.sql
src/types/database.ts
```

### [ ] T3: 配置认证设置
**预估时间**: 0.5 天

**详细任务**:
1. 在 Supabase Dashboard 配置认证设置
2. 启用邮箱认证
3. 启用手机号认证（可选）
4. 配置 JWT 设置
5. 配置站点 URL

**完成标准**:
- [x] 邮箱认证启用
- [x] JWT 过期时间设置
- [x] 站点 URL 配置

**依赖项**:
- T1 完成

## 阶段二：前端认证系统（Day 1-2）

### [ ] T4: 初始化 Supabase 客户端
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/lib/supabase.ts`
2. 配置 Supabase 客户端
3. 设置认证选项
4. 配置 Token 存储
5. 导出类型工具

**完成标准**:
- [x] Supabase 客户端初始化
- [x] 认证配置正确
- [x] Token 自动刷新启用
- [x] 类型导出

**依赖项**:
- T1 完成

**文件位置**:
```
src/lib/supabase.ts
src/types/database.ts
```

**验收检查**:
```typescript
// 测试代码示例
import { supabase } from '@/lib/supabase'

// 验证客户端配置
console.log(supabase.auth.getSession())
```

### [ ] T5: 创建认证 Store
**预估时间**: 1 天

**详细任务**:
1. 创建 `src/stores/auth.ts`
2. 实现状态管理
   - `user`: 当前用户
   - `profile`: 用户资料
   - `loading`: 加载状态
   - `isAuthenticated`: 认证状态
3. 实现认证方法
   - `initialize()`: 初始化认证状态
   - `loginWithPassword()`: 邮箱/密码登录
   - `registerWithEmail()`: 邮箱注册
   - `registerWithPhone()`: 手机号注册
   - `logout()`: 登出
   - `requestPhoneOtp()`: 请求手机验证码（预留）
   - `verifyPhoneOtp()`: 验证手机验证码（预留）
4. 实现用户资料管理
   - `loadProfile()`: 加载用户资料
5. 配置认证状态监听

**完成标准**:
- [x] Pinia Store 创建完成
- [x] 所有认证方法实现
- [x] 状态管理正确
- [x] 认证状态监听配置

**依赖项**:
- T4 完成

**文件位置**:
```
src/stores/auth.ts
```

**验收检查**:
```typescript
// 测试用例
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 登录测试
await authStore.loginWithPassword('test@example.com', 'password123')

// 验证状态
console.log(authStore.isAuthenticated) // true
console.log(authStore.user) // User 对象
```

### [ ] T6: 创建 API 封装
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/lib/api.ts`
2. 配置 Axios 实例
3. 添加请求拦截器（自动添加 Token）
4. 添加响应拦截器（处理 401 错误）
5. 导出 API 客户端

**完成标准**:
- [x] Axios 配置正确
- [x] 请求拦截器工作
- [x] 响应拦截器处理 401
- [x] 错误处理完善

**依赖项**:
- T5 完成

**文件位置**:
```
src/lib/api.ts
```

**验收检查**:
```typescript
// 测试拦截器
api.get('/test') // 自动添加 Authorization header
```

### [ ] T7: 配置路由守卫
**预估时间**: 0.5 天

**详细任务**:
1. 修改 `src/router/index.ts`
2. 添加路由元信息（requiresAuth）
3. 实现 beforeEach 守卫
4. 处理认证状态检查
5. 处理页面跳转逻辑

**完成标准**:
- [x] 路由守卫实现
- [x] 认证状态检查
- [x] 页面跳转逻辑正确
- [x] 递归守卫避免无限循环

**依赖项**:
- T5 完成

**文件位置**:
```
src/router/index.ts
```

**验收检查**:
```typescript
// 测试用例
// 未登录访问受保护页面 → 跳转登录页
// 已登录访问登录页 → 跳转主页
```

### [ ] T8: 实现认证中间件
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/middleware/auth.ts`
2. 检查页面访问权限
3. 处理未登录用户提示
4. 处理登录后跳转

**完成标准**:
- [x] 权限检查实现
- [x] 用户提示显示
- [x] 跳转逻辑正确

**依赖项**:
- T7 完成

**文件位置**:
```
src/middleware/auth.ts
```

## 阶段三：后端 API（Day 2）

### [ ] T9: 创建用户信息 API
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `api/auth/me.ts`
2. 实现获取当前用户信息
3. 验证 JWT Token
4. 返回用户数据

**完成标准**:
- [x] API 路由创建
- [x] Token 验证正确
- [x] 返回数据格式正确

**依赖项**:
- T2 完成

**文件位置**:
```
api/auth/me.ts
```

**验收检查**:
```typescript
// GET /api/auth/me
// 返回用户信息
{
  "code": 200,
  "data": {
    "user": User,
    "profile": Profile
  },
  "message": "success"
}
```

### [ ] T10: 创建用户资料 API
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `api/user/profile.ts`
2. 实现 PATCH 方法
3. 验证用户权限
4. 更新用户资料

**完成标准**:
- [x] API 路由创建
- [x] 权限验证正确
- [x] 数据更新成功

**依赖项**:
- T2 完成

**文件位置**:
```
api/user/profile.ts
```

### [ ] T11: 创建账号注销 API
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `api/auth/delete-account.ts`
2. 实现 DELETE 方法
3. 使用 Service Role Key 删除用户
4. 级联删除业务数据

**完成标准**:
- [x] API 路由创建
- [x] 用户删除成功
- [x] 级联清理数据

**依赖项**:
- T1 完成

**文件位置**:
```
api/auth/delete-account.ts
```

**安全检查**:
```typescript
// 确保使用 Service Role Key
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false }
})
```

## 阶段四：UI 页面开发（Day 2-3）

### [ ] T12: 创建登录页面
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/views/LoginView.vue`
2. 实现表单布局
3. 实现输入验证
4. 实现提交逻辑
5. 添加错误提示

**完成标准**:
- [x] 页面布局正确
- [x] 表单验证工作
- [x] 提交逻辑正确
- [x] 错误提示显示

**依赖项**:
- T5 完成

**文件位置**:
```
src/views/LoginView.vue
```

**组件结构**:
```
LoginView
├── Logo
├── Form
│   ├── EmailInput
│   ├── PasswordInput
│   └── LoginButton
└── SwitchToRegister
```

### [ ] T13: 创建注册页面
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/views/RegisterView.vue`
2. 实现表单布局
3. 实现注册类型切换
4. 实现密码确认验证
5. 添加加载状态

**完成标准**:
- [x] 页面布局正确
- [x] 注册类型切换
- [x] 密码验证正确
- [x] 加载状态显示

**依赖项**:
- T5 完成

**文件位置**:
```
src/views/RegisterView.vue
```

### [ ] T14: 创建认证表单组件
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/components/auth/AuthForm.vue`
2. 实现可复用表单逻辑
3. 添加动画效果
4. 添加无障碍支持

**完成标准**:
- [x] 组件可复用
- [x] 动画效果流畅
- [x] 无障碍支持

**依赖项**:
- T12, T13 完成

**文件位置**:
```
src/components/auth/AuthForm.vue
```

### [ ] T15: 创建用户菜单组件
**预估时间**: 0.5 天

**详细任务**:
1. 创建 `src/components/common/UserMenu.vue`
2. 实现下拉菜单
3. 显示用户信息
4. 添加菜单项
5. 实现登出功能

**完成标准**:
- [x] 菜单显示正确
- [x] 用户信息显示
- [x] 菜单项功能
- [x] 登出功能

**依赖项**:
- T5 完成

**文件位置**:
```
src/components/common/UserMenu.vue
```

## 阶段五：测试与调试（Day 3）

### [ ] T16: 单元测试
**预估时间**: 0.5 天

**详细任务**:
1. 测试认证 Store
2. 测试 API 封装
3. 测试表单验证
4. 测试工具函数

**完成标准**:
- [x] Store 测试覆盖
- [x] API 测试通过
- [x] 表单验证测试
- [x] 代码覆盖率 > 80%

**依赖项**:
- T5, T6 完成

**测试文件**:
```
tests/stores/auth.spec.ts
tests/lib/api.spec.ts
tests/views/LoginView.spec.ts
```

### [ ] T17: 集成测试
**预估时间**: 0.5 天

**详细任务**:
1. 测试登录流程
2. 测试注册流程
3. 测试登出流程
4. 测试路由守卫

**完成标准**:
- [x] 登录流程测试
- [x] 注册流程测试
- [x] 登出流程测试
- [x] 路由守卫测试

**依赖项**:
- T16 完成

### [ ] T18: 调试与修复
**预估时间**: 0.5 天

**详细任务**:
1. 修复测试中发现的问题
2. 优化用户体验
3. 完善错误处理
4. 性能优化

**完成标准**:
- [x] 所有测试通过
- [x] 用户体验流畅
- [x] 错误处理完善
- [x] 性能达标

**依赖项**:
- T16, T17 完成

## 验收标准

### 功能验收

- [ ] **邮箱注册**: 用户可以使用邮箱+密码注册
- [ ] **手机号注册**: 用户可以使用手机号+密码注册
- [ ] **邮箱登录**: 用户可以使用邮箱+密码登录
- [ ] **手机号登录**: 用户可以使用手机号+密码登录
- [ ] **自动登录**: 页面刷新后自动保持登录状态
- [ ] **Token 管理**: Token 自动存储、刷新、验证
- [ ] **登出功能**: 登出清除所有认证信息
- [ ] **用户资料**: 用户资料正确加载和显示
- [ ] **路由守卫**: 未登录用户受保护页面处理
- [ ] **错误处理**: 完善的错误提示和处理

### 性能验收

- [ ] 登录响应时间 < 2 秒
- [ ] 页面加载时认证检查 < 1 秒
- [ ] 路由切换 < 300ms

### 兼容性验收

- [ ] Chrome ≥ 84
- [ ] Firefox ≥ 83
- [ ] Safari ≥ 14.1
- [ ] Edge ≥ 84
- [ ] 移动端 Safari
- [ ] 移动端 Chrome

### 安全验收

- [ ] 密码不在前端日志中输出
- [ ] Token 仅存储在 localStorage
- [ ] 所有 API 请求需要认证
- [ ] RLS 策略正确配置
- [ ] 敏感信息不泄露

## 文档交付

### 开发文档
- [ ] README.md 更新
- [ ] API 文档
- [ ] 组件文档

### 部署文档
- [ ] 环境变量配置说明
- [ ] Supabase 配置指南
- [ ] 部署检查清单

---

**任务负责人**: 开发团队
**预计完成日期**: 2026年1月12日
**实际完成日期**: 待填写
