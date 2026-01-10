# Change: 修复主页未登录状态下的用户状态显示逻辑

## Why
当前主页侧边栏底部的用户状态在未登录时显示不合理。当用户未登录时，点击该区域会展开一个下拉菜单（包含个人资料、设置、退出登录等选项），这不符合逻辑，因为未登录用户不应该看到这些选项。

正确的用户体验应该是：
- 未登录状态：显示简单的"登录"按钮，点击后直接跳转到登录页面
- 已登录状态：显示用户名和头像，点击后展开下拉菜单（个人资料、设置、退出登录）

## What Changes
- 修改 `frontend/src/components/common/UserMenu.vue` 组件
- 根据 `authStore.isAuthenticated` 状态显示不同的 UI
- 未登录时显示简单的登录按钮
- 已登录时保持现有的用户菜单逻辑

## Impact
- Affected specs: `authentication`, `ui-pages`
- Affected code: `frontend/src/components/common/UserMenu.vue`
- User experience improvement: 使认证状态显示更符合逻辑
- No breaking changes: 仅仅是视觉和交互的改进
