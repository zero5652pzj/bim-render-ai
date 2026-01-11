<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import UserMenu from '@/components/common/UserMenu.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ClearHistoryDialog from '@/components/ClearHistoryDialog.vue'
import PreviewArea from '@/components/common/PreviewArea.vue'
import { ChatSender } from '@tdesign-vue-next/chat'
import { chatWithMinimax } from '@/lib/minimax-api'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const router = useRouter()
const sidebarCollapsed = ref(false)

// 预览区域状态
const previewAreaVisible = ref(false)
const previewAreaCollapsed = ref(false)

// 预览内容状态
const previewContent = ref([
  {
    id: 1,
    type: 'pdf',
    title: '桥梁设计规范.pdf',
    description: '最新的桥梁设计规范文档'
  },
  {
    id: 2,
    type: 'image',
    title: '桥墩结构图.jpg',
    description: '桥墩的详细结构示意图'
  },
  {
    id: 3,
    type: 'web',
    title: 'BIM标准网站',
    description: 'BIM行业标准参考网站'
  }
])

// 当前选中的预览内容
const selectedPreviewContent = ref(previewContent.value[0])

// 输入相关状态
const message = ref('')
const sending = ref(false)
const aiResponding = ref(false)
const fileInput = ref<HTMLInputElement>()
const chatContainerRef = ref<HTMLElement>()

// 删除相关状态
const deleteDialogVisible = ref(false)
const clearHistoryDialogVisible = ref(false)
const conversationToDelete = ref<any>(null)

// AI 响应动画状态
const aiTypingDots = ref('')
let typingInterval: NodeJS.Timeout | null = null

// 启动 AI 打字动画
function startAiTyping() {
  aiTypingDots.value = ''
  typingInterval = setInterval(() => {
    if (aiTypingDots.value.length >= 3) {
      aiTypingDots.value = ''
    } else {
      aiTypingDots.value += '.'
    }
  }, 500)
}

// 停止 AI 打字动画
function stopAiTyping() {
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
  aiTypingDots.value = ''
}

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // 如果侧边栏展开且当前有对话，可以选择性地隐藏预览区域以获得更多空间
  if (!sidebarCollapsed.value && hasCurrentConversation.value) {
    // 用户展开侧边栏时，可以保持预览区域显示，给用户选择权
    // 不自动隐藏预览区域，让用户决定
  }
}

// 切换预览区域
function togglePreviewArea() {
  previewAreaCollapsed.value = !previewAreaCollapsed.value
}

// 获取聊天消息
const chatMessages = computed(() => messageStore.messages)

// 预览区域显示逻辑
const shouldShowPreviewArea = computed(() => {
  return hasCurrentConversation.value && previewAreaVisible.value && !previewAreaCollapsed.value
})

// 预览区域总是显示的（默认展开）
const isPreviewAreaExpanded = computed(() => {
  return hasCurrentConversation.value && !previewAreaCollapsed.value
})

// 是否显示聊天区域
const shouldShowChatArea = computed(() => {
  return hasCurrentConversation.value
})

// 检查用户是否已登录
const isAuthenticated = computed(() => authStore.isAuthenticated)

// 检查是否有当前会话
const hasCurrentConversation = computed(() => !!conversationStore.currentConversation)

// 组件挂载时初始化
onMounted(async () => {
  if (isAuthenticated.value) {
    await conversationStore.loadConversations()
  }
})

// 监听当前会话变化，加载消息
watch(
  () => conversationStore.currentConversation?.id,
  async (conversationId) => {
    if (conversationId) {
      await messageStore.loadMessages(conversationId)
      // 显示预览区域并收缩侧边栏
      previewAreaVisible.value = true
      sidebarCollapsed.value = true
      // 滚动到底部
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } else {
      messageStore.clearMessages()
      // 隐藏预览区域
      previewAreaVisible.value = false
    }
  },
  { immediate: true }
)

