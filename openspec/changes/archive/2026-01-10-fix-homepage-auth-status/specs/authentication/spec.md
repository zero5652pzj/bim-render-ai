## MODIFIED Requirements
### Requirement: 认证状态管理

系统 **MUST** 实现前端认证状态的持久化和同步。

#### Scenario: 页面加载时检查认证
- 给定 用户打开网站
- 当 页面加载完成
- 那么 检查 localStorage 中是否有 Token
- 那么 验证 Token 有效性
- 那么 同步用户状态到 Pinia Store

#### Scenario: 认证状态监听
- 给定 用户已登录
- 当 Supabase Auth 状态发生变化（如登出）
- 那么 自动更新 Pinia Store 中的用户状态
- 那么 UI 自动响应状态变化

#### Scenario: 认证失败清理
- 给定 用户认证失败或 Token 验证失败
- 当 检测到认证问题
- 那么 清除 Pinia Store 中的用户状态
- 那么 清除 localStorage 中的 Token
- 那么 跳转到登录页

#### Scenario: 主页用户状态显示
- 给定 用户访问主页
- 当 用户未登录时
- 那么 侧边栏底部显示"登录"按钮
- 并且 点击按钮跳转到登录页
- 当 用户已登录时
- 那么 侧边栏底部显示用户名和头像
- 并且 点击后展开下拉菜单（个人资料、设置、退出登录）
