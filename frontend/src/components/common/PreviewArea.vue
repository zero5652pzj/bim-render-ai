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
/* ========================================
   科技感玻璃态预览区域 - AI+BIM
   ======================================== */

/* 引入 Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

/* CSS 变量 - 科技感配色方案 */
.preview-area {
  --neon-blue: #3B82F6;
  --neon-violet: #8B5CF6;
  --neon-cyan: #06B6D4;
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.85);
  --text-muted: rgba(255, 255, 255, 0.6);

  width: 60%;
  min-width: 500px;
  height: 100%;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-left: 1px solid rgba(59, 130, 246, 0.25);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    -4px 0 32px rgba(0, 0, 0, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.05);
}

/* 预览区域左侧霓虹边框 */
.preview-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(59, 130, 246, 0.6) 20%,
    rgba(139, 92, 246, 0.6) 50%,
    rgba(59, 130, 246, 0.6) 80%,
    transparent 100%
  );
  opacity: 0.7;
  animation: border-pulse-vertical 4s ease-in-out infinite;
}

@keyframes border-pulse-vertical {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ========================================
   科技感预览区域头部
   ======================================== */
.preview-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 17px;
  text-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.preview-title :deep(.t-icon) {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 科技感按钮样式 */
.preview-actions :deep(.t-button) {
  color: var(--text-secondary) !important;
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 10px !important;
}

.preview-actions :deep(.t-button:hover) {
  color: var(--neon-cyan) !important;
  background: rgba(6, 182, 212, 0.2) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.4) !important;
  transform: translateY(-2px) !important;
}

/* ========================================
   科技感内容列表
   ======================================== */
.preview-content-list {
  padding: 18px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.15);
  max-height: 220px;
  overflow-y: auto;
}

/* 自定义滚动条 - 科技感 */
.preview-content-list::-webkit-scrollbar {
  width: 4px;
}

.preview-content-list::-webkit-scrollbar-track {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 2px;
}

.preview-content-list::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 2px;
}

.preview-content-list::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

.preview-content-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 10px;
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.12);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

/* 扫描线效果 */
.preview-content-item::before {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(59, 130, 246, 0.1) 50%,
    transparent 100%
  );
  transition: top 0.5s ease;
  opacity: 0;
}

.preview-content-item:last-child {
  margin-bottom: 0;
}

.preview-content-item:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.35);
  transform: translateX(4px);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.25);
}

.preview-content-item:hover::before {
  opacity: 1;
  top: 100%;
}

.preview-content-item.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow:
    0 0 25px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 活跃项左侧霓虹条 */
.preview-content-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  bottom: 25%;
  width: 3px;
  background: linear-gradient(180deg, #3B82F6, #8B5CF6);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.7);
}

.content-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.12);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.content-icon :deep(.t-icon) {
  filter: drop-shadow(0 0 8px currentColor);
}

.content-info {
  flex: 1;
  min-width: 0;
}

.content-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-description {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========================================
   科技感预览显示区域
   ======================================== */
.preview-display {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 自定义滚动条 - 科技感 */
.preview-display::-webkit-scrollbar {
  width: 6px;
}

.preview-display::-webkit-scrollbar-track {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 3px;
}

.preview-display::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 3px;
}

.preview-display::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
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
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.display-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  text-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.content-type-badge {
  padding: 6px 12px;
  border-radius: 8px;
  color: white;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  box-shadow:
    0 0 15px currentColor,
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* ========================================
   科技感预览占位符
   ======================================== */
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
  color: var(--text-secondary);
  padding: 60px 40px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(59, 130, 246, 0.15);
  backdrop-filter: blur(10px);
}

.pdf-placeholder :deep(.t-icon),
.image-placeholder :deep(.t-icon),
.web-placeholder :deep(.t-icon) {
  filter: drop-shadow(0 0 20px currentColor);
  margin-bottom: 8px;
}

.pdf-placeholder p,
.image-placeholder p,
.web-placeholder p {
  margin: 18px 0 10px 0;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* ========================================
   科技感空状态
   ======================================== */
.preview-empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 40px;
}

.empty-icon {
  margin-bottom: 28px;
  opacity: 0.7;
  filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
  animation: empty-float 3s ease-in-out infinite;
}

@keyframes empty-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 14px 0;
  text-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.empty-description {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 36px 0;
  line-height: 1.7;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-muted);
  background: rgba(59, 130, 246, 0.08);
  padding: 12px 18px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.15);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.hint-item:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(4px);
}

