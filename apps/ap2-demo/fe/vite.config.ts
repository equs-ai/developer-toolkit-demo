import { defineConfig } from 'vite'
import packageJson from './package.json'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
    define: {
      APP_VERSION: JSON.stringify(packageJson.version),
    },
    plugins: [react()],
    server: {
      port: 5202,
      strictPort: true,
    },
  }
})
