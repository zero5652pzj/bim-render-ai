# 登录/注册页面 UI 规范

## 概述

本文档定义了登录和注册页面的用户界面设计、交互行为和用户体验要求。

## 依赖项

- [TDesign Vue Next](https://tdesign.tencent.com/vue-next/overview)
- [Vue Router](https://router.vuejs.org/)
- [认证功能规范](../authentication/spec.md)

## ADDED Requirements

### Requirement: 登录页面布局

系统 **MUST** 采用居中卡片布局，支持响应式设计。

登录页面采用居中卡片布局，支持响应式设计。

#### Scenario: 页面整体布局
- 给定 用户访问 /login 页面
- 当 页面加载完成
- 那么 显示居中的登录卡片
- 并且 卡片宽度为 400px（桌面端）/ 90%（移动端）
- 并且 背景为渐变色或纯色

#### Scenario: 登录表单结构
- 给定 显示登录表单
- 当 用户查看表单
- 那么 包含以下字段：
  - 邮箱/手机号输入框（必填）
  - 密码输入框（必填）
  - 登录按钮
  - 链接到注册页面
- 并且 字段垂直排列，间距 16px

#### Scenario: 品牌标识
- 给定 显示登录页面
- 当 用户查看页面
- 那么 在卡片顶部显示 "AI+BIM" Logo
- 并且 Logo 下方显示副标题"智能 BIM 建模平台"
- 并且 使用品牌色彩方案

### Requirement: 登录表单交互

系统 **MUST** 实现表单输入验证、错误提示和提交行为。

表单的输入验证、错误提示和提交行为。

#### Scenario: 输入验证
- 给定 用户输入邮箱或手机号
- 当 字段失去焦点（onBlur）
- 那么 实时验证格式正确性
- 如果格式错误，显示红色错误提示
- 如果格式正确，显示绿色勾选图标

#### Scenario: 密码可见性切换
- 给定 用户点击密码输入框右侧眼睛图标
- 当 图标切换为显示状态
- 那么 密码文本变为明文显示
- 并且 图标变为闭眼状态
- 再次点击切换回密码模式

#### Scenario: 登录按钮状态
- 给定 用户点击登录按钮
- 当 提交中
- 那么 按钮显示加载动画
- 并且 按钮文字变为"登录中..."
- 并且 按钮变为禁用状态
- 并且 禁用表单输入

#### Scenario: 登录成功跳转
- 给定 登录成功
- 当 系统获取认证 Token
- 那么 显示成功提示（可选）
- 并且 2 秒后自动跳转到主页
- 或者 立即跳转到主页

#### Scenario: 登录失败提示
- 给定 登录失败
- 当 服务器返回错误
- 那么 在表单顶部显示错误提示
- 并且 错误提示使用红色背景
- 并且 错误文字清晰说明失败原因

### Requirement: 注册页面布局

系统 **MUST** 采用与登录页面一致的设计风格。

注册页面采用与登录页面一致的设计风格。

#### Scenario: 注册表单结构
- 给定 用户访问 /register 页面
- 当 页面加载
- 那么 显示注册表单，包含：
  - 昵称输入框（必填）
  - 邮箱或手机号输入框（必填）
  - 密码输入框（必填）
  - 确认密码输入框（必填）
  - 注册按钮
  - 链接到登录页面

#### Scenario: 注册类型切换
- 给定 用户点击"邮箱注册"和"手机号注册"切换按钮
- 当 切换注册方式
- 那么 邮箱输入框 ↔ 手机号输入框
- 并且 更新输入框占位符和验证规则

#### Scenario: 密码强度提示
- 给定 用户输入密码
- 当 密码强度发生变化
- 那么 显示密码强度指示器
- 并且 显示强度等级（弱/中/强）
- 并且 提供密码建议

#### Scenario: 确认密码验证
- 给定 用户输入确认密码
- 当 两个密码不一致
- 那么 显示错误提示"两次输入的密码不一致"
- 并且 不允许提交表单

### Requirement: 响应式设计

系统 **MUST** 适配不同屏幕尺寸的设备。

适配不同屏幕尺寸的设备。

#### Scenario: 桌面端布局（≥ 1200px）
- 给定 屏幕宽度 ≥ 1200px
- 当 显示登录/注册页面
- 那么 卡片宽度为 400px
- 并且 居中显示
- 并且 输入框高度为 48px
- 并且 按钮高度为 48px

#### Scenario: 平板端布局（768px - 1199px）
- 给定 屏幕宽度 768px - 1199px
- 当 显示页面
- 那么 卡片宽度为 360px
- 并且 输入框高度为 44px
- 并且 按钮高度为 44px

#### Scenario: 移动端布局（< 768px）
- 给定 屏幕宽度 < 768px
- 当 显示页面
- 那么 卡片宽度为 90%
- 并且 最大宽度不超过 360px
- 并且 输入框高度为 48px
- 并且 按钮高度为 48px
- 并且 卡片距离顶部 20% 距离

### Requirement: 错误提示与反馈

系统 **MUST** 实现完善的错误提示和用户反馈机制。

完善的错误提示和用户反馈机制。

#### Scenario: 网络错误提示
- 给定 用户提交表单
- 当 网络连接错误
- 那么 显示错误提示"网络连接失败，请检查网络"
- 并且 提供"重试"按钮
- 并且 保持用户输入的数据

#### Scenario: 服务器错误提示
- 给定 用户提交表单
- 当 服务器返回 500 错误
- 那么 显示错误提示"服务器繁忙，请稍后重试"
- 并且 不清空用户输入
- 并且 保持按钮可用状态

#### Scenario: 字段验证错误
- 给定 用户输入无效数据
- 当 字段失去焦点
- 那么 在字段下方显示验证错误
- 并且 错误信息清晰具体
- 例如："请输入有效的邮箱地址"

#### Scenario: 加载状态指示
- 给定 用户提交表单
- 当 请求发送中
- 那么 显示加载动画
- 并且 禁用所有输入框
- 并且 按钮显示加载状态

### Requirement: 无障碍访问

系统 **MUST** 支持屏幕阅读器和键盘导航。

支持屏幕阅读器和键盘导航。

#### Scenario: 键盘导航
- 给定 用户使用 Tab 键导航
- 当 按下 Tab 键
- 那么 焦点按顺序在表单字段间移动
- 并且 按下 Enter 键提交表单
- 并且 按下 Escape 键关闭对话框

#### Scenario: 屏幕阅读器支持
- 给定 用户使用屏幕阅读器
- 当 页面加载
- 那么 所有表单字段都有对应的 label
- 并且 错误提示使用 aria-live 标记
- 并且 按钮有明确的 aria-label

#### Scenario: 高对比度模式
- 给定 用户开启高对比度模式
- 当 页面显示
- 那么 表单字段有明显的边框
- 并且 错误提示有足够对比度（≥ 4.5:1）
- 并且 按钮文字清晰可见

### Requirement: 多语言支持（预留）

系统 **MUST** 为未来多语言功能预留支持。

#### Scenario: 语言切换
- 给定 用户点击语言切换按钮（预留）
- 当 选择语言
- 那么 页面文本切换到对应语言
- 并且 保持用户输入的数据
- 并且 更新表单验证消息

#### Scenario: 数字格式
- 给定 用户使用不同地区设置
- 当 显示日期、数字
- 那么 使用本地化格式
- 例如：日期格式、数字分隔符

### Requirement: 主题定制

系统 **MUST** 支持明暗主题切换。

支持明暗主题切换。

#### Scenario: 明主题
- 给定 用户选择明主题
- 当 页面显示
- 那么 背景为浅色（#f9f9f9）
- 并且 卡片背景为白色（#ffffff）
- 并且 文字为深色（#1a1a1a）

#### Scenario: 暗主题
- 给定 用户选择暗主题
- 当 页面显示
- 那么 背景为深色（#1a1a1a）
- 并且 卡片背景为深灰色（#2a2a2a）
- 并且 文字为浅色（#ffffff）

#### Scenario: 主题自动切换
- 给定 用户开启系统主题跟随
- 当 系统主题发生变化
- 那么 页面自动切换对应主题
- 并且 保持用户选择的主题偏好

## 组件设计

### Requirement: LoginForm 组件

登录表单的核心组件。

#### Props
```typescript
interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}
```

#### Emits
```typescript
interface LoginFormEmits {
  login: [credentials: { email: string; password: string }]
  switchToRegister: []
}
```

#### 状态
- `loading`: 是否加载中
- `error`: 错误信息
- `formData`: 表单数据

### Requirement: RegisterForm 组件

注册表单的核心组件。

#### Props
```typescript
interface RegisterFormProps {
  onSuccess?: () => void
  redirectTo?: string
}
```

#### Emits
```typescript
interface RegisterFormEmits {
  register: [credentials: { email: string; password: string; fullName: string }]
  switchToLogin: []
}
```

#### 状态
- `loading`: 是否加载中
- `error`: 错误信息
- `formData`: 表单数据
- `registerType`: 注册类型（email/phone）

### Requirement: AuthPage 容器组件

页面级别的容器组件。

#### 功能
- 路由切换（登录/注册）
- 页面标题管理
- SEO 元数据设置
- 全局错误处理

## 样式规范

### Requirement: 颜色方案

#### 主色调
- 主色：#3B82F6（蓝色）
- 成功：#10B981（绿色）
- 警告：#F59E0B（黄色）
- 错误：#EF4444（红色）

#### 背景色
- 明主题背景：#f9f9f9
- 暗主题背景：#1a1a1a
- 卡片背景：#ffffff / #2a2a2a

#### 文字色
- 主文字：#1a1a1a / #ffffff
- 次要文字：#666666 / #cccccc
- 错误文字：#EF4444

### Requirement: 字体规范

#### 字体族
- 中文：PingFang SC, Microsoft YaHei
- 英文：-apple-system, BlinkMacSystemFont, 'Segoe UI'

#### 字号
- 标题：24px / 20px
- 正文：16px / 14px
- 小字：14px / 12px

### Requirement: 间距规范

#### 间距单位
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

#### 应用场景
- 字段间距：md
- 按钮内边距：md
- 卡片内边距：lg
- 页面边距：lg

### Requirement: 动画规范

#### 过渡动画
- 颜色变化：0.2s ease
- 位置变化：0.3s cubic-bezier
- 透明度变化：0.2s ease

#### 加载动画
- 旋转：1s linear infinite
- 脉冲：1.5s ease-in-out infinite

## 测试要求

### Requirement: 单元测试
- 表单验证函数测试
- 组件渲染测试
- 事件处理测试

### Requirement: 集成测试
- 登录流程测试
- 注册流程测试
- 错误处理测试

### Requirement: E2E 测试
- 完整的用户注册流程
- 完整的用户登录流程
- 页面响应式测试
- 键盘导航测试

## 性能要求

### Requirement: 加载性能
- 页面首屏加载时间 < 1.5 秒
- 路由切换时间 < 300ms
- 表单验证响应时间 < 100ms

### Requirement: 交互性能
- 按钮点击响应 < 100ms
- 输入框焦点响应 < 100ms
- 错误提示显示 < 200ms

### Requirement: 资源优化
- 图片懒加载
- 代码分割
- 资源压缩

## 浏览器支持

### Requirement: 桌面端
- Chrome ≥ 84
- Firefox ≥ 83
- Safari ≥ 14.1
- Edge ≥ 84

### Requirement: 移动端
- iOS Safari ≥ 14
- Android Chrome ≥ 84
- 微信内置浏览器

## SEO 要求

### Requirement: 元数据
- 设置页面标题
- 设置 meta 描述
- 设置 Open Graph 标签

### Requirement: 可索引性
- 登录/注册页面可被搜索引擎索引
- 设置 robots meta 标签

---

**参考文档**:
- [TDesign Vue Next 组件库](https://tdesign.tencent.com/vue-next/overview)
- [Web 无障碍访问指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)
