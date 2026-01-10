# 用户管理规范

## 概述

本文档定义了用户资料管理、用户信息同步、用户设置等功能。

## 依赖项

- [认证功能规范](./authentication/spec.md)
- [Supabase profiles 表](../database/profiles.sql)
- [Pinia Store 用户状态管理](../../src/stores/auth.ts)

## ADDED Requirements

### Requirement: 用户资料加载

系统 **MUST** 自动加载并同步用户资料信息。

系统自动加载并同步用户资料信息。

#### Scenario: 登录后加载资料
- 给定 用户成功登录
- 当 认证状态变为已登录
- 那么 自动从 `profiles` 表加载用户资料
- 并且 更新 Pinia Store 中的 profile 状态
- 并且 更新 UI 中的用户信息显示

#### Scenario: 资料字段映射
- 给定 用户资料数据从数据库返回
- 当 字段包含 id, email, phone, full_name, avatar_url
- 那么 正确映射到 User 和 Profile 对象
- 并且 保持字段类型一致性

#### Scenario: 无资料记录处理
- 给定 用户已登录但 profiles 表无记录
- 当 自动创建 profiles 记录
- 并且 使用 auth.users 中的 metadata 填充初始值
- 并且 重新加载资料数据

### Requirement: 用户信息更新

用户 **SHALL** 能够更新自己的基本信息。

用户可以更新自己的基本信息。

#### Scenario: 更新昵称
- 给定 用户已登录
- 当 用户在设置页面修改昵称并保存
- 那么 更新 profiles 表中的 full_name 字段
- 并且 更新成功后显示成功提示
- 并且 UI 中的昵称实时更新

#### Scenario: 更新头像
- 给定 用户已登录
- 当 用户上传新头像
- 那么 上传头像到 Supabase Storage
- 那么 更新 profiles 表中的 avatar_url 字段
- 并且 显示新头像

#### Scenario: 更新手机号
- 给定 用户已登录
- 当 用户修改手机号
- 那么 验证新手机号格式
- 那么 更新 profiles 表中的 phone 字段
- 那么 验证手机号唯一性

#### Scenario: 更新失败处理
- 给定 用户提交更新
- 当 更新操作失败（如网络错误、权限不足）
- 那么 显示错误提示"更新失败，请重试"
- 并且 保留原数据，不清空表单

### Requirement: 用户资料显示

系统 **MUST** 在前端正确显示用户信息。

在前端正确显示用户信息。

#### Scenario: 侧边栏用户菜单
- 给定 用户已登录
- 当 显示侧边栏
- 那么 显示用户头像、昵称
- 并且 显示下拉箭头

#### Scenario: 用户菜单展开
- 给定 用户点击用户菜单
- 当 菜单展开
- 那么 显示用户邮箱或手机号
- 并且 显示菜单项（个人资料、设置、退出登录）

#### Scenario: 未登录状态显示
- 给定 用户未登录
- 当 显示侧边栏
- 那么 显示登录/注册按钮
- 并且 不显示用户信息

### Requirement: 用户设置管理

用户 **SHALL** 能够管理个人设置。

用户可以管理个人设置。

#### Scenario: 个人信息设置
- 给定 用户访问设置页面
- 当 显示个人信息表单
- 那么 预填充当前用户信息
- 并且 允许编辑昵称、头像、手机号

#### Scenario: 安全设置（预留）
- 给定 用户访问安全设置
- 当 显示密码修改表单
- 那么 验证当前密码
- 那么 设置新密码
- 并且 密码强度验证

#### Scenario: 通知设置（预留）
- 给定 用户访问通知设置
- 当 显示通知选项
- 那么 支持开启/关闭消息通知
- 并且 保存设置到数据库

### Requirement: 用户数据同步

系统 **MUST** 确保前端状态与后端数据同步。

确保前端状态与后端数据同步。

#### Scenario: 实时数据同步
- 给定 用户在设备 A 更新资料
- 当 用户在设备 B 访问网站
- 那么 自动加载最新的资料数据
- 并且 保持数据一致性

