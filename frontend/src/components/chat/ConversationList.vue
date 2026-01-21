<script setup lang="ts">
import { ref, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useConversationStore } from '@/stores/conversation'
import { useAuthStore } from '@/stores/auth'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const conversationStore = useConversationStore()
const authStore = useAuthStore()

// 对话删除相关状态
const deleteDialogVisible = ref(false)
const conversationToDelete = ref<any>(null)

// 对话列表（按创建时间倒序）
const conversations = computed(() => {
  return [...conversationStore.conversations].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
})

// 当前对话 ID
const currentConversationId = computed(() => conversationStore.currentConversation?.id)

// 是否正在删除
const isDeleting = computed(() => conversationStore.isDeleting)

// 选择对话
function handleSelectConversation(conversation: any) {
  conversationStore.selectConversation(conversation)
}

// 创建新对话
async function handleCreateConversation() {
  const newConversation = await conversationStore.createConversation('新对话')
  if (newConversation) {
    MessagePlugin.success('已创建新对话')
  }
}

// 删除对话
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

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于 1 天
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 小于 7 天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  // 其他
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="chat-conversation-list">
    <!-- 对话列表（可滚动） -->
    <div class="conversation-list-scroll">
      <div
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ active: conversation.id === currentConversationId }"
        @click="handleSelectConversation(conversation)"
      >
        <!-- 对话图标 -->
        <div class="conversation-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- 对话内容 -->
        <div class="conversation-content">
          <p class="conversation-title">{{ conversation.title }}</p>
          <p class="conversation-time">{{ formatTime(conversation.created_at) }}</p>
        </div>

        <!-- 删除按钮 -->
        <button
          class="delete-btn"
          @click="handleDeleteConversation(conversation, $event)"
          :disabled="isDeleting"
          title="删除对话"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4H3.33333H14"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M5.3335 4.00001V2.66667C5.3335 2.31305 5.47397 1.97391 5.72402 1.72386C5.97407 1.47381 6.31321 1.33334 6.66683 1.33334H9.3335C9.68712 1.33334 10.0263 1.47381 10.2763 1.72386C10.5264 1.97391 10.6668 2.31305 10.6668 2.66667V4.00001M12.6668 4.00001V12.6667C12.6668 13.0203 12.5264 13.3594 12.2763 13.6095C12.0263 13.8595 11.6871 14 11.3335 14H4.66683C4.31321 14 3.97407 13.8595 3.72402 13.6095C3.47397 13.3594 3.3335 13.0203 3.3335 12.6667V4.00001H12.6668Z"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 新建对话按钮（固定在底部） -->
    <button
      class="new-conversation-btn"
      @click="handleCreateConversation"
      :disabled="!authStore.isAuthenticated"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 4.16667V15.8333M4.16667 10H15.8333"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      新建对话
    </button>

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="deleteDialogVisible"
      title="确认删除对话"
      message="删除后无法恢复，是否继续？"
      @confirm="confirmDeleteConversation"
    />
  </div>
</template>

<style scoped lang="scss">
.chat-conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 8px;
  overflow: hidden; // 防止整个容器滚动

  // 对话列表滚动区域
  .conversation-list-scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0; // 允许flex子项缩小
  }

  .conversation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--td-chat-conversation-bg);
    border: 1px solid transparent;
    position: relative;
    flex-shrink: 0; // 防止对话项被压缩

    &:hover {
      background: var(--td-chat-conversation-bg-hover);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.active {
      background: var(--td-chat-conversation-bg-active);
      border-color: var(--td-chat-border-color);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
    }

    .conversation-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 8px;
      flex-shrink: 0;

      svg {
        width: 20px;
        height: 20px;
        color: white;
      }
    }

    .conversation-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .conversation-title {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--td-chat-conversation-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .conversation-time {
        margin: 0;
        font-size: 12px;
        color: var(--td-chat-conversation-text);
        opacity: 0.6;
      }
    }

    .delete-btn {
      opacity: 0;
      transition: opacity 0.2s ease;
      background: transparent;
      border: none;
      color: var(--td-chat-conversation-text);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &:hover .delete-btn {
      opacity: 1;
    }
  }

  .new-conversation-btn {
    flex-shrink: 0; // 防止按钮被压缩
    padding: 12px;
    background: var(--td-chat-button-primary);
    color: var(--td-chat-button-text);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--td-chat-button-primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// 滚动条样式
.conversation-list-scroll {
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: var(--td-chat-scrollbar-track);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--td-chat-scrollbar-thumb);
    border-radius: 2px;

    &:hover {
      background: var(--td-chat-scrollbar-thumb-hover);
    }
  }
}
</style>
