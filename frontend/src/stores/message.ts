import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Tables } from '@/lib/supabase'

export interface Message extends Tables<'messages'> {
  files?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
}

// TDesign Chat 消息操作类型
export type TdChatAction = 'regenerate' | 'copy' | 'delete' | 'edit'

// TDesign Chat 兼容的消息格式（content 必须是字符串）
export interface TdChatItemMeta {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  avatar?: string
  name?: string
  datetime?: string
  created_at?: string
  actions?: TdChatAction[]
  textType?: 'text' | 'markdown' | 'html'
}

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const isDeletingMessage = ref(false)

  // 加载消息历史
  async function loadMessages(conversationId: string) {
    loading.value = true
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      messages.value = data || []
    } finally {
      loading.value = false
    }
  }

  // 发送消息
  async function sendMessage(conversationId: string, content: string, files?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>) {
    sending.value = true
    try {
      // 先发送用户消息
      const userMessage = {
        conversation_id: conversationId,
        role: 'user' as const,
        content,
        metadata: files ? { files } : {},
      }

      const { data: userData, error: userError } = await supabase
        .from('messages')
        .insert(userMessage)
        .select()
        .single()

      if (userError) throw userError

      messages.value.push(userData)

      return { success: true, userMessage: userData }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '消息发送失败'
      }
    } finally {
      sending.value = false
    }
  }

  // 删除消息（软删除）
  async function deleteMessage(messageId: string): Promise<boolean> {
    isDeletingMessage.value = true
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)

      if (!error) {
        messages.value = messages.value.filter(m => m.id !== messageId)
        console.log('[MessageStore] 消息删除成功：', messageId)
        return true
      } else {
        console.error('[MessageStore] 消息删除失败：', error)
        return false
      }
    } catch (err) {
      console.error('[MessageStore] 删除消息异常：', err)
      return false
    } finally {
      isDeletingMessage.value = false
    }
  }

  // 清空指定对话的所有消息
  async function clearConversationMessages(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('conversation_id', conversationId)

      if (!error) {
        messages.value = []
        console.log('[MessageStore] 清空对话消息成功：', conversationId)
        return true
      } else {
        console.error('[MessageStore] 清空对话消息失败：', error)
        return false
      }
    } catch (err) {
      console.error('[MessageStore] 清空对话消息异常：', err)
      return false
    }
  }

  // 清空当前会话的消息
  function clearMessages() {
    messages.value = []
  }

  // 将消息转换为 TDesign Chat 格式
  function toTdChatMessages(): TdChatItemMeta[] {
    return messages.value.map(msg => {
      const actions: TdChatAction[] = ['copy']
      if (msg.role === 'assistant') {
        actions.push('regenerate')
      }
      actions.push('delete')

      // TDesign Chat 使用对象格式时可以指定文本类型
      // 对于 assistant 消息，使用 markdown 格式
      const isAssistant = msg.role === 'assistant'

      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        // 为 TDesign Chat 添加渲染类型属性
        ...(isAssistant && { textType: 'markdown' as const }),
        datetime: new Date(msg.created_at).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        created_at: msg.created_at,
        name: msg.role === 'user' ? '用户' : 'AI 助手',
        actions
      }
    })
  }

  // 计算属性：TDesign Chat 格式的消息列表
  const tdChatMessages = computed(() => toTdChatMessages())

  return {
    messages,
    loading,
    sending,
    isDeletingMessage,
    tdChatMessages,
    toTdChatMessages,
    loadMessages,
    sendMessage,
    deleteMessage,
    clearConversationMessages,
    clearMessages,
  }
})