// 滚动到聊天底部
function scrollToBottom() {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

// 处理新建对话
async function handleNewConversation() {
  if (!isAuthenticated.value) {
    MessagePlugin.warning('请先登录')
    router.push('/login')
    return
  }

  // 清空当前会话
  conversationStore.selectConversation(null as any)
  messageStore.clearMessages()

  // 重置布局状态：显示主页，侧边栏展开，预览区域隐藏
  sidebarCollapsed.value = false
  previewAreaVisible.value = false
  previewAreaCollapsed.value = false
}

// 处理选择会话
function handleSelectConversation(conversation: any) {
  conversationStore.selectConversation(conversation)
}

// 处理删除对话
function handleDeleteConversation(conversation: any, event: Event) {
  event.stopPropagation()
  conversationToDelete.value = conversation
  deleteDialogVisible.value = true
}

// 确认删除对话
async function confirmDeleteConversation() {
  if (!conversationToDelete.value) return

  const success = await conversationStore.deleteConversation(conversationToDelete.value.id)

  if (success) {
    MessagePlugin.success('对话已删除')
  } else {
    MessagePlugin.error('删除失败，请重试')
  }

  deleteDialogVisible.value = false
  conversationToDelete.value = null
}

// 处理清空所有历史
function handleClearAllHistory() {
  clearHistoryDialogVisible.value = true
}

// 确认清空所有历史
async function confirmClearAllHistory() {
  const success = await conversationStore.clearAllHistory()

  if (success) {
    MessagePlugin.success('所有历史记录已清空')
  } else {
    MessagePlugin.error('清空失败，请重试')
  }

  clearHistoryDialogVisible.value = false
}

// 修复 RLS 策略（开发环境使用）

// 处理删除消息
async function handleDeleteMessage(messageId: string) {
  const success = await messageStore.deleteMessage(messageId)

  if (success) {
    // 消息删除成功，使用淡出动画
    MessagePlugin.success('消息已删除')
  } else {
    MessagePlugin.error('删除失败，请重试')
  }
}

// 处理发送消息
async function handleSend(messageText?: string) {
  const textToSend = messageText || message.value
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
    aiResponding.value = false

    let currentConv = conversationStore.currentConversation

    // 如果没有当前会话，创建新会话
    if (!currentConv) {
      console.log('[Chat] 尝试创建新会话...')
      currentConv = await conversationStore.createConversation(
        textToSend.length > 20 ? textToSend.substring(0, 20) + '...' : textToSend
      )
      if (!currentConv) {
        console.error('[Chat] 创建会话失败，当前认证状态:', authStore.user)
        throw new Error(`创建会话失败: ${authStore.user ? '用户已登录' : '用户未登录'}`)
      }
    }

    console.log('[Chat] Sending message to conversation:', currentConv.id)

    // 发送用户消息
    const userMessageResult = await messageStore.sendMessage(currentConv.id, textToSend)
    if (!userMessageResult.success) {
      throw new Error(userMessageResult.error || '发送消息失败')
    }

    // 清空输入框
    message.value = ''

    // 滚动到底部
    setTimeout(() => scrollToBottom(), 100)

    // 准备AI请求的消息格式
    const messagesForAI = chatMessages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // 启动 AI 打字动画
    aiResponding.value = true
    startAiTyping()

    // 调用MiniMax AI
    console.log('[Chat] Calling MiniMax AI...')
    const aiResult = await chatWithMinimax(messagesForAI)

    console.log('[Chat] MiniMax AI Result:', aiResult)

    // 停止 AI 打字动画
    aiResponding.value = false
    stopAiTyping()

    // 处理AI响应
    if (aiResult.success && aiResult.message) {
      await messageStore.sendMessage(currentConv.id, aiResult.message)
      setTimeout(() => scrollToBottom(), 100)
      MessagePlugin.success('AI助手已回复')
    } else {
      throw new Error(aiResult.error || 'AI响应失败')
    }

  } catch (error: any) {
    console.error('[Chat] Error sending message:', error)
    aiResponding.value = false
    stopAiTyping()
    MessagePlugin.error(error.response?.data?.error || '发送失败，请重试')
  } finally {
    sending.value = false
  }
}

// 处理文件上传（chat-sender 组件的功能）
function handleFileUpload(file: File) {
  console.log('[Chat] File upload:', file)
  // TODO: 实现文件上传逻辑
  MessagePlugin.info('文件上传功能开发中')
}

// 触发文件上传
function triggerFileUpload() {
  if (!isAuthenticated.value) {
    MessagePlugin.warning('请先登录后再上传文件')
    router.push('/login')
    return
  }
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    console.log('[Chat] Selected files:', files)
    MessagePlugin.info(`已选择 ${files.length} 个文件，功能开发中`)
    // TODO: 实现文件上传逻辑
  }
  // 清空输入，允许重复选择同一文件
  target.value = ''
}
</script>

