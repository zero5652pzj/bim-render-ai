import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import viteCompression from 'vite-plugin-compression'
import { mcpPlugin } from './vite-plugin-mcp'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    mcpPlugin(), // MCP开发服务器插件
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    // 移除API代理配置 - 直接调用Vercel Edge Functions
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3004',
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path,
    //   },
    // },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'tdesign': ['tdesign-vue-next', '@tdesign-vue-next/chat'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', '@supabase/supabase-js'],
  },
})
