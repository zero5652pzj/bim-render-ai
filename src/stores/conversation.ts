import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type Tables } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Tables<'conversations'>[]>([])
  const currentConversation = ref<Tables<'conversations'> | null>(null)
  const loading = ref(false)

  // 加载会话列表
  async function loadConversations() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('is_deleted', false)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      conversations.value = data || []
    } finally {
      loading.value = false
    }
  }

  // 创建新会话
  async function createConversation(title = '新对话') {
    const authStore = useAuthStore()
    if (!authStore.user) return null

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: authStore.user.id,
        title,
      })
      .select()
      .single()

    if (!error && data) {
      conversations.value.unshift(data)
      currentConversation.value = data
      return data
    }

    return null
  }

  // 删除会话（软删除）
  async function deleteConversation(id: string) {
    const { error } = await supabase
      .from('conversations')
      .update({ is_deleted: true })
      .eq('id', id)

    if (!error) {
      conversations.value = conversations.value.filter(c => c.id !== id)
      if (currentConversation.value?.id === id) {
        currentConversation.value = null
      }
      return true
    }
    return false
  }

  // 重命名会话
  async function renameConversation(id: string, title: string) {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)

    if (!error) {
      const conv = conversations.value.find(c => c.id === id)
      if (conv) conv.title = title
      if (currentConversation.value?.id === id) {
        currentConversation.value.title = title
      }
      return true
    }
    return false
  }

  // 选择会话
  function selectConversation(conversation: Tables<'conversations'>) {
    currentConversation.value = conversation
  }

  return {
    conversations,
    currentConversation,
    loading,
    loadConversations,
    createConversation,
    deleteConversation,
    renameConversation,
    selectConversation,
  }
})
