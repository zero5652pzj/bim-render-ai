<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { Chat, ChatSender, ChatContent } from '@tdesign-vue-next/chat'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore, type TdChatItemMeta } from '@/stores/message'
import { useThemeStore } from '@/stores/theme'
import { streamChatWithMinimax, type ChatMessage } from '@/lib/minimax-api'
import ConversationList from '@/components/chat/ConversationList.vue'
import PreviewArea from '@/components/common/PreviewArea.vue'
import UserMenu from '@/components/common/UserMenu.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import '@/assets/styles/chat-theme.scss'

const authStore = useAuthStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const themeStore = useThemeStore()
const router = useRouter()

// 输入状态
const inputText = ref('')
const sending = ref(false)
const isStreaming = ref(false)
const streamingMessageId = ref<string | null>(null)

// 预览区域状态
const previewAreaVisible = ref(false)
const sidebarCollapsed = ref(false)

// 栅格列宽状态
const sidebarWidth = ref(280)
const chatWidth = ref(400)
const isResizing = ref<null | 'sidebar' | 'chat'>(null)

// 拖拽调整列宽
function startResize(type: 'sidebar' | 'chat', event: MouseEvent) {
  isResizing.value = type
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

function handleMouseMove(event: MouseEvent) {
  if (!isResizing.value) return

  if (isResizing.value === 'sidebar') {
    const newWidth = event.clientX
    sidebarWidth.value = Math.max(200, Math.min(500, newWidth))
  } else if (isResizing.value === 'chat') {
    const windowWidth = window.innerWidth
    const newWidth = windowWidth - event.clientX
    chatWidth.value = Math.max(300, Math.min(600, newWidth))
  }
}

function stopResize() {
  isResizing.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

// 当前对话的消息列表（TDesign 格式）
const chatData = computed(() => messageStore.tdChatMessages)

// 当前对话
const currentConversation = computed(() => conversationStore.currentConversation)

// 是否已认证
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 聊天容器引用
const chatContainerRef = ref<InstanceType<typeof Chat>>()

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 切换预览区域
function togglePreviewArea() {
  previewAreaVisible.value = !previewAreaVisible.value
}

// 处理发送消息
async function handleSend(text: string) {
  const textToSend = text || inputText.value
  if (!textToSend.trim() || sending.value) {
    return
  }

  if (!isAuthenticated.value) {
    MessagePlugin.warning('请先登录后再发送消息')
    router.push('/login')
    return
  }

  try {
    sending.value = true
    isStreaming.value = true

    let currentConv = currentConversation.value

    // 如果没有当前会话，创建新会话
    if (!currentConv) {
      console.log('[Chat] 尝试创建新会话...')
      currentConv = await conversationStore.createConversation(
        textToSend.length > 20 ? textToSend.substring(0, 20) + '...' : textToSend
      )
      if (!currentConv) {
        throw new Error('创建会话失败')
      }
    }

    console.log('[Chat] 发送消息到对话:', currentConv.id)

    // 发送用户消息
    const userMessageResult = await messageStore.sendMessage(currentConv.id, textToSend)
    if (!userMessageResult.success) {
      throw new Error(userMessageResult.error || '发送消息失败')
    }

    // 清空输入框
    inputText.value = ''

    // 准备 AI 请求的消息格式
    const messagesForAI: ChatMessage[] = messageStore.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))

    // 创建流式 AI 消息占位符
    const aiMessageId = crypto.randomUUID()
    streamingMessageId.value = aiMessageId

    // 流式响应
    await streamChatWithMinimax(messagesForAI, {
      onText: (text) => {
        // 实时更新流式消息
        const existingMsg = messageStore.messages.find(m => m.id === aiMessageId)
        if (!existingMsg) {
          // 首次添加流式消息
          messageStore.messages.push({
            id: aiMessageId,
            conversation_id: currentConv.id,
            role: 'assistant',
            content: text,
            created_at: new Date().toISOString(),
            is_deleted: false,
            metadata: {}
          })
        } else {
          // 更新现有消息
          existingMsg.content = text
        }
      },
      onComplete: async (fullText) => {
        // 流式完成，保存到数据库
        await messageStore.sendMessage(currentConv.id, fullText)

        // 移除临时消息
        const tempIndex = messageStore.messages.findIndex(m => m.id === aiMessageId)
        if (tempIndex !== -1) {
          messageStore.messages.splice(tempIndex, 1)
        }

        streamingMessageId.value = null
        isStreaming.value = false
        MessagePlugin.success('AI助手已回复')
      },
      onError: (error) => {
        console.error('[Chat] 流式响应错误:', error)
        streamingMessageId.value = null
        isStreaming.value = false

        // 移除临时消息
        const tempIndex = messageStore.messages.findIndex(m => m.id === aiMessageId)
        if (tempIndex !== -1) {
          messageStore.messages.splice(tempIndex, 1)
        }

        MessagePlugin.error(`发送失败：${error.message}`)
      }
    })

  } catch (error: any) {
    console.error('[Chat] 发送消息错误:', error)
    streamingMessageId.value = null
    isStreaming.value = false
    MessagePlugin.error(error.response?.data?.error || error.message || '发送失败，请重试')
  } finally {
    sending.value = false
  }
}