#### Scenario: 乐观更新
- 给定 用户更新资料
- 当 提交更新请求
- 那么 先更新本地 UI 状态
- 并且 异步同步到服务器
- 如果更新失败，回滚本地状态

#### Scenario: 数据冲突处理
- 给定 用户同时在多个设备修改资料
- 当 最后一次更新覆盖之前修改
- 那么 显示提示"数据已更新，请刷新页面"
- 或者 使用时间戳解决冲突

### Requirement: 用户账号注销

用户 **SHALL** 能够永久删除账号及所有数据。

用户可以永久删除账号及所有数据。

#### Scenario: 账号注销确认
- 给定 用户访问注销页面
- 当 用户点击注销按钮
- 那么 显示确认对话框
- 并且 要求输入"确认注销"
- 并且 提示注销后数据不可恢复

#### Scenario: 执行注销
- 给定 用户确认注销
- 当 提交注销请求
- 那么 服务器端删除 auth.users 记录
- 那么 级联删除 profiles、conversations、messages 等数据
- 并且 清空本地认证状态
- 并且 跳转到登录页

#### Scenario: 注销失败处理
- 给定 用户提交注销
- 当 注销过程中发生错误
- 那么 显示错误提示"注销失败，请稍后重试"
- 并且 不删除本地数据
- 并且 保持登录状态

## 业务规则

### Requirement: 用户名规范
- 昵称长度：2-20 个字符
- 支持中英文、数字、下划线
- 不能包含特殊符号

### Requirement: 头像规范
- 支持格式：JPG, PNG, GIF
- 文件大小：< 2MB
- 尺寸：正方形，最小 100x100px

### Requirement: 手机号规范
- 格式：11 位中国大陆手机号
- 验证：必须为中国大陆有效手机号
- 唯一性：同一手机号只能注册一个账号

### Requirement: 邮箱规范
- 格式：标准邮箱格式
- 唯一性：同一邮箱只能注册一个账号
- 验证：可选发送验证邮件

## 数据模型

### Requirement: profiles 表结构

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Requirement: User 对象类型

```typescript
interface User {
  id: string
  email?: string
  phone?: string
  full_name?: string
  avatar_url?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}
```

### Requirement: Profile Store 状态

```typescript
interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
}
```

## API 接口

### Requirement: 获取当前用户信息

```
GET /api/auth/me
```

**响应**:
```typescript
{
  code: 200,
  data: {
    user: User,
    profile: Profile
  },
  message: 'success'
}
```

### Requirement: 更新用户资料

```
PATCH /api/user/profile
```

**请求体**:
```typescript
{
  full_name?: string
  avatar_url?: string
  phone?: string
}
```

**响应**:
```typescript
{
  code: 200,
  data: Profile,
  message: 'success'
}
```

### Requirement: 删除用户账号

```
DELETE /api/auth/account
```

**响应**:
```typescript
{
  code: 200,
  message: 'success'
}
```

## 性能要求

### Requirement: 响应时间
- 加载用户资料：< 1 秒
- 更新用户信息：< 2 秒
- 头像上传：< 5 秒

### Requirement: 缓存策略
- 用户资料缓存到 Pinia Store
- 页面刷新后自动恢复缓存
- 认证状态变化时清除缓存

## 安全要求

### Requirement: 权限控制
- 用户只能更新自己的资料
- 所有 API 请求验证用户身份
- 启用 RLS 策略防止数据泄露

### Requirement: 数据验证
- 前端验证输入格式
- 后端验证数据完整性
- 防止 XSS 和注入攻击

### Requirement: 隐私保护
- 敏感信息（如手机号）部分隐藏
- 不在前端日志中输出用户信息
- 遵循 GDPR 数据保护要求

## 日志要求

### Requirement: 操作日志
- 记录用户资料更新
- 记录头像上传
- 记录账号注销

### Requirement: 错误日志
- 记录更新失败
- 记录数据同步错误
- 记录权限验证失败

---

**参考文档**:
- [Supabase RLS 策略](https://supabase.com/docs/guides/auth/row-level-security)
- [Vue 组件通信](https://vuejs.org/guide/components/props-emit.html)
- [Pinia 状态管理](https://pinia.vuejs.org/)