<template>
  <div class="main-container">
    <!-- 动态背景 -->
    <div class="background-animation">
      <div class="bg-gradient-1"></div>
      <div class="bg-gradient-2"></div>
      <div class="bg-pattern"></div>
    </div>

    <!-- 展开按钮（当侧边栏收缩时显示） -->
    <TButton
      v-if="sidebarCollapsed"
      variant="text"
      shape="circle"
      size="medium"
      @click="toggleSidebar"
      class="expand-btn"
    >
      <TIcon name="chevron-right" />
    </TButton>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <div class="logo-container">
          <div class="logo-icon">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sidebarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                </linearGradient>
              </defs>
              <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="url(#sidebarGradient)" opacity="0.3"/>
              <path d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z" fill="url(#sidebarGradient)"/>
              <circle cx="50" cy="50" r="12" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <h2 class="sidebar-title" v-if="!sidebarCollapsed">AI+BIM</h2>
        </div>
        <TButton
          v-if="!sidebarCollapsed"
          variant="text"
          shape="circle"
          size="small"
          @click="toggleSidebar"
          class="collapse-btn"
        >
          <TIcon name="chevron-left" />
        </TButton>
      </div>

      <!-- 新建对话按钮 -->
      <div class="new-chat-button">
        <TButton
          theme="primary"
          block
          @click="handleNewConversation"
          class="new-chat-btn"
        >
          <template #icon>
            <TIcon name="add" />
          </template>
          <span v-if="!sidebarCollapsed">新建对话</span>
        </TButton>
      </div>

      <!-- 清空所有历史按钮 -->
      <div class="clear-history-button" v-if="!sidebarCollapsed && conversationStore.conversations.length > 0">
        <TButton
          variant="text"
          block
          @click="handleClearAllHistory"
          :loading="conversationStore.isClearingAll"
          class="clear-history-btn"
        >
          <template #icon>
            <TIcon name="delete" />
          </template>
          <span>清空所有历史</span>
        </TButton>
      </div>

      <!-- 会话列表 -->
      <div class="conversation-list">
        <div v-if="conversationStore.conversations.length === 0 && !conversationStore.loading" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="1.5"/>
            </svg>
          </div>
          <p class="empty-text">暂无对话</p>
          <p class="hint">开始你的第一次对话吧</p>
        </div>

        <div v-else class="conversations">
          <div
            v-for="conv in conversationStore.conversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conversationStore.currentConversation?.id === conv.id }"
            @click="handleSelectConversation(conv)"
          >
            <div class="conversation-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="conversation-content" v-if="!sidebarCollapsed">
              <p class="conversation-title">{{ conv.title }}</p>
              <p class="conversation-time">{{ new Date(conv.created_at).toLocaleDateString() }}</p>
            </div>
            <!-- 删除按钮 -->
            <button
              v-if="!sidebarCollapsed"
              class="delete-conversation-btn"
              @click="handleDeleteConversation(conv, $event)"
              :disabled="conversationStore.isDeleting"
              :loading="conversationStore.isDeleting"
              title="删除对话"
            >
              <TIcon name="delete" size="16px" />
            </button>
          </div>
        </div>
      </div>

      <!-- 用户菜单 -->
      <div class="sidebar-footer">
        <UserMenu />
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 欢迎页（没有当前会话时显示） -->
      <div v-if="!hasCurrentConversation" class="welcome-page">
        <!-- 主标题区域 -->
        <div class="welcome-header">
          <div class="hero-icon">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#heroGradient)" opacity="0.1"/>
              <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="url(#heroGradient)"/>
              <circle cx="50" cy="50" r="18" fill="white"/>
              <path d="M35 50 L45 60 L65 40" stroke="url(#heroGradient)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="welcome-title">
            你好！我是 <span class="gradient-text">AI+BIM</span> 助手
          </h1>
          <p class="welcome-subtitle">我可以帮助你设计和生成各种类型的桥梁模型</p>
        </div>

        <!-- 示例卡片 -->
        <div class="example-cards">
          <div class="example-card" @click="() => { message = '生成一座 100 米的简支梁桥'; handleSend('生成一座 100 米的简支梁桥'); }">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" stroke-width="1.5"/>
                <rect x="14" y="3" width="7" height="7" stroke-width="1.5"/>
                <rect x="14" y="14" width="7" height="7" stroke-width="1.5"/>
                <rect x="3" y="14" width="7" height="7" stroke-width="1.5"/>
              </svg>
            </div>
            <h3>生成一座 100 米的简支梁桥</h3>
          </div>
          <div class="example-card" @click="() => { message = '创建三跨连续梁桥，每跨 30 米'; handleSend('创建三跨连续梁桥，每跨 30 米'); }">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12 L21 12" stroke-width="1.5"/>
                <path d="M6 12 L10 8 L14 16 L18 12" stroke-width="1.5"/>
              </svg>
            </div>
            <h3>创建三跨连续梁桥，每跨 30 米</h3>
          </div>
          <div class="example-card" @click="() => { message = '设计一个拱桥，跨径 50 米'; handleSend('设计一个拱桥，跨径 50 米'); }">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 15 Q12 3 21 15" stroke-width="1.5"/>
                <path d="M7 15 L17 15" stroke-width="1.5"/>
              </svg>
            </div>
            <h3>设计一个拱桥，跨径 50 米</h3>
          </div>
          <div class="example-card" @click="() => { message = '查看之前设计的桥梁参数'; handleSend('查看之前设计的桥梁参数'); }">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5 L9 19" stroke-width="1.5"/>
                <path d="M15 5 L15 19" stroke-width="1.5"/>
                <path d="M5 12 L19 12" stroke-width="1.5"/>
              </svg>
            </div>
            <h3>查看之前设计的桥梁参数</h3>
          </div>
        </div>

        <!-- 主页聊天输入框（在示例卡片下方，靠近底部） -->
        <div class="input-section">
          <div class="chat-sender-container">
            <ChatSender
              v-model="message"
              :disabled="sending || aiResponding"
              :loading="sending || aiResponding"
              placeholder="描述您想要的桥梁模型..."
              :maxlength="1000"
              :show-limit="true"
              :auto-size="{ minRows: 1, maxRows: 4 }"
              @enter="handleSend"
              @send="handleSend"
              @file-upload="handleFileUpload"
            >
              <!-- 左侧图标 -->
              <template #prefix>
                <TIcon name="edit" class="input-icon" />
              </template>

              <!-- 右侧操作区域 -->
              <template #actions>
                <div class="chat-actions">
                  <!-- 文件上传按钮 -->
                  <TButton
                    variant="text"
                    size="small"
                    :disabled="sending"
                    @click="triggerFileUpload"
                    class="upload-btn"
                  >
                    <template #icon>
                      <TIcon name="attach" />
                    </template>
                  </TButton>

                  <!-- 发送按钮 -->
                  <TButton
                    theme="primary"
                    size="small"
                    :disabled="!message.trim() || sending || aiResponding"
                    :loading="sending || aiResponding"
                    @click="handleSend(message)"
                    class="send-btn"
                  >
                    <template #icon>
                      <TIcon name="send" />
                    </template>
                  </TButton>
                </div>
              </template>
            </ChatSender>

            <!-- 底部提示信息 -->
            <p class="input-hint">
              <TIcon :name="aiResponding ? 'loading' : 'info-circle'" size="14px" />
              <span v-if="aiResponding">AI 正在思考，请稍候...</span>
              <span v-else>AI+BIM 将根据您的描述生成专业的桥梁模型</span>
            </p>

            <!-- 隐藏的文件输入 -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*,.pdf,.doc,.docx,.dwg,.rvt"
              multiple
              style="display: none"
              @change="handleFileSelect"
            />
          </div>
        </div>
      </div>

      <!-- 聊天和预览区域（有三栏布局） -->
      <div v-else class="chat-and-preview-layout">
        <!-- 聊天区域和输入区域 -->
        <div class="chat-area">
          <!-- 聊天记录区域 -->
          <div ref="chatContainerRef" class="chat-container">
            <div class="chat-messages">
              <div
                v-for="msg in chatMessages"
                :key="msg.id"
                class="message-item"
                :class="msg.role === 'user' ? 'message-user' : 'message-ai'"
              >
                <div class="message-avatar">
                  <div v-if="msg.role === 'user'" class="user-avatar">
                    {{ authStore.user?.email?.charAt(0).toUpperCase() }}
                  </div>
                  <div v-else class="ai-avatar">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="aiGradient-msg" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="url(#aiGradient-msg)"/>
                      <circle cx="50" cy="50" r="12" fill="white"/>
                    </svg>
                  </div>
                </div>
                <div class="message-content-wrapper">
                  <div class="message-content">
                    <div class="message-text" v-html="msg.content.replace(/\n/g, '<br>')"></div>
                    <div class="message-time">{{ new Date(msg.created_at).toLocaleTimeString() }}</div>
                  </div>
                  <!-- 消息删除按钮 -->
                  <button
                    class="delete-message-btn"
                    @click="handleDeleteMessage(msg.id)"
                    :disabled="messageStore.isDeletingMessage"
                    :loading="messageStore.isDeletingMessage"
                    title="删除消息"
                  >
                    <TIcon name="delete" size="14px" />
                  </button>
                </div>
              </div>

              <!-- AI 打字动画 -->
              <div v-if="aiResponding" class="message-item message-ai">
                <div class="message-avatar">
                  <div class="ai-avatar">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="aiGradient-typing" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="url(#aiGradient-typing)"/>
                      <circle cx="50" cy="50" r="12" fill="white"/>
                    </svg>
                  </div>
                </div>
                <div class="message-content ai-typing">
                  <div class="typing-dots">
                    AI 正在思考<span class="dots">{{ aiTypingDots }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 智能输入区域 -->
          <div class="input-section">
            <div class="chat-sender-container">
              <ChatSender
                v-model="message"
                :disabled="sending || aiResponding"
                :loading="sending || aiResponding"
                placeholder="描述您想要的桥梁模型..."
                :maxlength="1000"
                :show-limit="true"
                :auto-size="{ minRows: 1, maxRows: 4 }"
                @enter="handleSend"
                @send="handleSend"
                @file-upload="handleFileUpload"
              >
                <!-- 左侧图标 -->
                <template #prefix>
                  <TIcon name="edit" class="input-icon" />
                </template>

                <!-- 右侧操作区域 -->
                <template #actions>
                  <div class="chat-actions">
                    <!-- 文件上传按钮 -->
                    <TButton
                      variant="text"
                      size="small"
                      :disabled="sending"
                      @click="triggerFileUpload"
                      class="upload-btn"
                    >
                      <template #icon>
                        <TIcon name="attach" />
                      </template>
                    </TButton>

                    <!-- 发送按钮 -->
                    <TButton
                      theme="primary"
                      size="small"
                      :disabled="!message.trim() || sending || aiResponding"
                      :loading="sending || aiResponding"
                      @click="handleSend(message)"
                      class="send-btn"
                    >
                      <template #icon>
                        <TIcon name="send" />
                      </template>
                    </TButton>
                  </div>
                </template>
              </ChatSender>

              <!-- 底部提示信息 -->
              <p class="input-hint">
                <TIcon :name="aiResponding ? 'loading' : 'info-circle'" size="14px" />
                <span v-if="aiResponding">AI 正在思考，请稍候...</span>
                <span v-else>AI+BIM 将根据您的描述生成专业的桥梁模型</span>
              </p>

              <!-- 隐藏的文件输入 -->
              <input
                ref="fileInput"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.dwg,.rvt"
                multiple
                style="display: none"
                @change="handleFileSelect"
              />
            </div>
          </div>
        </div>

        <!-- 预览区域 -->
        <PreviewArea
          v-if="isPreviewAreaExpanded"
          :visible="isPreviewAreaExpanded"
          :collapsed="previewAreaCollapsed"
          :content="previewContent"
          @toggle="togglePreviewArea"
          @close="previewAreaVisible = false"
        />
      </div>
    </main>

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      :visible="deleteDialogVisible"
      title="确认删除"
      :message="`确定要删除对话「${conversationToDelete?.title || ''}」吗？此操作将删除对话中的所有消息，且无法恢复。`"
      confirm-text="删除"
      cancel-text="取消"
      theme="danger"
      :loading="conversationStore.isDeleting"
      @close="deleteDialogVisible = false"
      @confirm="confirmDeleteConversation"
    />

    <!-- 清空历史对话框 -->
    <ClearHistoryDialog
      :visible="clearHistoryDialogVisible"
      :loading="conversationStore.isClearingAll"
      @close="clearHistoryDialogVisible = false"
      @confirm="confirmClearAllHistory"
    />

  </div>
</template>

<style scoped>
/* 主容器 */
.main-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 动态背景 */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
}

.bg-gradient-1 {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 20% 30%,
    rgba(59, 130, 246, 0.08) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 80% 70%,
    rgba(139, 92, 246, 0.08) 0%,
    transparent 50%
  );
  animation: gradient-float 20s ease-in-out infinite;
}

