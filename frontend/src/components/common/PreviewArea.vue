<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, Icon } from 'tdesign-vue-next'

// Props
interface Props {
  visible?: boolean
  collapsed?: boolean
  content?: Array<{
    id: number
    type: string
    title: string
    description: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  collapsed: false,
  content: () => []
})

// Emits
const emit = defineEmits<{
  toggle: []
  close: []
}>()

// 预览内容数据（使用外部传递的数据，如果没有则使用默认数据）
const previewContent = computed(() => {
  return props.content.length > 0 ? props.content : [
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
  ]
})

// 选中的预览内容
const selectedContent = ref(previewContent.value[0])

// 是否显示空状态
const showEmptyState = computed(() => {
  return !selectedContent.value
})

// 获取内容类型的图标
function getContentIcon(type: string) {
  const icons: Record<string, string> = {
    pdf: 'file-pdf',
    image: 'image',
    web: 'link',
    default: 'file'
  }
  return icons[type] || icons.default
}

// 获取内容类型的颜色
function getContentColor(type: string) {
  const colors: Record<string, string> = {
    pdf: '#FF6B6B',
    image: '#4ECDC4',
    web: '#45B7D1',
    default: '#96CEB4'
  }
  return colors[type] || colors.default
}
</script>

<template>
  <div v-if="visible && !collapsed" class="preview-area">
    <!-- 预览区域头部 -->
    <div class="preview-header">
      <div class="preview-title">
        <Icon name="preview" size="18px" />
        <span>预览区域</span>
      </div>
      <div class="preview-actions">
        <Button
          variant="text"
          size="small"
          @click="emit('toggle')"
          title="收起预览区域"
        >
          <Icon name="chevron-right" />
        </Button>
        <Button
          variant="text"
          size="small"
          @click="emit('close')"
          title="关闭预览区域"
        >
          <Icon name="close" />
        </Button>
      </div>
    </div>

    <!-- 预览内容列表 -->
    <div class="preview-content-list" v-if="previewContent.length > 0">
      <div
        v-for="content in previewContent"
        :key="content.id"
        class="preview-content-item"
        :class="{ active: selectedContent?.id === content.id }"
        @click="selectedContent = content"
      >
        <div
          class="content-icon"
          :style="{ color: getContentColor(content.type) }"
        >
          <Icon :name="getContentIcon(content.type)" size="20px" />
        </div>
        <div class="content-info">
          <div class="content-title">{{ content.title }}</div>
          <div class="content-description">{{ content.description }}</div>
        </div>
      </div>
    </div>

    <!-- 预览内容显示区域 -->
    <div class="preview-display">
      <div v-if="selectedContent && !showEmptyState" class="preview-display-content">
        <!-- 内容标题 -->
        <div class="content-display-header">
          <h3 class="display-title">{{ selectedContent.title }}</h3>
          <div class="content-type-badge" :style="{ backgroundColor: getContentColor(selectedContent.type) }">
            {{ selectedContent.type.toUpperCase() }}
          </div>
        </div>

        <!-- PDF预览 -->
        <div v-if="selectedContent.type === 'pdf'" class="pdf-preview">
          <div class="pdf-placeholder">
            <Icon name="file-pdf" size="48px" color="#FF6B6B" />
            <p>PDF 预览功能开发中</p>
            <p class="hint">将支持完整的PDF查看和交互功能</p>
          </div>
        </div>

        <!-- 图片预览 -->
        <div v-else-if="selectedContent.type === 'image'" class="image-preview">
          <div class="image-placeholder">
            <Icon name="image" size="48px" color="#4ECDC4" />
            <p>图片预览功能开发中</p>
            <p class="hint">将支持图片查看、缩放等交互功能</p>
          </div>
        </div>

        <!-- 网页预览 -->
        <div v-else-if="selectedContent.type === 'web'" class="web-preview">
          <div class="web-placeholder">
            <Icon name="link" size="48px" color="#45B7D1" />
            <p>网页预览功能开发中</p>
            <p class="hint">将支持网页嵌入和安全浏览功能</p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="preview-empty-state">
        <div class="empty-icon">
          <Icon name="preview-open" size="64px" />
        </div>
        <h3 class="empty-title">暂无预览内容</h3>
        <p class="empty-description">
          上传文件或分享链接，即可在此处预览
        </p>
        <div class="empty-hint">
          <div class="hint-item">
            <Icon name="file-pdf" size="16px" />
            <span>支持 PDF 文档</span>
          </div>
          <div class="hint-item">
            <Icon name="image" size="16px" />
            <span>支持图片文件</span>
          </div>
          <div class="hint-item">
            <Icon name="link" size="16px" />
            <span>支持网页链接</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-area {
  width: 400px;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 预览区域头部 */
.preview-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 内容列表 */
.preview-content-list {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  max-height: 200px;
  overflow-y: auto;
}

.preview-content-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.preview-content-item:last-child {
  margin-bottom: 0;
}

.preview-content-item:hover {
  background: rgba(59, 130, 246, 0.08);
}

.preview-content-item.active {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.content-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.content-info {
  flex: 1;
  min-width: 0;
}

.content-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-description {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 预览显示区域 */
.preview-display {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.preview-display-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-display-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.display-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.content-type-badge {
  padding: 4px 8px;
  border-radius: 6px;
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 各种预览类型的占位符 */
.pdf-preview,
.image-preview,
.web-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-placeholder,
.image-placeholder,
.web-placeholder {
  text-align: center;
  color: #64748b;
}

.pdf-placeholder p,
.image-placeholder p,
.web-placeholder p {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: #1e293b;
}

.hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

/* 空状态 */
.preview-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.4;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.empty-description {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .preview-area {
    width: 100%;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  }

  .preview-content-list {
    max-height: 150px;
  }

  .preview-display {
    padding: 16px;
  }
}
</style>
