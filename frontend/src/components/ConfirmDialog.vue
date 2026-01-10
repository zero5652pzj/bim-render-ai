<template>
  <t-dialog
    :visible="visible"
    :title="title"
    :close-on-esc-keydown="true"
    :close-on-overlay-click="false"
    :destroy-on-close="true"
    @close="$emit('close')"
  >
    <div class="confirm-dialog-content">
      <div class="dialog-icon" v-if="icon">
        <t-icon :name="icon" :size="24" />
      </div>
      <div class="dialog-text">
        <p class="dialog-message">{{ message }}</p>
        <slot name="content"></slot>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <t-button
          variant="outline"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </t-button>
        <t-button
          :theme="confirmTheme"
          :loading="loading"
          :disabled="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </t-button>
      </div>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  icon?: string
  theme?: 'danger' | 'primary'
  loading?: boolean
  requireConfirm?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消',
  theme: 'danger',
  loading: false,
  requireConfirm: false,
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const inputValue = ref('')
const isValid = ref(false)

const confirmTheme = computed(() => props.theme)

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    inputValue.value = ''
    isValid.value = false
  }
})

watch(inputValue, (newVal) => {
  if (props.requireConfirm) {
    isValid.value = newVal === 'DELETE'
  }
})

const handleCancel = () => {
  if (props.loading) return
  emit('close')
}

const handleConfirm = () => {
  if (props.loading || (props.requireConfirm && !isValid.value)) return
  emit('confirm')
}
</script>

<style scoped>
.confirm-dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.dialog-icon {
  flex-shrink: 0;
  margin-top: 4px;
}

.dialog-text {
  flex: 1;
}

.dialog-message {
  margin: 0;
  color: var(--td-text-color-primary);
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
