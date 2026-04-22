import { defineConfig } from 'vite';                 // Vite 配置入口
import react from '@vitejs/plugin-react';             // React 支持
import path from 'node:path';                         // 路径工具

export default defineConfig({
  plugins: [react()],
  base: './',                                         // 相对路径 - 同时支持 http 与 file:// (Electron)
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }    // @ 别名指向 src
  },
  server: { port: 5173, host: '127.0.0.1' },          // 本地开发端口
  preview: { port: 4173, host: '127.0.0.1' },          // 预览端口
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-core';
          }
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design') || id.includes('@ctrl/tinycolor')) {
            return 'antd-ui';
          }
          if (id.includes('node_modules/dexie')) {
            return 'data-layer';
          }
          if (id.includes('node_modules/echarts') || id.includes('node_modules/echarts-for-react')) {
            return 'charts';
          }
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror') || id.includes('node_modules/@tiptap/pm')) {
            return 'editor';
          }
        }
      }
    }
  }        // 生产构建
});
