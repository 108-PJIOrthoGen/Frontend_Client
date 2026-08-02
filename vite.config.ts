import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react-swc'
import path from 'path';
import dns from 'dns';

dns.setDefaultResultOrder('verbatim')
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devBackendTarget = env.VITE_DEV_BACKEND_TARGET || 'http://127.0.0.1:8085'
  return {
    plugins: [
      react(),
      // visualizer() as PluginOption
    ],
    //Thay đổi base thành tên repository của bạn để GitHub Pages load đúng đường dẫn file CSS/JS.
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    server: {
      host: true,
      port: Number(env.PORT) || Number(process.env.PORT) || 5173,
      strictPort: true,
      proxy: command === 'serve'
        ? {
            '/api': {
              target: devBackendTarget,
              changeOrigin: true,
              configure: (proxy) => {
                // The browser request is same-origin with Vite. Do not forward
                // its LAN Origin to Spring as a new cross-origin request.
                proxy.on('proxyReq', (proxyRequest) => {
                  proxyRequest.removeHeader('origin')
                })
              },
            },
          }
        : undefined,
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'window', // Define 'global' as 'window' for browser compatibility
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/"),
        components: `${path.resolve(__dirname, "./src/components/")}`,
        styles: `${path.resolve(__dirname, "./src/styles/")}`,
        apis: `${path.resolve(__dirname, "./src/apis/")}`,
        pages: `${path.resolve(__dirname, "./src/pages/")}`,
        assets: `${path.resolve(__dirname, "./src/assets/")}`,
        config: `${path.resolve(__dirname, "./src/config/")}`,
      },
    },
  }
})
