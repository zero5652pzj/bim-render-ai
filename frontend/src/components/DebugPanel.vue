<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { supabase } from '@/lib/supabase'
import { MessagePlugin } from 'tdesign-vue-next'

const authStore = useAuthStore()
const conversationStore = useConversationStore()

const debugInfo = ref({
  supabaseUrl: '',
  supabaseKey: '',
  user: null as any,
  isAuthenticated: false,
  databaseConnection: false,
  tablesExist: false,
  error: null as any
})

async function runDiagnostics() {
  try {
    debugInfo.value.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    debugInfo.value.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    debugInfo.value.user = authStore.user
    debugInfo.value.isAuthenticated = authStore.isAuthenticated

    // 测试数据库连接
    const { data, error } = await supabase.from('conversations').select('count', { count: 'exact', head: true })
    if (error) {
      debugInfo.value.error = error
    } else {
      debugInfo.value.databaseConnection = true
      debugInfo.value.tablesExist = true
    }
  } catch (err: any) {
    debugInfo.value.error = err
  }
}

async function testCreateConversation() {
  if (!authStore.user) {
    MessagePlugin.warning('请先登录')
    return
  }

  try {
    const result = await conversationStore.createConversation('测试会话')
    if (result) {
      MessagePlugin.success('会话创建成功！')
    } else {
      MessagePlugin.error('会话创建失败，请查看控制台日志')
    }
  } catch (err: any) {
    MessagePlugin.error(`创建会话异常: ${err.message}`)
  }
}

onMounted(() => {
  runDiagnostics()
})
</script>

<template>
  <div class="debug-panel">
    <h3>🔧 诊断面板</h3>

    <div class="debug-section">
      <h4>Supabase 配置</h4>
      <p><strong>URL:</strong> {{ debugInfo.supabaseUrl }}</p>
      <p><strong>Key:</strong> {{ debugInfo.supabaseKey }}</p>
    </div>

    <div class="debug-section">
      <h4>认证状态</h4>
      <p><strong>已登录:</strong> {{ debugInfo.isAuthenticated ? '✅ 是' : '❌ 否' }}</p>
      <p v-if="debugInfo.user"><strong>用户ID:</strong> {{ debugInfo.user.id }}</p>
      <p v-if="debugInfo.user"><strong>邮箱:</strong> {{ debugInfo.user.email }}</p>
    </div>

    <div class="debug-section">
      <h4>数据库连接</h4>
      <p><strong>连接状态:</strong> {{ debugInfo.databaseConnection ? '✅ 正常' : '❌ 异常' }}</p>
      <p><strong>表状态:</strong> {{ debugInfo.tablesExist ? '✅ 存在' : '❌ 不存在' }}</p>
    </div>

    <div v-if="debugInfo.error" class="debug-section error">
      <h4>错误信息</h4>
      <pre>{{ JSON.stringify(debugInfo.error, null, 2) }}</pre>
    </div>

    <div class="debug-actions">
      <TButton theme="primary" @click="runDiagnostics">🔄 重新诊断</TButton>
      <TButton theme="success" @click="testCreateConversation" :disabled="!debugInfo.isAuthenticated">
        🧪 测试创建会话
      </TButton>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  max-height: 80vh;
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.debug-section p {
  margin: 4px 0;
  font-size: 13px;
  color: #6b7280;
}

.debug-section.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.debug-section.error h4 {
  color: #dc2626;
}

pre {
  font-size: 12px;
  color: #dc2626;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.debug-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}
</style>
