<template>
  <ConfirmDialog
    :visible="visible"
    title="清空所有历史记录"
    :message="dialogMessage"
    confirm-text="清空历史"
    cancel-text="取消"
    theme="danger"
    :loading="loading"
    :require-confirm="true"
    @close="$emit('close')"
    @confirm="handleConfirm"
  >
    <template #content>
      <div class="clear-history-warning">
        <div class="warning-icon">
          <t-icon name="error-circle" size="24" />
        </div>
        <div class="warning-content">
          <h4 class="warning-title">⚠️ 警告：此操作将删除您的所有对话历史！</h4>
          <p class="warning-description">此操作将会：</p>
          <ul class="warning-list">
            <li>删除所有对话</li>
            <li>删除所有消息</li>
            <li>无法恢复</li>
          </ul>
        </div>
      </div>

      <div class="confirm-input-section">
        <p class="confirm-label">如果您确认要继续，请在下方输入：</p>
        <t-input
          v-model="confirmText"
          placeholder="请输入 DELETE 确认"
          :disabled="loading"
          @keydown.enter="handleConfirm"
        />
      </div>
    </template>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  visible: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const confirmText = ref('')

const dialogMessage = '此操作将永久删除您的所有聊天记录，且无法恢复。请谨慎操作。'

const handleConfirm = () => {
  if (confirmText.value !== 'DELETE') {
    return
  }
  emit('confirm')
  confirmText.value = ''
}
</script>

<style scoped>
.clear-history-warning {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--td-warning-color-light);
  border-radius: var(--td-radius-medium);
}

.warning-icon {
  flex-shrink: 0;
  color: var(--td-warning-color);
  margin-top: 4px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-warning-color);
}

.warning-description {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.warning-list li {
  margin-bottom: 4px;
}

.confirm-input-section {
  margin-top: 16px;
}

.confirm-label {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}
</style>
