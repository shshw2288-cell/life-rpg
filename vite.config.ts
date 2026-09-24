import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // 상대 경로로 빌드하면 GitHub Pages처럼 하위 경로에 올려도 그대로 동작한다
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    // 같은 와이파이의 다른 기기에서도 접속할 수 있게 한다
    host: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
