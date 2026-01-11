# 技术设计文档：将登录/注册从手机号改为邮箱

## 架构概述

本文档详细说明将用户认证方式从手机号改为邮箱的技术实现方案。

## 当前架构

### 数据模型

```sql
profiles 表：
- id: string (主键)
- email: string | null (已存在)
- phone: string | null (已存在)
- full_name: string | null
- avatar_url: string | null
- last_login_at: string | null
- created_at: string
- updated_at: string
```

### 认证流程

当前流程：
1. 用户输入手机号和密码
2. 前端验证手机号格式（中国大陆手机号）
3. 调用 `authStore.loginWithPhonePassword(phone, password)`
4. Supabase 验证手机号和密码
5. 返回认证结果

## 目标架构

### 数据模型

无需变更。`email` 字段已存在于数据库中。

### 认证流程

目标流程：
1. 用户输入邮箱和密码
2. 前端验证邮箱格式（RFC标准）
3. 调用 `authStore.loginWithPassword(email, password)` （已存在方法）
4. Supabase 验证邮箱和密码
5. 返回认证结果

## 详细实现方案

### 1. 前端组件修改

#### 1.1 LoginView.vue

**当前实现**：
```typescript
const formData = ref({
  phone: '',
  password: ''
})

const validatePhone = () => {
  const phone = formData.value.phone
  const phoneRegex = /^1[3-9]\d{9}$/
  // ...
}
```

**目标实现**：
```typescript
const formData = ref({
  email: '',
  password: ''
})

const validateEmail = () => {
  const email = formData.value.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  // ...
}
```

**UI变更**：
- 标签：手机号 → 邮箱
- 占位符：请输入手机号 → 请输入邮箱
- 输入类型：tel → email
- 图标：手机图标 → 邮箱图标
- autocomplete：tel → email

#### 1.2 RegisterView.vue

类似登录页面的修改。

### 2. 状态管理修改

#### 2.1 auth.ts 分析

**现有方法**：
- `loginWithPassword(email, password)` - 已支持邮箱 ✅
- `loginWithPhonePassword(phone, password)` - 手机号登录
- `registerWithEmail(email, password, fullName)` - 已支持邮箱 ✅
- `registerWithPhone(phone, password, fullName)` - 手机号注册

**决策**：
- 保留 `loginWithPhonePassword` 作为兼容方法（可选）
- 优化 `loginWithPassword` 的使用
- 保留 `registerWithPhone` 作为兼容方法（可选）
- 优化 `registerWithEmail` 的使用

### 3. 验证逻辑

#### 3.1 手机号验证 → 邮箱验证

**当前**：
```typescript
const phoneRegex = /^1[3-9]\d{9}$/
```

**目标**：
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 或使用更严格的验证
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
```

### 4. 错误处理

#### 4.1 错误信息更新

| 场景 | 当前信息 | 目标信息 |
|------|----------|----------|
| 空字段 | 请输入手机号 | 请输入邮箱 |
| 格式错误 | 请输入有效的手机号（中国大陆） | 请输入有效的邮箱地址 |
| 登录失败 | 登录失败，请检查手机号和密码 | 登录失败，请检查邮箱和密码 |

### 5. 数据库考虑

#### 5.1 字段使用策略

| 字段 | 当前使用 | 目标使用 |
|------|----------|----------|
| email | 可选，用户资料 | **主要**，登录注册标识 |
| phone | **主要**，登录注册标识 | 可选，保留用于其他功能 |

#### 5.2 数据一致性

- 现有用户的 email 可能为空
- 现有用户的 phone 有值
- 新注册用户只填写 email
- 无需数据迁移

### 6. 安全考虑

#### 6.1 邮箱验证

- 前端验证：基本格式检查
- 后端验证：Supabase 负责（已在 `signUp` 和 `signInWithPassword` 中实现）
- 建议添加更严格的验证（长度、域名格式等）

#### 6.2 密码策略

保持不变（最少6位）

### 7. 向后兼容性

#### 7.1 现有用户

- 已有 phone 的用户不受影响
- 可以继续使用手机号登录（如果保留该方法）
- 建议引导用户添加邮箱

#### 7.2 新用户

- 只能使用邮箱注册
- 必须填写邮箱

### 8. 性能影响

- 无性能影响
- 邮箱验证与手机号验证性能相当
- 数据库查询无需变更

### 9. 测试策略

#### 9.1 单元测试

- 验证函数测试
- 输入验证测试

#### 9.2 集成测试

- 注册流程测试
- 登录流程测试
- 错误处理测试

#### 9.3 手动测试

- UI交互测试
- 响应式设计测试
- 各种浏览器测试

## 实施计划

### 阶段1：前端UI（2天）
1. 修改 LoginView.vue
2. 修改 RegisterView.vue
3. 测试UI功能

### 阶段2：状态管理（1天）
1. 更新 auth.ts
2. 优化方法使用
3. 测试认证流程

### 阶段3：测试验证（2天）
1. 单元测试
2. 集成测试
3. 手动测试
4. 修复问题

### 阶段4：文档和部署（1天）
1. 更新文档
2. 代码审查
3. 部署准备

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 验证逻辑漏洞 | 低 | 中 | 全面测试，使用成熟验证库 |
| UI破坏 | 中 | 中 | 分步实施，保留备份 |
| 数据丢失 | 极低 | 极高 | 只读操作，无需数据库变更 |
| 性能问题 | 极低 | 低 | 无性能敏感变更 |

## 替代方案

### 方案1：渐进式迁移（推荐）
- 先支持邮箱
- 保留手机号作为备选
- 逐步引导用户迁移

### 方案2：一次性切换
- 直接移除手机号支持
- 风险较高
- 不推荐

### 方案3：双模式
- 同时支持手机号和邮箱
- 用户可选择
- 增加复杂度
- 不推荐（违背变更目标）

## 总结

本方案采用渐进式迁移策略，确保：
1. 现有用户不受影响
2. 新用户体验优化
3. 最小化代码变更
4. 降低实施风险

---

**创建时间**: 2026-01-11
**技术负责人**: 待分配
**版本**: 1.0
