import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 新增这一行！！解决静态资源404、本地打开/静态托管白屏
  plugins: [react()],
})