.bg-gradient-2 {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 60% 20%,
    rgba(59, 130, 246, 0.05) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 40% 80%,
    rgba(139, 92, 246, 0.05) 0%,
    transparent 50%
  );
  animation: gradient-float 25s ease-in-out infinite reverse;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: pattern-move 30s linear infinite;
}

@keyframes gradient-float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(2%, -2%) rotate(120deg);
  }
  66% {
    transform: translate(-2%, 2%) rotate(240deg);
  }
}

@keyframes pattern-move {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(60px, 60px);
  }
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  z-index: 10;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(59, 130, 246, 0.05) 0%,
    transparent 100%
  );
  pointer-events: none;
}

.sidebar.collapsed {
  width: 0;
}

/* 展开按钮 */
.expand-btn {
  position: fixed !important;
  top: 20px !important;
  left: 20px !important;
  z-index: 1000 !important;
  background: rgba(30, 41, 59, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  width: 48px !important;
  height: 48px !important;
}

.expand-btn:hover {
  background: rgba(30, 41, 59, 1) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.collapse-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.2s ease !important;
}

.collapse-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.new-chat-button {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.new-chat-btn {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  transition: all 0.2s ease !important;
}

.new-chat-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 60px 20px;
  animation: fade-in-up 0.6s ease-out;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  position: relative;
  z-index: 1;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  z-index: 1;
  padding: 0 0 20px 0;
}

/* 欢迎页面布局 */
.welcome-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 20px 20px 20px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* 主标题区域 */
.welcome-header {
  text-align: center;
  animation: fade-in-up 0.8s ease-out;
  margin-bottom: 40px;
}

.hero-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 32px;
  animation: hero-float 4s ease-in-out infinite;
}

