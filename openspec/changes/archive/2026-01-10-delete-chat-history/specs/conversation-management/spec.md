# 规范增量：对话管理 - 删除功能

## 概述

本文档定义了对话删除功能的具体需求和验收标准，包括单个对话删除和批量删除全部历史记录的功能。

## ADDED Requirements

### Requirement: 单个对话删除

用户 **SHALL** 能够从侧边栏会话列表中删除单个对话。

#### Scenario: 删除按钮显示
- 给定 用户在主界面查看会话列表
- 当 用户 hover 在某个会话项上
- 那么 显示删除按钮（垃圾桶图标）

#### Scenario: 删除确认流程
- 给定 删除按钮已显示
- 当 用户点击删除按钮
- 那么 显示确认对话框，标题为"确认删除"

#### Scenario: 确认删除
- 给定 显示确认对话框
- 当 用户点击"删除"按钮
- 那么 执行删除操作并显示成功提示

#### Scenario: 取消删除
- 给定 显示确认对话框
- 当 用户点击"取消"按钮或按 ESC 键
- 那么 对话框关闭，无任何操作执行

#### Scenario: 删除当前活动对话
- 给定 用户正在查看某个对话
- 当 用户删除该对话
- 那么 对话从列表中移除，界面切换到欢迎页面

#### Scenario: 删除失败处理
- 给定 执行删除操作
- 当 删除失败（如网络错误）
- 那么 显示错误提示，对话保留在列表中

### Requirement: 批量删除所有历史

用户 **SHALL** 能够删除所有历史记录，包括所有对话和消息。

#### Scenario: 批量删除入口
- 给定 用户在侧边栏
- 当 用户点击"清空所有历史"按钮
- 那么 显示批量删除确认对话框

#### Scenario: 输入确认
- 给定 显示确认对话框
- 当 用户在输入框中输入 "DELETE"
- 那么 "确认删除"按钮变为可用状态

#### Scenario: 执行批量删除
- 给定 用户点击"确认删除"按钮
- 当 执行批量删除
- 那么 显示删除进度，开始执行批量软删除

#### Scenario: 删除完成
- 给定 批量删除执行中
- 当 删除完成
- 那么 显示成功提示，侧边栏会话列表为空

#### Scenario: 取消批量删除
- 给定 显示确认对话框
- 当 用户点击"取消"按钮
- 那么 对话框关闭，无任何操作执行

#### Scenario: 批量删除进度反馈
- 给定 执行批量删除
- 当 删除进行中
- 那么 显示进度条和已删除项目计数

#### Scenario: 批量删除失败处理
- 给定 执行批量删除
- 当 部分操作失败
- 那么 显示部分成功的提示，保留未失败的数据

### Requirement: ConversationStore 增强

ConversationStore **SHALL** 添加新的方法来支持删除功能。

#### Scenario: 删除单个对话
- 给定 对话 ID 有效且属于当前用户
- 当 调用 deleteConversation(id)
- 那么 返回 Promise.resolve(true)，对话被标记为已删除

- 给定 对话 ID 无效或不属于当前用户
- 当 调用 deleteConversation(id)
- 那么 返回 Promise.resolve(false)

#### Scenario: 清空所有历史
- 给定 用户已登录
- 当 调用 clearAllHistory()
- 那么 返回 Promise.resolve(true)，所有对话被标记为已删除

- 给定 用户未登录
- 当 调用 clearAllHistory()
- 那么 返回 Promise.reject(error)

#### Scenario: 加载状态管理
- 给定 执行删除操作
- 当 操作开始
- 那么 isDeleting 设置为 true

- 给定 删除操作完成
- 当 操作结束（无论成功或失败）
- 那么 isDeleting 设置为 false

### Requirement: UI 交互细节

删除功能的 UI 交互 **SHALL** 提供清晰、即时和一致的反馈。

#### Scenario: 按钮 hover 效果
- 给定 删除按钮显示
- 当 用户鼠标悬停
- 那么 按钮放大并改变阴影

#### Scenario: 加载状态显示
- 给定 执行删除操作
- 当 操作进行中
- 那么 按钮禁用并显示加载图标

#### Scenario: 成功反馈
- 给定 删除操作成功
- 当 操作完成
- 那么 显示绿色 Toast 消息："删除成功"

#### Scenario: 错误反馈
- 给定 删除操作失败
- 当 操作结束
- 那么 显示红色错误消息："删除失败，请重试"

### Requirement: 数据一致性

删除操作 **MUST** 保持数据一致性。

#### Scenario: 单个对话删除的数据一致性
- 给定 对话包含多条消息
- 当 删除该对话
- 那么 对话和所有消息都被标记为 is_deleted = true

#### Scenario: 批量删除的事务性
- 给定 执行批量删除
- 当 操作开始
- 那么 使用 Supabase 事务确保要么全部成功，要么全部失败

#### Scenario: 状态同步
- 给定 本地已删除对话
- 当 重新加载会话列表
- 那么 已删除的对话不再出现在列表中

## 相关能力

- [消息管理](../message-management/spec.md) - 删除单个消息的功能
- [用户认证](../user-management/spec.md) - 确保用户只能删除自己的数据

## 参考资料

- `frontend/src/stores/conversation.ts` - 对话 Store 实现
- `frontend/src/views/MainView.vue` - 主界面实现
- `supabase/migrations/20260107000002_create_conversations.sql` - 对话表结构
