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

  // 软删除消息
  async function softDeleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId)

    if (!error) {
      messages.value = messages.value.filter(m => m.id !== messageId)
      return true
    }
    return false
  }

  // 清空当前会话的消息
  function clearMessages() {
    messages.value = []
  }

  return {
    messages,
    loading,
    sending,
    loadMessages,
    sendMessage,
    softDeleteMessage,
    clearMessages,
  }
})