@keyframes hero-float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.02);
  }
}

.welcome-title {
  font-size: 3rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  margin: 0 auto;
  max-width: 600px;
  line-height: 1.6;
  font-weight: 400;
}

/* 示例卡片 */
.example-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 800px;
  margin: 0 auto 40px auto;
  animation: fade-in-up 0.8s ease-out 0.4s backwards;
}

.example-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.example-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.example-card:hover {
  transform: translateY(-8px);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.15);
}

.example-card:hover::before {
  opacity: 1;
}

.card-icon {
  width: 48px;
  height: 48px;
  color: #3B82F6;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.example-card:hover .card-icon {
  transform: scale(1.1);
  color: #2563EB;
}

.card-icon svg {
  width: 32px;
  height: 32px;
}

.example-card h3 {
  font-size: 15px;
  color: #1e293b;
  margin: 0;
  line-height: 1.6;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

/* 主页输入区域 - 在示例卡片下方 */
.welcome-page .input-section {
  max-width: 1000px;
  margin: 0 auto 20px auto;
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 0;
}

/* 聊天区输入区域 */
.chat-area .input-section {
  padding: 28px 40px 32px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin: 0 20px 28px 20px;
  border-radius: 24px;
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: none;
  margin-left: auto;
  margin-right: auto;
}

.chat-sender-container {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  position: relative;
}

/* 主页的ChatSender容器样式 */
.welcome-page .chat-sender-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 16px;
  margin: 0 auto;
}

