import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        target: 'esnext',
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    react: ['react', 'react-dom']
                }
            }
        }
    },
    optimizeDeps: {
        include: ['three', 'react', 'react-dom']
    }
})