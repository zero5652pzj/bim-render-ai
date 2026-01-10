import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Tables } from '@/lib/supabase'

export interface Message extends Tables<'messages'> {
  files?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
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

  return {
    messages,
    loading,
    sending,
    isDeletingMessage,
    loadMessages,
    sendMessage,
    deleteMessage,
    clearConversationMessages,
    clearMessages,
  }
})