/* 聊天区的ChatSender容器样式 */
.chat-area .chat-sender-container {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  position: relative;
}

/* ChatSender 样式优化 */
:deep(.t-chat-sender) {
  border-radius: 20px !important;
  border: 3px solid #e2e8f0 !important;
  background: white !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden;
  min-height: 80px !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: none !important;
}

:deep(.t-chat-sender:hover) {
  border-color: #3B82F6 !important;
  box-shadow: 0 6px 28px rgba(59, 130, 246, 0.15) !important;
  transform: translateY(-1px) !important;
}

:deep(.t-chat-sender--focused) {
  border-color: #3B82F6 !important;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}

:deep(.t-chat-sender__input) {
  padding: 20px 24px !important;
  font-size: 17px !important;
  line-height: 1.7 !important;
  min-height: 56px !important;
  max-height: 100px !important;
  flex-shrink: 1;
  border-radius: 0 !important;
}

:deep(.t-chat-sender__prefix) {
  margin-left: 20px !important;
  margin-right: 12px !important;
}

:deep(.t-chat-sender__suffix) {
  margin-right: 20px !important;
  margin-left: 12px !important;
}

/* 操作按钮区域 */
.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px 12px 0;
  flex-shrink: 0;
}

/* 上传按钮样式 */
:deep(.upload-btn) {
  color: #94a3b8 !important;
  transition: all 0.2s ease !important;
  height: 48px !important;
  width: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 12px !important;
}

:deep(.upload-btn:hover) {
  color: #3B82F6 !important;
  background: rgba(59, 130, 246, 0.1) !important;
}

:deep(.upload-btn:disabled) {
  color: #cbd5e1 !important;
}

/* 发送按钮样式 */
:deep(.send-btn) {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
  border: none !important;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  height: 48px !important;
  min-width: 56px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 14px !important;
}

:deep(.send-btn:hover:not(:disabled)) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
}

:deep(.send-btn:disabled) {
  background: #e2e8f0 !important;
  box-shadow: none !important;
}

