import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    define: {
      APP_VERSION: JSON.stringify(process.env.CI_COMMIT_TAG || process.env.CI_COMMIT_SHORT_SHA || '0.0.0'),
    },
    plugins: [react()],
    server: {
      port: 5201,
      strictPort: true,
    },
  }
})
