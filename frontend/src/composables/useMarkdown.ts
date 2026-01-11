import { marked, Renderer } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github-dark.css'

// 注册常用语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('c#', csharp)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', html)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('css', css)

// 配置 marked 使用自定义渲染器来支持代码高亮
const renderer = new Renderer()

// 重写 code 方法来支持语法高亮（marked v5 使用对象参数）
renderer.code = function({ text, lang }: { text: string; lang?: string; escaped?: boolean }): string {
  const language = lang || ''
  let highlighted: string

  if (language && hljs.getLanguage(language)) {
    try {
      highlighted = hljs.highlight(text, { language }).value
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
    } catch (err) {
      console.error('Highlight.js error:', err)
    }
  }
  // 如果没有指定语言或高亮失败，使用自动检测
  highlighted = hljs.highlightAuto(text).value
  return `<pre><code class="hljs">${highlighted}</code></pre>`
}

// 使用自定义渲染器配置 marked
marked.setOptions({
  renderer,
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true, // 启用 GitHub 风格的 Markdown
})

/**
 * Markdown 渲染 Composable
 */
export function useMarkdown() {
  /**
   * 将 Markdown 文本渲染为 HTML
   * @note marked.parse 返回 Promise<string>，这里使用同步版本 marked.parse
   */
  function renderMarkdown(text: string): string {
    if (!text) return ''

    try {
      // 使用 marked.parse 的同步版本（marked v5+）
      // 对于简单场景，marked.parse 也支持同步调用
      return marked.parse(text) as string
    } catch (err) {
      console.error('Markdown rendering error:', err)
      return text
    }
  }

  /**
   * 异步版本的 Markdown 渲染（用于复杂场景）
   */
  async function renderMarkdownAsync(text: string): Promise<string> {
    if (!text) return ''

    try {
      return await marked.parse(text)
    } catch (err) {
      console.error('Markdown rendering error:', err)
      return text
    }
  }

  /**
   * 提取纯文本（用于预览）
   */
  function extractPlainText(text: string): string {
    if (!text) return ''

    // 移除 Markdown 语法标记
    return text
      .replace(/#{1,6}\s/g, '') // 标题
      .replace(/\*\*(.+?)\*\*/g, '$1') // 粗体
      .replace(/\*(.+?)\*/g, '$1') // 斜体
      .replace(/`(.+?)`/g, '$1') // 行内代码
      .replace(/\n/g, ' ') // 换行
      .trim()
  }

  /**
   * 检测文本是否包含 Markdown 语法
   */
  function containsMarkdown(text: string): boolean {
    if (!text) return false

    const markdownPatterns = [
      /^#{1,6}\s/m, // 标题
      /\*\*.+?\*\*/, // 粗体
      /__.+?__/, // 粗体（替代）
      /\*.+?\*/, // 斜体
      /_.+?_/, // 斜体（替代）
      /`{3}[\s\S]*?`{3}/m, // 代码块
      /`[^`]+`/, // 行内代码
      /^\s*[-*+]\s/m, // 列表
      /^\s*\d+\.\s/m, // 有序列表
      /\[.+?\]\(.+?\)/, // 链接
      /^>\s/m, // 引用
      /^\|.*\|$/m, // 表格
    ]

    return markdownPatterns.some(pattern => pattern.test(text))
  }

  return {
    renderMarkdown,
    extractPlainText,
    containsMarkdown
  }
}