.input-icon {
  color: #94a3b8;
  transition: color 0.2s ease;
  font-size: 24px;
}

:deep(.t-chat-sender--focused) .input-icon {
  color: #3B82F6;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 16px 0;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
  margin-top: 12px;
  padding: 0 4px;
}

:deep(.t-icon--loading) {
  animation: icon-rotate 1s linear infinite;
}

@keyframes icon-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .main-content {
    padding: 0 0 16px 0;
  }

  /* 主页响应式 */
  .welcome-page {
    padding: 20px 16px 16px 16px;
  }

  .welcome-page .input-section {
    margin-bottom: 16px;
  }

  .welcome-page .chat-sender-container {
    border-radius: 12px;
    padding: 12px;
  }

  .chat-area .input-section {
    padding: 16px 20px 20px 20px;
    margin: 0 16px 16px 16px;
  }

  .input-hint {
    font-size: 13px;
    margin: 10px 0 0 0;
  }

  :deep(.t-chat-sender__input) {
    padding: 12px 16px !important;
    font-size: 15px !important;
    min-height: 42px !important;
    max-height: 60px !important;
  }

  :deep(.t-chat-sender__prefix) {
    margin-left: 16px !important;
    margin-right: 8px !important;
  }

  .chat-actions {
    gap: 6px;
    padding: 0 16px 8px 0;
  }

  :deep(.send-btn) {
    padding: 8px 12px !important;
    min-width: 44px !important;
    height: 36px !important;
    border-radius: 10px !important;
  }

  :deep(.upload-btn) {
    padding: 8px !important;
    height: 36px !important;
    width: 36px !important;
    border-radius: 8px !important;
  }

  .input-icon {
    font-size: 20px;
  }
}

/* 响应式 - 平板端 */
@media (max-width: 1024px) {
  .welcome-title {
    font-size: 2.5rem;
  }

  .example-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* 响应式 - 移动端 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 100;
    height: 100%;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1.1rem;
  }

  .hero-icon {
    width: 100px;
    height: 100px;
  }

  .example-card {
    padding: 24px 20px;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 1.75rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .example-cards {
    gap: 16px;
  }

  .example-card {
    padding: 20px 16px;
  }
}

/* 会话列表样式 */
.conversations {
  padding: 0;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);
  position: relative;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.conversation-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.conversation-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  margin-right: 12px;
}

.conversation-icon svg {
  width: 100%;
  height: 100%;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-time {
  font-size: 12px;
  margin: 0;
  opacity: 0.6;
}

/* 删除按钮样式 */
.delete-conversation-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  padding: 0;
}

.conversation-item:hover .delete-conversation-btn {
  opacity: 1;
}

.delete-conversation-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.delete-conversation-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 清空所有历史按钮样式 */
.clear-history-button {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.clear-history-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 14px !important;
  transition: all 0.2s ease !important;
}

.clear-history-btn:hover {
  color: #f44336 !important;
  background: rgba(244, 67, 54, 0.1) !important;
}

/* 修复 RLS 策略按钮样式 */
.fix-rls-button {
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.fix-rls-btn {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 12px !important;
  transition: all 0.2s ease !important;
}

.fix-rls-btn:hover {
  color: #3B82F6 !important;
  background: rgba(59, 130, 246, 0.1) !important;
}

/* 聊天界面样式 */
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  z-index: 1;
  min-height: 0;
  padding: 0 20px 0 20px;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 0;
  scroll-behavior: smooth;
}

.chat-messages {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message-item {
  display: flex;
  gap: 12px;
  animation: message-appear 0.3s ease-out;
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* AI消息 - 左侧对齐 */
.message-ai {
  justify-content: flex-start;
  flex-direction: row;
}

.message-ai .message-avatar {
  order: 0;
}

.message-ai .message-content {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
  color: white !important;
  border-radius: 18px 18px 18px 4px !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15) !important;
}

/* 用户消息 - 右侧对齐 */
.message-user {
  justify-content: flex-end;
  flex-direction: row;
}

.message-user .message-avatar {
  order: 1;
}

.message-user .message-content {
  background: #f5f5f5 !important;
  color: #1e293b !important;
  border-radius: 18px 18px 4px 18px !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

/* AI 打字动画样式 */
.ai-typing .typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  font-size: 14px;
  padding: 12px 16px;
}

/* AI思考气泡样式，与AI消息保持一致 */
.ai-typing {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
  color: white !important;
  border-radius: 18px 18px 18px 4px !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15) !important;
}

.ai-typing .dots {
  display: inline-block;
  min-width: 24px;
  animation: typing-pulse 1.5s ease-in-out infinite;
}