.hint-item :deep(.t-icon) {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

/* ========================================
   浅色主题适配
   ======================================== */
:root[data-theme="light"] .preview-area {
  --text-primary: #2D333A;
  --text-secondary: #6E6E80;
  --text-muted: #8E8EA0;
  background: rgba(255, 255, 255, 0.95);
  border-left: 1px solid #ECECF1;
  box-shadow:
    -2px 0 16px rgba(0, 0, 0, 0.08),
    inset 1px 0 0 rgba(255, 255, 255, 0.8);
}

:root[data-theme="light"] .preview-area::before {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(59, 130, 246, 0.3) 20%,
    rgba(59, 130, 246, 0.3) 50%,
    rgba(59, 130, 246, 0.3) 80%,
    transparent 100%
  );
  animation: none;
}

:root[data-theme="light"] .preview-header {
  background: rgba(247, 247, 248, 0.95);
  border-bottom: 1px solid #ECECF1;
}

:root[data-theme="light"] .preview-title {
  color: var(--text-primary);
  text-shadow: none;
}

:root[data-theme="light"] .preview-title :deep(.t-icon) {
  filter: none;
}

:root[data-theme="light"] .preview-actions :deep(.t-button) {
  color: var(--text-secondary) !important;
  background: #FFFFFF !important;
  border: 1px solid #D9D9E3 !important;
}

:root[data-theme="light"] .preview-actions :deep(.t-button:hover) {
  color: var(--brand) !important;
  background: #F7F7F8 !important;
  border-color: var(--brand) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  transform: translateY(-1px) !important;
}

:root[data-theme="light"] .preview-content-list {
  border-bottom: 1px solid #ECECF1;
}

:root[data-theme="light"] .preview-content-list::-webkit-scrollbar-track {
  background: #F7F7F8;
}

:root[data-theme="light"] .preview-content-list::-webkit-scrollbar-thumb {
  background: #D9D9E3;
}

:root[data-theme="light"] .preview-content-list::-webkit-scrollbar-thumb:hover {
  background: #C4C4CF;
}

:root[data-theme="light"] .preview-content-item {
  background: #FFFFFF;
  border: 1px solid #ECECF1;
}

:root[data-theme="light"] .preview-content-item:hover {
  background: #F7F7F8;
  border-color: var(--brand);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:root[data-theme="light"] .preview-content-item.active {
  background: rgba(59, 130, 246, 0.06);
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand);
}

:root[data-theme="light"] .preview-content-item.active::after {
  background: var(--brand);
  box-shadow: none;
}

:root[data-theme="light"] .content-icon {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid #ECECF1;
}

:root[data-theme="light"] .content-icon :deep(.t-icon) {
  filter: none;
}

:root[data-theme="light"] .content-display-header {
  border-bottom: 1px solid #ECECF1;
}

:root[data-theme="light"] .display-title {
  color: var(--text-primary);
  text-shadow: none;
}

:root[data-theme="light"] .pdf-placeholder,
:root[data-theme="light"] .image-placeholder,
:root[data-theme="light"] .web-placeholder {
  background: #F7F7F8;
  border: 1px solid #ECECF1;
}

:root[data-theme="light"] .pdf-placeholder :deep(.t-icon),
:root[data-theme="light"] .image-placeholder :deep(.t-icon),
:root[data-theme="light"] .web-placeholder :deep(.t-icon) {
  filter: none;
}

:root[data-theme="light"] .preview-display::-webkit-scrollbar-track {
  background: #F7F7F8;
}

:root[data-theme="light"] .preview-display::-webkit-scrollbar-thumb {
  background: #D9D9E3;
}

:root[data-theme="light"] .preview-display::-webkit-scrollbar-thumb:hover {
  background: #C4C4CF;
}

:root[data-theme="light"] .empty-icon {
  filter: none;
  animation: none;
}

:root[data-theme="light"] .empty-title {
  color: var(--text-primary);
  text-shadow: none;
}

:root[data-theme="light"] .empty-description {
  color: var(--text-secondary);
}

:root[data-theme="light"] .hint-item {
  background: #FFFFFF;
  border: 1px solid #ECECF1;
}

:root[data-theme="light"] .hint-item:hover {
  background: #F7F7F8;
  border-color: var(--brand);
}

:root[data-theme="light"] .hint-item :deep(.t-icon) {
  filter: none;
}

/* ========================================
   科技感响应式适配
   ======================================== */
@media (max-width: 768px) {
  .preview-area {
    width: 100%;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: -4px 0 30px rgba(0, 0, 0, 0.5);
  }

  .preview-content-list {
    max-height: 160px;
  }

  .preview-display {
    padding: 18px;
  }

  .empty-title {
    font-size: 18px;
  }

  .empty-description {
    font-size: 14px;
  }
}

/* ========================================
   减少动画 - 可访问性
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .preview-area::before {
    animation: none;
  }

  .empty-icon {
    animation: none;
  }

  .preview-content-item::before {
    animation: none;
  }
}
</style>
