import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      port: 3001,
      open: true
    },
    define: {
      global: 'globalThis',
      __DEFINES__: '{}',
    },
    envPrefix: 'VITE_',
  }
})