// 处理停止生成
function handleStop() {
  isStreaming.value = false
  streamingMessageId.value = null
  MessagePlugin.info('已停止生成')
}

// 处理清除历史
function handleClear() {
  if (currentConversation.value) {
    messageStore.clearConversationMessages(currentConversation.value.id)
    MessagePlugin.success('已清空对话历史')
  }
}

// 处理消息操作 - TDesign Chat @operation 事件
async function handleMessageOperation(context: any) {
  const { action, message } = context
  console.log('[Chat] 消息操作:', action, message.id)

  switch (action) {
    case 'copy':
      try {
        await navigator.clipboard.writeText(message.content)
        MessagePlugin.success('已复制到剪贴板')
      } catch {
        MessagePlugin.error('复制失败')
      }
      break
    case 'delete':
      const success = await messageStore.deleteMessage(message.id)
      if (success) {
        MessagePlugin.success('消息已删除')
      } else {
        MessagePlugin.error('删除失败')
      }
      break
    case 'regenerate':
      // 重新生成 AI 回复
      if (message.role === 'assistant') {
        await regenerateMessage(message)
      }
      break
  }
}

// 重新生成消息
async function regenerateMessage(message: TdChatItemMeta) {
  if (!currentConversation.value || sending.value) return

  // 找到要重新生成的消息之前的所有消息
  const msgIndex = messageStore.messages.findIndex(m => m.id === message.id)
  if (msgIndex === -1) return

  // 删除原消息及之后的所有消息
  const messagesToDelete = messageStore.messages.slice(msgIndex)
  for (const msg of messagesToDelete) {
    await messageStore.deleteMessage(msg.id)
  }

  // 使用之前的消息历史重新生成
  const previousMessages = messageStore.messages.slice(0, msgIndex).map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content
  }))

  try {
    isStreaming.value = true
    sending.value = true

    const aiMessageId = crypto.randomUUID()
    streamingMessageId.value = aiMessageId

    await streamChatWithMinimax(previousMessages, {
      onText: (text) => {
        const existingMsg = messageStore.messages.find(m => m.id === aiMessageId)
        if (!existingMsg) {
          messageStore.messages.push({
            id: aiMessageId,
            conversation_id: currentConversation.value!.id,
            role: 'assistant',
            content: text,
            created_at: new Date().toISOString(),
            is_deleted: false,
            metadata: {}
          })
        } else {
          existingMsg.content = text
        }
      },
      onComplete: async (fullText) => {
        await messageStore.sendMessage(currentConversation.value!.id, fullText)
        const tempIndex = messageStore.messages.findIndex(m => m.id === aiMessageId)
        if (tempIndex !== -1) {
          messageStore.messages.splice(tempIndex, 1)
        }
        streamingMessageId.value = null
        isStreaming.value = false
        MessagePlugin.success('已重新生成回复')
      },
      onError: (error) => {
        console.error('[Chat] 重新生成失败:', error)
        streamingMessageId.value = null
        isStreaming.value = false
        const tempIndex = messageStore.messages.findIndex(m => m.id === aiMessageId)
        if (tempIndex !== -1) {
          messageStore.messages.splice(tempIndex, 1)
        }
        MessagePlugin.error(`重新生成失败：${error.message}`)
      }
    })
  } catch (error: any) {
    isStreaming.value = false
    MessagePlugin.error(error.message || '重新生成失败')
  } finally {
    sending.value = false
  }
}

// 处理文件上传
function handleFileUpload(file: File) {
  console.log('[Chat] 文件上传:', file)
  MessagePlugin.info('文件上传功能开发中')
}

// 组件挂载时初始化
onMounted(async () => {
  // 仅在已登录时加载数据
  if (isAuthenticated.value) {
    // 加载对话列表
    await conversationStore.loadConversations()

    // 如果有当前对话，加载消息
    if (currentConversation.value) {
      await messageStore.loadMessages(currentConversation.value.id)
    }
  }
})