@keyframes typing-pulse {
  0%, 20% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  80%, 100% {
    opacity: 0.3;
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar svg {
  width: 36px !important;
  height: 36px !important;
  display: block;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-time {
  font-size: 11px;
  margin-top: 6px;
  opacity: 0.7;
}

.message-user .message-time {
  text-align: right;
}

.message-ai .message-time {
  text-align: left;
}

/* 消息内容包装器 */
.message-content-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

/* 消息删除按钮样式 */
.delete-message-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  padding: 0;
  backdrop-filter: blur(10px);
}

.message-item:hover .delete-message-btn {
  opacity: 1;
}

.delete-message-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.delete-message-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }

  .chat-section {
    padding: 0 16px 0 16px;
  }

  .chat-container {
    padding: 16px 0;
  }

  .chat-messages {
    gap: 16px;
  }

  .message-item {
    gap: 8px;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .ai-avatar {
    width: 32px;
    height: 32px;
  }

  .ai-avatar svg {
    width: 32px !important;
    height: 32px !important;
  }
}

/* 三栏布局样式 */
.chat-and-preview-layout {
  display: flex;
  height: 100%;
  width: 100%;
  flex: 1;
  flex-direction: row;
}

.chat-area {
  flex: 0 0 40%;
  max-width: 40%;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防止flex子元素溢出 */
  order: 2; /* 聊天区域在右侧 */
}

.preview-area {
  order: 1; /* 预览区域在左侧（中间位置） */
  flex-shrink: 0; /* 防止预览区域被压缩 */
}

/* 调整聊天容器样式以适应新布局 */
.chat-and-preview-layout .chat-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 0;
}

.chat-and-preview-layout .chat-messages {
  max-width: none; /* 移除最大宽度限制，让聊天区域自适应 */
  margin: 0 auto; /* 居中对齐消息 */
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

/* 调整消息项样式以适应新布局 */
.chat-and-preview-layout .message-item {
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.chat-and-preview-layout .message-content {
  max-width: 100%;
  width: auto;
  flex: 1;
}

/* 调整三栏布局的输入区域样式 */
.chat-and-preview-layout .input-section {
  margin: 0 auto 28px auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.12);
  width: 80%;
  max-width: 800px;
  min-width: 300px;
}

.chat-and-preview-layout .chat-sender-container {
  margin: 0 auto;
  width: 100%;
}

/* 侧边栏收缩状态的样式优化 */
.sidebar.collapsed {
  width: 56px !important;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center !important;
  padding: 16px 8px !important;
}

.sidebar.collapsed .logo-container {
  justify-content: center !important;
  width: 100% !important;
}

.sidebar.collapsed .logo-icon {
  margin: 0 auto !important;
}

.sidebar.collapsed .new-chat-button {
  padding: 12px 8px !important;
  display: flex !important;
  justify-content: center !important;
}

.sidebar.collapsed .new-chat-btn {
  justify-content: center !important;
  padding: 0 !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  border-radius: 10px !important;
}

.sidebar.collapsed .conversation-list {
  padding: 8px !important;
}

.sidebar.collapsed .conversation-item {
  justify-content: center !important;
  padding: 0 !important;
  width: 40px !important;
  height: 40px !important;
  margin: 0 auto 8px auto !important;
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease !important;
}

.sidebar.collapsed .conversation-item:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.sidebar.collapsed .conversation-item .conversation-icon {
  margin: 0 !important;
}

.sidebar.collapsed .user-section {
  padding: 12px 8px !important;
  display: flex !important;
  justify-content: center !important;
}

.sidebar.collapsed .user-section .t-button {
  justify-content: center !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  padding: 0 !important;
  border-radius: 10px !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.sidebar.collapsed .user-section .t-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* 预览区域显示时的布局调整 */
.preview-area-visible .main-content {
  padding-right: 0;
}

/* 响应式适配 - 平板端 */
@media (max-width: 1199px) and (min-width: 768px) {
  .preview-area {
    width: 320px;
  }
}

/* 响应式适配 - 移动端 */
@media (max-width: 767px) {
  .chat-and-preview-layout {
    position: relative;
  }

  .preview-area {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .chat-and-preview-layout .input-section {
    margin: 0 16px 16px 16px;
  }

  .chat-and-preview-layout .chat-container {
    padding: 16px 0;
  }

  .chat-and-preview-layout .chat-messages {
    gap: 16px;
  }
}

/* 已移除旧的欢迎页面样式，使用新的扁平化结构 */
</style>