// 监听当前对话变化
watch(currentConversation, async (newConv) => {
  if (newConv) {
    await messageStore.loadMessages(newConv.id)
  } else {
    messageStore.clearMessages()
  }
})
</script>

<template>
  <div class="chat-view" :data-theme="themeStore.currentTheme">
    <!-- 顶部栏 -->
    <div class="chat-header">
      <div class="header-left">
        <button class="icon-btn" @click="toggleSidebar" title="切换侧边栏">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <h1 class="header-title">BIM 桥梁设计助手</h1>
      </div>

      <div class="header-right">
        <button class="icon-btn" @click="togglePreviewArea" title="预览区域">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M17.5 11.25V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H8.75"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M10.833 2.5H17.4997M17.4997 2.5V9.16667M17.4997 2.5L10.833 9.16667"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>

    <!-- 主内容区 -->
    <div
      class="chat-main"
      :style="{
        gridTemplateColumns: previewAreaVisible
          ? `${sidebarWidth}px 4px 1fr 4px ${chatWidth}px`
          : `${sidebarWidth}px 4px 1fr`
      }"
    >
      <!-- 侧边栏 -->
      <div v-if="!sidebarCollapsed" class="chat-sidebar">
        <ConversationList />
      </div>

      <!-- 侧边栏拖拽手柄 -->
      <div
        v-if="!sidebarCollapsed"
        class="resizer resizer-sidebar"
        :class="{ 'is-resizing': isResizing === 'sidebar' }"
        @mousedown="startResize('sidebar', $event)"
      >
        <div class="resizer-line"></div>
      </div>

      <!-- 预览区域（中间主要空间） -->
      <div v-if="previewAreaVisible" class="chat-preview">
        <PreviewArea :visible="previewAreaVisible" />
      </div>

      <!-- 聊天区域拖拽手柄 -->
      <div
        v-if="previewAreaVisible"
        class="resizer resizer-chat"
        :class="{ 'is-resizing': isResizing === 'chat' }"
        @mousedown="startResize('chat', $event)"
      >
        <div class="resizer-line"></div>
      </div>

      <!-- 聊天区域（右侧） -->
      <div class="chat-content">
        <Chat
          ref="chatContainerRef"
          :data="(chatData as any)"
          :is-stream-load="isStreaming"
          :layout="'single'"
          :default-show-success="false"
          :default-show-fail="false"
          text-type="markdown"
          @send="handleSend"
          @stop="handleStop"
          @clear="handleClear"
          @operation="handleMessageOperation"
        >
          <!-- 空状态 -->
          <template #empty>
            <div class="chat-empty-state">
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                  <path d="M32 20V32L40 40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="empty-text">
                <h3>欢迎使用 BIM 桥梁设计助手</h3>
                <p>我可以帮助您进行桥梁设计、参数计算和 3D 建模</p>
                <div class="empty-suggestions">
                  <button class="suggestion-btn" @click="handleSend('帮我设计一座预应力混凝土连续梁桥')">
                    设计预应力混凝土连续梁桥
                  </button>
                  <button class="suggestion-btn" @click="handleSend('如何计算桥梁的荷载组合？')">
                    计算桥梁荷载组合
                  </button>
                  <button class="suggestion-btn" @click="handleSend('生成简支梁桥的 3D 模型')">
                    生成简支梁桥模型
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 思考链展示 -->
          <template #reasoning="scope">
            <div class="custom-reasoning" v-if="scope.reasoning">
              <div class="reasoning-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>思考过程</span>
                <button class="toggle-btn" @click="scope.toggle">
                  {{ scope.collapsed ? '展开' : '收起' }}
                </button>
              </div>
              <div v-if="!scope.collapsed" class="reasoning-content">
                <pre>{{ scope.reasoning }}</pre>
              </div>
            </div>
          </template>

          <!-- 自定义消息项渲染 - 完全替换默认渲染 -->
          <template #textItem="scope">
            <div class="custom-message-renderer" v-if="scope.chatItem.role === 'assistant'">
              <ChatContent
                :content="scope.chatItem.content"
                :markdown-props="{
                  options: {
                    themeSettings: {
                      codeBlockTheme: themeStore.currentTheme === 'light' ? 'light' : 'dark'
                    }
                  }
                }"
              />
            </div>
          </template>
        </Chat>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <ChatSender
            :disabled="sending || !isAuthenticated"
            :loading="isStreaming"
            placeholder="输入您的问题..."
            @send="handleSend"
            @stop="handleStop"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--td-chat-bg-primary);
  color: var(--td-chat-conversation-text);

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: var(--td-chat-sidebar-bg);
    border-bottom: 1px solid var(--td-chat-sidebar-border);
    backdrop-filter: blur(var(--td-chat-backdrop-blur));
    -webkit-backdrop-filter: blur(var(--td-chat-backdrop-blur));

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--td-chat-conversation-text);
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--td-chat-conversation-text);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: var(--td-chat-conversation-bg-hover);
      }
    }
  }

  .chat-main {
    display: grid;
    /* grid-template-columns 通过内联样式动态设置 */
    flex: 1;
    overflow: hidden;

    .chat-sidebar {
      background: var(--td-chat-sidebar-bg);
      border-right: 1px solid var(--td-chat-sidebar-border);
      overflow-y: auto;
    }

    .chat-preview {
      background: var(--td-chat-preview-bg);
      border-left: 1px solid var(--td-chat-preview-border);
      overflow-y: auto;
      min-width: 0;
    }

    .chat-content {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--td-chat-bg-primary);
      border-left: 1px solid var(--td-chat-border-color);
      min-width: 0;

      :deep(.t-chat) {
        flex: 1;
        min-height: 0;
        background: transparent;
      }

      .chat-input-area {
        flex-shrink: 0;
        padding: 16px;
        background: var(--td-chat-bg-primary);
        border-top: 1px solid var(--td-chat-border-color);
      }
    }

    // 拖拽手柄样式
    .resizer {
      position: relative;
      width: 4px;
      background: transparent;
      cursor: col-resize;
      user-select: none;
      transition: background-color 0.2s ease;
      z-index: 10;

      &:hover {
        background: var(--td-brand-color, #0052d9);
      }

      &.is-resizing {
        background: var(--td-brand-color, #0052d9);
      }

      .resizer-line {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 100%;
        background: var(--td-component-border, #e7e7e7);
        transition: all 0.2s ease;
      }

      &:hover .resizer-line {
        background: var(--td-brand-color, #0052d9);
        width: 3px;
      }
    }
  }

  // 自定义思考链样式
  :deep(.custom-reasoning) {
    margin: 8px 0;
    padding: 12px 16px;
    background: var(--td-chat-bg-color-secondary, rgba(139, 92, 246, 0.1));
    border: 1px solid var(--td-chat-border-color);
    border-radius: 12px;

    .reasoning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--td-chat-conversation-text);

      .toggle-btn {
        margin-left: auto;
        background: transparent;
        border: none;
        color: var(--td-brand-color);
        cursor: pointer;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;

        &:hover {
          background: var(--td-chat-bg-color-secondary);
        }
      }
    }

    .reasoning-content {
      padding: 8px 0;

      pre {
        margin: 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--td-chat-text-color-ai);
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }
  }

  // 空状态样式
  :deep(.chat-empty-state) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    height: 100%;
    color: var(--td-chat-conversation-text);

    .empty-icon {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-text {
      h3 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
      }

      p {
        margin: 0 0 24px;
        font-size: 14px;
        opacity: 0.7;
      }
    }

    .empty-suggestions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 320px;

      .suggestion-btn {
        padding: 12px 20px;
        background: transparent;
        border: 1px solid var(--td-chat-border-color);
        border-radius: 8px;
        color: var(--td-chat-conversation-text);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--td-chat-bg-color-secondary);
          border-color: var(--td-brand-color);
        }
      }
    }
  }

  // 自定义 Markdown 渲染样式
  :deep(.custom-markdown-rendered) {
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-weight: 600;
      color: var(--td-chat-conversation-text);
    }

    h1 { font-size: 1.5em; }
    h2 { font-size: 1.3em; }
    h3 { font-size: 1.1em; }

    p {
      margin: 0.5em 0;
      line-height: 1.6;
      color: var(--td-chat-text-color-ai);
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
      color: var(--td-chat-text-color-ai);
    }

    li {
      margin: 0.25em 0;
      line-height: 1.6;
    }

    code {
      background: var(--td-chat-bg-color-secondary, rgba(0, 0, 0, 0.3));
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
      color: #e06c75;
    }

    pre {
      background: var(--td-chat-bg-color-secondary, rgba(0, 0, 0, 0.3));
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1em 0;
      border: 1px solid var(--td-chat-border-color);

      code {
        background: transparent;
        padding: 0;
        color: var(--td-chat-text-color-ai);
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      border: 1px solid var(--td-chat-border-color);
    }

    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--td-chat-border-color);
      color: var(--td-chat-text-color-ai);
    }

    th {
      background: var(--td-chat-bg-color-secondary, rgba(0, 0, 0, 0.2));
      font-weight: 600;
    }

    strong {
      font-weight: 600;
      color: var(--td-chat-conversation-text);
    }

    a {
      color: #60a5fa;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
